const request = require('supertest');
const app = require('../app');
const Taller = require('../models/taller.model');
const User = require('../models/user.model');
const talleres = require('../controllers/talleres.controllers');
const jwt = require('jsonwebtoken');

// Mock de Google Calendar Service y mailer para evitar llamadas reales
// durante los tests (mismo patrón que talleres.test.js / pago-reserva.test.js).
jest.mock('../services/google.service', () => ({
  createCalendarEvent: jest.fn().mockResolvedValue({ id: 'mock-google-id' }),
  deleteCalendarEvent: jest.fn().mockResolvedValue(true),
  listEvents: jest.fn().mockResolvedValue([]),
  createTallerCalendarEvent: jest.fn().mockResolvedValue({ id: 'mock-taller-event-id' }),
}));

jest.mock('../config/mailer.config', () => ({
  sendBookingConfirmationEmail: jest.fn().mockResolvedValue({ messageId: 'mock-booking' }),
  sendTallerConfirmationEmail: jest.fn().mockResolvedValue({ messageId: 'mock-taller' }),
}));

// --- Setup: usuarios en MongoMemoryServer ---
// setup.js hace afterEach que borra TODAS las colecciones, así que recreamos
// los usuarios en beforeEach (patrón de pago-reserva.test.js).
let admin;
let guest;

beforeEach(async () => {
  admin = await User.create({
    name: 'Ada',
    surname: 'Admin',
    email: 'admin-pago-taller@neverland.test',
    password: 'test1234',
    role: 'admin',
  });
  guest = await User.create({
    name: 'Gus',
    surname: 'Guest',
    email: 'guest-pago-taller@neverland.test',
    password: 'test1234',
    role: 'guest',
  });
});

// Token JWT firmado con el _id real del usuario creado en BD
const tokenDe = (user) =>
  jwt.sign({ sub: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

const tallerBase = {
  nombre: 'Pintacaras',
  descripcion: 'Pintacaras para todos',
  precio: 30,
  aforo: 8,
  fecha: '2027-06-15T00:00:00.000Z',
  turnos: ['T1'],
  horario: { inicio: '10:00', fin: '12:00' },
  publico: true,
};

const inscripcionBase = {
  nombreNiño: 'Dina',
  edadNiño: 6,
  nombreResponsable: 'Rosa',
  telefonoResponsable: '123456789',
  emailResponsable: 'rosa@example.com',
  privacyPolicyConsent: true,
};

// Crea un taller con una inscripción ya metida (los defaults del schema
// hacen que `pagoTaller` nazca en false).
const crearTallerConInscripcion = async () =>
  Taller.create({
    ...tallerBase,
    inscripciones: [{ ...inscripcionBase }],
  });

const patchInscripcion = (tallerId, inscripcionId, body, token) => {
  const req = request(app).patch(
    `/api/v1/talleres/${tallerId}/inscripciones/${inscripcionId}`
  );
  if (token) req.set('Authorization', `Bearer ${token}`);
  return req.send(body);
};

describe('Pago del taller (pagoTaller) — estado de pago de la inscripción', () => {
  it('Admin: marcar pagoTaller=true persiste el booleano y estampa pagoTallerFecha', async () => {
    const taller = await crearTallerConInscripcion();
    const inscId = taller.inscripciones[0]._id;

    const res = await patchInscripcion(taller.id, inscId, { pagoTaller: true }, tokenDe(admin));

    expect(res.statusCode).toBe(200);
    expect(res.body.inscripciones[0].pagoTaller).toBe(true);
    expect(res.body.inscripciones[0].pagoTallerFecha).toBeTruthy();

    const enBD = await Taller.findById(taller.id);
    expect(enBD.inscripciones[0].pagoTaller).toBe(true);
    expect(enBD.inscripciones[0].pagoTallerFecha).toBeInstanceOf(Date);
  });

  it('Admin: volver a false limpia la fecha de pago (no queda la del pago anterior)', async () => {
    const taller = await crearTallerConInscripcion();
    const inscId = taller.inscripciones[0]._id;

    await patchInscripcion(taller.id, inscId, { pagoTaller: true }, tokenDe(admin));
    const res = await patchInscripcion(taller.id, inscId, { pagoTaller: false }, tokenDe(admin));

    expect(res.statusCode).toBe(200);
    expect(res.body.inscripciones[0].pagoTaller).toBe(false);
    // null o ausente: lo importante es que NO sobreviva la fecha anterior
    expect(res.body.inscripciones[0].pagoTallerFecha || null).toBeNull();

    const enBD = await Taller.findById(taller.id);
    expect(enBD.inscripciones[0].pagoTaller).toBe(false);
    expect(enBD.inscripciones[0].pagoTallerFecha || null).toBeNull();
  });

  // NOTA: la ruta PATCH /talleres/:id/inscripciones/:inscripcionId tiene
  // `secure.isAdmin` DESDE SU CREACIÓN (commit 8cfd0c9), así que un no-admin
  // no llega al controller: lo corta el middleware con 401. El guard 403
  // dentro de `editarInscripcion` es DEFENSA EN PROFUNDIDAD (cubierto por
  // test unitario más abajo), alcanzable solo si la ruta cambiara a
  // optionalAuth como la de events.
  it('No-admin: NO puede marcar el pago → 401 del middleware y la BD no cambia', async () => {
    const taller = await crearTallerConInscripcion();
    const inscId = taller.inscripciones[0]._id;

    const res = await patchInscripcion(taller.id, inscId, { pagoTaller: true }, tokenDe(guest));

    expect(res.statusCode).toBe(401);

    const enBD = await Taller.findById(taller.id);
    expect(enBD.inscripciones[0].pagoTaller).toBe(false);
    expect(enBD.inscripciones[0].pagoTallerFecha || null).toBeNull();
  });

  it('No-admin: NO puede escribir pagoTallerFecha → 401 del middleware y la BD no cambia', async () => {
    const taller = await crearTallerConInscripcion();
    const inscId = taller.inscripciones[0]._id;

    const res = await patchInscripcion(
      taller.id,
      inscId,
      { pagoTallerFecha: '2020-01-01T00:00:00.000Z' },
      tokenDe(guest)
    );

    expect(res.statusCode).toBe(401);

    const enBD = await Taller.findById(taller.id);
    expect(enBD.inscripciones[0].pagoTaller).toBe(false);
    expect(enBD.inscripciones[0].pagoTallerFecha || null).toBeNull();
  });

  it('Anónimo (sin token): NO puede marcar el pago → 401 del middleware', async () => {
    const taller = await crearTallerConInscripcion();
    const inscId = taller.inscripciones[0]._id;

    const res = await patchInscripcion(taller.id, inscId, { pagoTaller: true });

    expect(res.statusCode).toBe(401);

    const enBD = await Taller.findById(taller.id);
    expect(enBD.inscripciones[0].pagoTaller).toBe(false);
  });

  // --- Guard del controller (defensa en profundidad) ---
  // El middleware `secure.isAdmin` hace que este guard sea inalcanzable por
  // HTTP hoy, así que se ejercita llamando al controller directamente con un
  // `req` simulado: protege la invariante aunque la ruta cambie a optionalAuth.
  describe('Guard del controller (unitario, sin pasar por la ruta)', () => {
    const llamarController = async (req) => {
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
      const next = jest.fn();
      await talleres.editarInscripcion(req, res, next);
      return { res, next };
    };

    it('No-admin que intenta cambiar pagoTaller → next recibe un error 403', async () => {
      const { next, res } = await llamarController({
        user: { role: 'guest' },
        body: { pagoTaller: true },
        params: { id: '64b000000000000000000001', inscripcionId: '64b000000000000000000002' },
      });

      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error.status).toBe(403);
      expect(error.message).toMatch(/permiso para cambiar el estado de pago/);
      expect(res.json).not.toHaveBeenCalled();
    });

    it('No-admin que intenta escribir pagoTallerFecha → next recibe un error 403', async () => {
      const { next } = await llamarController({
        user: { role: 'guest' },
        body: { pagoTallerFecha: '2020-01-01T00:00:00.000Z' },
        params: { id: '64b000000000000000000001', inscripcionId: '64b000000000000000000002' },
      });

      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error.status).toBe(403);
      expect(error.message).toMatch(/fecha de pago/);
    });
  });

  it('Admin: enviar pagoTallerFecha junto a pagoTaller NO permite fijar una fecha arbitraria', async () => {
    const taller = await crearTallerConInscripcion();
    const inscId = taller.inscripciones[0]._id;

    const res = await patchInscripcion(
      taller.id,
      inscId,
      { pagoTaller: true, pagoTallerFecha: '2020-01-01T00:00:00.000Z' },
      tokenDe(admin)
    );

    expect(res.statusCode).toBe(200);
    const enBD = await Taller.findById(taller.id);
    const fecha = enBD.inscripciones[0].pagoTallerFecha;
    expect(fecha).toBeTruthy();
    // La fecha la estampa el servidor: NO puede ser la arbitraria del payload
    expect(fecha.getUTCFullYear()).not.toBe(2020);
  });

  it('Inscripción legacy SIN el campo en BD lee pagoTaller=false (sin migración)', async () => {
    const taller = await crearTallerConInscripcion();
    const inscId = taller.inscripciones[0]._id;

    // Simula un documento anterior al cambio de schema: se inserta el
    // subdocumento SIN pagoTaller ni pagoTallerFecha (insertOne bypasea
    // los defaults de Mongoose).
    await Taller.collection.updateOne(
      { _id: taller._id },
      {
        $unset: {
          'inscripciones.0.pagoTaller': '',
          'inscripciones.0.pagoTallerFecha': '',
        },
      }
    );

    // El admin ve las inscripciones completas en el detalle
    const res = await request(app)
      .get(`/api/v1/talleres/${taller.id}`)
      .set('Authorization', `Bearer ${tokenDe(admin)}`);

    expect(res.statusCode).toBe(200);
    const inscLegacy = res.body.inscripciones.find((i) => String(i._id) === String(inscId));
    // Mongoose aplica el `default: false` al hidratar documentos antiguos
    expect(inscLegacy.pagoTaller).toBe(false);
    expect(inscLegacy.pagoTallerFecha || null).toBeNull();
  });

  it('El detalle admin expone pagoTaller y pagoTallerFecha en las inscripciones', async () => {
    const taller = await crearTallerConInscripcion();
    const inscId = taller.inscripciones[0]._id;
    await patchInscripcion(taller.id, inscId, { pagoTaller: true }, tokenDe(admin));

    const res = await request(app)
      .get(`/api/v1/talleres/${taller.id}`)
      .set('Authorization', `Bearer ${tokenDe(admin)}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.inscripciones)).toBe(true);
    expect(res.body.inscripciones[0].pagoTaller).toBe(true);
    expect(res.body.inscripciones[0].pagoTallerFecha).toBeTruthy();
  });

  it('Togglear pagoTaller NO altera el precio ni el aforo del taller', async () => {
    const taller = await crearTallerConInscripcion();
    const inscId = taller.inscripciones[0]._id;

    const resTrue = await patchInscripcion(taller.id, inscId, { pagoTaller: true }, tokenDe(admin));
    expect(resTrue.statusCode).toBe(200);
    expect(resTrue.body.precio).toBe(30);
    expect(resTrue.body.aforo).toBe(8);
    expect(resTrue.body.inscripciones.length).toBe(1);

    const resFalse = await patchInscripcion(taller.id, inscId, { pagoTaller: false }, tokenDe(admin));
    expect(resFalse.statusCode).toBe(200);
    expect(resFalse.body.precio).toBe(30);
    expect(resFalse.body.aforo).toBe(8);
    expect(resFalse.body.inscripciones.length).toBe(1);

    const enBD = await Taller.findById(taller.id);
    expect(enBD.precio).toBe(30);
    expect(enBD.aforo).toBe(8);
    expect(enBD.inscripciones.length).toBe(1);
  });

  it('inscribir (ruta PÚBLICA) hace nacer la inscripción con pagoTaller=false', async () => {
    const taller = await crearTallerConInscripcion();
    // La inscripción creada arriba ya tiene pagoTaller=false por el default;
    // aquí se verifica además que el POST público no permite nacer pagada.
    const res = await request(app)
      .post(`/api/v1/talleres/${taller.id}/inscripciones`)
      .send({ ...inscripcionBase, emailResponsable: 'nuevo@example.com', pagoTaller: true });

    expect(res.statusCode).toBe(201);

    const enBD = await Taller.findById(taller.id);
    expect(enBD.inscripciones.length).toBe(2);
    expect(enBD.inscripciones[1].pagoTaller).toBe(false);
  });
});
