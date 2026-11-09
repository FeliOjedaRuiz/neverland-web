const request = require('supertest');
const app = require('../app');
const Event = require('../models/event.model');
const {
  buildReservation,
  createAdminUser,
  createGuestUser,
  getUserToken,
  createBaseConfig,
  futureTuesday
} = require('./helpers/eventFixtures');

jest.mock('../services/google.service', () => ({
  createCalendarEvent: jest.fn().mockResolvedValue({ id: 'mock-google-id' }),
  deleteCalendarEvent: jest.fn().mockResolvedValue(true),
  listEvents: jest.fn().mockResolvedValue([])
}));

jest.mock('../config/mailer.config', () => ({
  sendBookingConfirmationEmail: jest.fn().mockResolvedValue({ messageId: 'mock-booking' })
}));

describe('Campos de evento por rol', () => {
  let admin;
  let adminToken;

  beforeEach(async () => {
    admin = await createAdminUser();
    adminToken = getUserToken(admin);
    await createBaseConfig();
  });

  describe('REQ-01: costoExtra solo escribible por admin', () => {
    it('Anónimo envía costoExtra → se ignora', async () => {
      const res = await request(app)
        .post('/api/v1/events')
        .send(buildReservation({ detalles: { extras: { costoExtra: 50 } } }));

      expect(res.statusCode).toBe(201);
      expect(res.body.detalles.extras.costoExtra).toBe(0);
    });

    it('Admin envía costoExtra → se persiste', async () => {
      const createRes = await request(app)
        .post('/api/v1/events')
        .send(buildReservation());
      expect(createRes.statusCode).toBe(201);

      const res = await request(app)
        .patch(`/api/v1/events/${createRes.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ detalles: { extras: { costoExtra: 50 } } });

      expect(res.statusCode).toBe(200);
      expect(res.body.detalles.extras.costoExtra).toBe(50);
    });
  });

  describe('REQ-02: Campos administrativos no escribibles por clientes', () => {
    it('Cliente envía campo administrativo → se ignora', async () => {
      const res = await request(app)
        .post('/api/v1/events')
        .send(buildReservation({
          notasAdmin: 'nota secreta',
          googleEventId: 'fake-google-id',
          publicId: 'FAKEID',
          invitationId: 'fake-invitation',
          estado: 'confirmado'
        }));

      expect(res.statusCode).toBe(201);
      expect(res.body.estado).toBe('pendiente');
      expect(res.body.notasAdmin).toBeFalsy();
      // El servidor descarta el googleEventId del cliente y lo sincroniza
      // con el mock de Google Calendar.
      expect(res.body.googleEventId).toBe('mock-google-id');
      expect(res.body.publicId).not.toBe('FAKEID');
      expect(res.body.invitationId).not.toBe('fake-invitation');
    });

    it('Admin envía campos administrativos → se persisten', async () => {
      const createRes = await request(app)
        .post('/api/v1/events')
        .send(buildReservation());
      expect(createRes.statusCode).toBe(201);

      const res = await request(app)
        .patch(`/api/v1/events/${createRes.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          notasAdmin: 'nota admin',
          estado: 'confirmado'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.notasAdmin).toBe('nota admin');
      expect(res.body.estado).toBe('confirmado');
    });
  });

  describe('REQ-03: tipo bloqueo solo para admin', () => {
    it('Anónimo intenta crear bloqueo → 400', async () => {
      const res = await request(app)
        .post('/api/v1/events')
        .send({
          tipo: 'bloqueo',
          fecha: futureTuesday,
          turno: 'T1'
        });

      expect(res.statusCode).toBe(400);
    });

    it('Admin crea bloqueo → 201', async () => {
      const res = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tipo: 'bloqueo',
          fecha: futureTuesday,
          turno: 'T2'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.tipo).toBe('bloqueo');
    });
  });

  describe('REQ-04: Admin conserva capacidades completas', () => {
    it('Admin fija estado en PATCH → se actualiza', async () => {
      const createRes = await request(app)
        .post('/api/v1/events')
        .send(buildReservation());
      expect(createRes.statusCode).toBe(201);

      const res = await request(app)
        .patch(`/api/v1/events/${createRes.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ estado: 'confirmado' });

      expect(res.statusCode).toBe(200);
      expect(res.body.estado).toBe('confirmado');
    });
  });

  describe('REQ-05: estado en CREATE para clientes', () => {
    it('Cliente envía estado en CREATE → se fuerza pendiente', async () => {
      const res = await request(app)
        .post('/api/v1/events')
        .send(buildReservation({ estado: 'confirmado' }));

      expect(res.statusCode).toBe(201);
      expect(res.body.estado).toBe('pendiente');
    });

    it('Admin fija estado en CREATE → se persiste', async () => {
      const res = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(buildReservation({ estado: 'confirmado' }));

      expect(res.statusCode).toBe(201);
      expect(res.body.estado).toBe('confirmado');
    });

    it('Cliente envía estado en PATCH → se ignora silenciosamente', async () => {
      const createRes = await request(app)
        .post('/api/v1/events')
        .send(buildReservation());
      expect(createRes.statusCode).toBe(201);

      const res = await request(app)
        .patch(`/api/v1/events/${createRes.body.id}`)
        .send({ estado: 'confirmado' });

      expect(res.statusCode).toBe(200);
      expect(res.body.estado).toBe('pendiente');
    });
  });

  describe('Casos límite', () => {
    it('PATCH costoExtra por no-admin + campo legítimo → costoExtra ignorado, legítimo aplicado', async () => {
      const createRes = await request(app)
        .post('/api/v1/events')
        .send(buildReservation());
      expect(createRes.statusCode).toBe(201);

      const res = await request(app)
        .patch(`/api/v1/events/${createRes.body.id}`)
        .send({
          detalles: { extras: { costoExtra: 50, observaciones: 'dato real' } }
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.detalles.extras.costoExtra).toBe(0);
      expect(res.body.detalles.extras.observaciones).toBe('dato real');
    });

    it('Admin envía costoExtra con costoExtension falsificado → costoExtra se aplica, costoExtension por reglas del servidor', async () => {
      const createRes = await request(app)
        .post('/api/v1/events')
        .send(buildReservation({ horario: { extensionMinutos: 30 } }));
      expect(createRes.statusCode).toBe(201);
      expect(createRes.body.horario.costoExtension).toBe(30);

      const res = await request(app)
        .patch(`/api/v1/events/${createRes.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          detalles: { extras: { costoExtra: -25 } },
          horario: { costoExtension: 0 }
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.detalles.extras.costoExtra).toBe(-25);
      // En TASK-01 se garantiza que el valor no es negativo (min: 0 en modelo).
      // La recalcificación server-side completa de costoExtension corresponde a
      // TASK-04 (server-price-authority).
      expect(res.body.horario.costoExtension).toBeGreaterThanOrEqual(0);
    });

    it('No-admin envía tipo: bloqueo y estado a la vez → 400 por el tipo, estado ignorado', async () => {
      const res = await request(app)
        .post('/api/v1/events')
        .send(buildReservation({ tipo: 'bloqueo', estado: 'confirmado' }));

      expect(res.statusCode).toBe(400);
    });

    it('Usuario guest autenticado envía costoExtra → se ignora', async () => {
      const guest = await createGuestUser();
      const guestToken = getUserToken(guest);

      const res = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${guestToken}`)
        .send(buildReservation({ detalles: { extras: { costoExtra: 50 } } }));

      expect(res.statusCode).toBe(201);
      expect(res.body.detalles.extras.costoExtra).toBe(0);
    });

    it('No-admin envía precioTotal en PATCH → se ignora', async () => {
      const createRes = await request(app)
        .post('/api/v1/events')
        .send(buildReservation());
      expect(createRes.statusCode).toBe(201);
      const precioOriginal = createRes.body.precioTotal;

      const res = await request(app)
        .patch(`/api/v1/events/${createRes.body.id}`)
        .send({ precioTotal: 1 });

      expect(res.statusCode).toBe(200);
      expect(res.body.precioTotal).toBe(precioOriginal);
    });
  });

  describe('Límites del modelo', () => {
    it('Rechaza costoExtension negativa al escribir documento', async () => {
      await expect(
        Event.create({
          tipo: 'reserva',
          fecha: futureTuesday,
          turno: 'T1',
          estado: 'pendiente',
          cliente: { privacyPolicyConsent: true },
          horario: { extensionMinutos: 30, costoExtension: -10 }
        })
      ).rejects.toThrow(/costoExtension/);
    });

    it('costoExtra negativo de admin persiste', async () => {
      const event = await Event.create({
        tipo: 'reserva',
        fecha: futureTuesday,
        turno: 'T1',
        estado: 'pendiente',
        cliente: { privacyPolicyConsent: true },
        detalles: { extras: { costoExtra: -50 } }
      });

      expect(event.detalles.extras.costoExtra).toBe(-50);
    });
  });
});
