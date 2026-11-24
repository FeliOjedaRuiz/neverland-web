const request = require('supertest');
const app = require('../app'); // Importamos la aplicación, pero sin arrancar el puerto
const Event = require('../models/event.model');
const mongoose = require('mongoose');

// Mock de Google Calendar Service para evitar llamadas reales a internet durante los tests
jest.mock('../services/google.service', () => ({
  createCalendarEvent: jest.fn().mockResolvedValue({ id: 'mock-google-id' }),
  deleteCalendarEvent: jest.fn().mockResolvedValue(true),
  listEvents: jest.fn().mockResolvedValue([])
}));

const getFutureDate = (daysAhead = 30) => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString();
};

describe('Detalle público de reserva - resolución por publicId', () => {
  // El pre-save hook del modelo consulta la colección para generar el
  // invitationId, así que hay que esperar a que la conexión esté lista.
  beforeAll(async () => {
    await mongoose.connection.asPromise();
  });

  // El enlace que recibe el cliente final ("Gestiona tu reserva aquí") apunta a
  // /mi-reserva/<publicId>. El publicId es un código corto de 6 caracteres, NO un
  // ObjectId de Mongo, así que el detalle público debe resolverlo por publicId.
  it('Debería resolver la reserva por su publicId corto', async () => {
    const event = await Event.create({      tipo: 'reserva',
      publicId: 'AAA111',
      fecha: getFutureDate(),
      turno: 'T1',
      estado: 'pendiente',
      cliente: {
        nombreNiño: 'Pedrito',
        nombrePadre: 'Juan Pérez',
        email: 'juan@example.com',
        telefono: '123456789',
        privacyPolicyConsent: true
      },
      detalles: { niños: { cantidad: 15, menuId: 'menu-1' } }
    });

    expect(event.publicId).toHaveLength(6);

    const res = await request(app).get(`/api/v1/events/${event.publicId}/public`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.id).toEqual(event.id);
    expect(res.body.publicId).toEqual(event.publicId);
  });

  it('Debería seguir resolviendo la reserva por su ObjectId', async () => {
    const event = await Event.create({
      tipo: 'reserva',
      publicId: 'BBB222',
      fecha: getFutureDate(),
      turno: 'T2',
      estado: 'pendiente',
      cliente: {
        nombreNiño: 'Pedrito',
        nombrePadre: 'Juan Pérez',
        email: 'juan@example.com',
        telefono: '123456789',
        privacyPolicyConsent: true
      },
      detalles: { niños: { cantidad: 15, menuId: 'menu-1' } }
    });

    const res = await request(app).get(`/api/v1/events/${event.id}/public`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.id).toEqual(event.id);
  });

  it('Debería devolver 404 cuando el identificador no corresponde a ninguna reserva', async () => {
    const res = await request(app).get('/api/v1/events/NOEXISTE/public');

    expect(res.statusCode).toEqual(404);
  });
});
