const request = require('supertest');
const app = require('../app'); // Importamos la aplicación, pero sin arrancar el puerto
const Event = require('../models/event.model');
const User = require('../models/user.model');
const jwt = require('jsonwebtoken');

// Mock de Google Calendar Service para evitar llamadas reales a internet
// durante los tests (mismo patrón que events.test.js).
jest.mock('../services/google.service', () => ({
  createCalendarEvent: jest.fn().mockResolvedValue({ id: 'mock-google-id' }),
  deleteCalendarEvent: jest.fn().mockResolvedValue(true),
  listEvents: jest.fn().mockResolvedValue([])
}));

// Helper para generar fechas futuras garantizadas: evita que los PATCH
// choquen con la ventana de 72h de modificación de reservas.
const getFutureDate = (daysAhead = 30) => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T00:00:00.000Z`;
};

const futureDate = getFutureDate(30);

// --- Setup: usuarios reales en MongoMemoryServer ---
// setup.js hace afterEach que borra TODAS las colecciones, así que recreamos
// los usuarios en beforeEach (patrón de talleres.test.js).
let admin;
let guest;

beforeEach(async () => {
  admin = await User.create({
    name: 'Ada',
    surname: 'Admin',
    email: 'admin-pago@neverland.test',
    password: 'test1234',
    role: 'admin',
  });
  guest = await User.create({
    name: 'Gus',
    surname: 'Guest',
    email: 'guest-pago@neverland.test',
    password: 'test1234',
    role: 'guest',
  });
});

// Token JWT firmado con el _id real del usuario creado en BD
const tokenDe = (user) =>
  jwt.sign({ sub: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

const crearReserva = () =>
  Event.create({
    tipo: 'reserva',
    fecha: futureDate,
    turno: 'T1',
    estado: 'pendiente',
    cliente: {
      nombreNiño: 'Leo',
      nombrePadre: 'Ana',
      email: 'ana@example.com',
      telefono: '123456789',
      privacyPolicyConsent: true,
    },
    detalles: { niños: { cantidad: 12, menuId: 'menu-1' } },
    precioTotal: 180,
  });

const patchPago = (id, body, token) => {
  const req = request(app).patch(`/api/v1/events/${id}`);
  if (token) req.set('Authorization', `Bearer ${token}`);
  return req.send(body);
};

describe('Pago de la señal (pagoReserva) — estado independiente de `estado`', () => {
  it('Admin: marcar pagoReserva=true persiste el booleano y estampa pagoReservaFecha', async () => {
    const reserva = await crearReserva();

    const res = await patchPago(reserva.id, { pagoReserva: true }, tokenDe(admin));

    expect(res.statusCode).toBe(200);
    expect(res.body.pagoReserva).toBe(true);
    expect(res.body.pagoReservaFecha).toBeTruthy();

    const enBD = await Event.findById(reserva.id);
    expect(enBD.pagoReserva).toBe(true);
    expect(enBD.pagoReservaFecha).toBeInstanceOf(Date);
  });

  it('Admin: volver a false limpia la fecha de pago (no queda la del pago anterior)', async () => {
    const reserva = await crearReserva();

    await patchPago(reserva.id, { pagoReserva: true }, tokenDe(admin));
    const res = await patchPago(reserva.id, { pagoReserva: false }, tokenDe(admin));

    expect(res.statusCode).toBe(200);
    expect(res.body.pagoReserva).toBe(false);
    // null o ausente: lo importante es que NO sobreviva la fecha anterior
    expect(res.body.pagoReservaFecha || null).toBeNull();

    const enBD = await Event.findById(reserva.id);
    expect(enBD.pagoReserva).toBe(false);
    expect(enBD.pagoReservaFecha || null).toBeNull();
  });

  it('Cliente (token no-admin): NO puede cambiar pagoReserva → 403', async () => {
    const reserva = await crearReserva();

    const res = await patchPago(reserva.id, { pagoReserva: true }, tokenDe(guest));

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/permiso para cambiar el estado de pago/);

    const enBD = await Event.findById(reserva.id);
    expect(enBD.pagoReserva).toBe(false);
  });

  it('Cliente anónimo (sin token): NO puede cambiar pagoReserva → 403', async () => {
    const reserva = await crearReserva();

    const res = await patchPago(reserva.id, { pagoReserva: true });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/permiso para cambiar el estado de pago/);
  });

  it('Cliente: reenviar pagoReserva con el MISMO valor actual NO devuelve 403 (PWA cacheada)', async () => {
    const reserva = await crearReserva(); // pagoReserva default: false

    const res = await patchPago(reserva.id, { pagoReserva: false }, tokenDe(guest));

    expect(res.statusCode).toBe(200);
    expect(res.body.pagoReserva).toBe(false);
  });

  it('Cliente: NO puede escribir pagoReservaFecha → 403', async () => {
    const reserva = await crearReserva();

    const res = await patchPago(
      reserva.id,
      { pagoReservaFecha: '2026-01-01T00:00:00.000Z' },
      tokenDe(guest)
    );

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/fecha de pago/);
  });

  it('GET /events/:id/public expone pagoReserva (y NO la fecha interna)', async () => {
    const reserva = await crearReserva();
    await patchPago(reserva.id, { pagoReserva: true }, tokenDe(admin));

    const res = await request(app).get(`/api/v1/events/${reserva.id}/public`);

    expect(res.statusCode).toBe(200);
    expect(res.body.pagoReserva).toBe(true);
    // pagoReservaFecha es conciliación interna del admin: no sale al público
    expect(res.body.pagoReservaFecha).toBeUndefined();
  });

  it('Admin: enviar solo pagoReservaFecha NO permite fijar una fecha arbitraria', async () => {
    const reserva = await crearReserva();
    await patchPago(reserva.id, { pagoReserva: true }, tokenDe(admin));

    const fechaOriginal = (await Event.findById(reserva.id)).pagoReservaFecha;

    // El admin intenta reescribir la fecha de conciliación sin cambiar el
    // booleano: la fecha es un DERIVADO del servidor y no se deja escribir.
    const res = await patchPago(
      reserva.id,
      { pagoReservaFecha: '2020-01-01T00:00:00.000Z' },
      tokenDe(admin)
    );

    expect(res.statusCode).toBe(200);
    const enBD = await Event.findById(reserva.id);
    expect(enBD.pagoReservaFecha.getTime()).toBe(fechaOriginal.getTime());
    expect(enBD.pagoReservaFecha.getUTCFullYear()).not.toBe(2020);
  });

  it('Togglear pagoReserva NO cambia precioTotal', async () => {    const reserva = await crearReserva();

    const resTrue = await patchPago(reserva.id, { pagoReserva: true }, tokenDe(admin));
    expect(resTrue.statusCode).toBe(200);
    expect(resTrue.body.pagoReserva).toBe(true);
    expect(resTrue.body.precioTotal).toBe(180);

    const resFalse = await patchPago(reserva.id, { pagoReserva: false }, tokenDe(admin));
    expect(resFalse.statusCode).toBe(200);
    expect(resFalse.body.pagoReserva).toBe(false);
    expect(resFalse.body.precioTotal).toBe(180);

    const enBD = await Event.findById(reserva.id);
    expect(enBD.precioTotal).toBe(180);
  });
});
