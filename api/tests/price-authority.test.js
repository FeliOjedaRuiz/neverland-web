const request = require('supertest');
const app = require('../app');
const Event = require('../models/event.model');
const {
  buildReservation,
  createAdminUser,
  getUserToken,
  createFullConfig
} = require('./helpers/eventFixtures');

jest.mock('../services/google.service', () => ({
  createCalendarEvent: jest.fn().mockResolvedValue({ id: 'mock-google-id' }),
  deleteCalendarEvent: jest.fn().mockResolvedValue(true),
  listEvents: jest.fn().mockResolvedValue([])
}));

jest.mock('../config/mailer.config', () => ({
  sendBookingConfirmationEmail: jest.fn().mockResolvedValue({ messageId: 'mock-booking' })
}));

describe('Autoridad de precio en CREATE', () => {
  let admin;
  let adminToken;

  beforeEach(async () => {
    admin = await createAdminUser();
    adminToken = getUserToken(admin);
    await createFullConfig();
  });

  describe('REQ-01: whitelist de campos de precio', () => {
    it('Cliente envía precio manipulado -> se resuelve desde el catálogo', async () => {
      const res = await request(app)
        .post('/api/v1/events')
        .send(buildReservation({
          detalles: { niños: { precioApplied: 0, menuId: 'menu-1' } }
        }));

      expect(res.statusCode).toBe(201);
      expect(res.body.detalles.niños.precioApplied).toBe(15);
      expect(res.body.precioTotal).toBe(180);
    });

    it('El precio enviado por el cliente no queda almacenado', async () => {
      const res = await request(app)
        .post('/api/v1/events')
        .send(buildReservation({
          detalles: { extras: { talleres: ['Magia'], precioTallerApplied: 0 } }
        }));

      expect(res.statusCode).toBe(201);
      expect(res.body.detalles.extras.precioTallerApplied).toBe(25);

      const doc = await Event.findById(res.body.id).lean();
      expect(doc.detalles.extras.precioTallerApplied).toBe(25);
      expect(doc.detalles.extras.precioTallerApplied).not.toBe(0);
    });
  });

  describe('REQ-02: cálculo de snapshots en CREATE', () => {
    it('CREATE con actividades válidas -> cada snapshot refleja el catálogo', async () => {
      const res = await request(app)
        .post('/api/v1/events')
        .send(buildReservation({
          detalles: {
            niños: { cantidad: 12, menuId: 'menu-1' },
            extras: {
              talleres: ['Magia'],
              personajes: ['Princesa'],
              pinata: true,
              catalogoItemIds: ['pinata']
            }
          }
        }));

      expect(res.statusCode).toBe(201);
      expect(res.body.detalles.niños.precioApplied).toBe(15);
      expect(res.body.detalles.extras.precioTallerApplied).toBe(25);
      expect(res.body.detalles.extras.precioPersonajeApplied).toBe(40);
      expect(res.body.detalles.extras.precioPinataApplied).toBe(15);
      expect(res.body.detalles.extras.precioCatalogoApplied).toBe(15);
      expect(res.body.precioTotal).toBe(260);
    });

    it('CREATE con costoExtension negativo en payload -> se calcula desde catálogo', async () => {
      const res = await request(app)
        .post('/api/v1/events')
        .send(buildReservation({
          horario: { extensionMinutos: 30, costoExtension: -50 }
        }));

      expect(res.statusCode).toBe(201);
      expect(res.body.horario.costoExtension).toBe(30);
      expect(res.body.precioTotal).toBe(210);
    });

    it('CREATE con comida de adultos y precioUnitario falseado -> se resuelve desde catálogo', async () => {
      const res = await request(app)
        .post('/api/v1/events')
        .send(buildReservation({
          detalles: {
            adultos: {
              cantidad: 2,
              comida: [{ item: 'Pasteles', cantidad: 2, precioUnitario: 0 }]
            }
          }
        }));

      expect(res.statusCode).toBe(201);
      expect(res.body.detalles.adultos.comida[0].precioUnitario).toBe(16);
      expect(res.body.precioTotal).toBe(212);
    });
  });

  describe('REQ-03: recálculo de precioTotal en CREATE', () => {
    it('Cliente envía precioTotal falso -> se recalcula desde snapshots', async () => {
      const res = await request(app)
        .post('/api/v1/events')
        .send(buildReservation({ precioTotal: 1 }));

      expect(res.statusCode).toBe(201);
      expect(res.body.precioTotal).toBe(180);

      const doc = await Event.findById(res.body.id).lean();
      expect(doc.precioTotal).toBe(180);
    });
  });

  describe('REQ-08: respuestas con snapshots', () => {
    it('GET de reserva incluye los snapshots calculados', async () => {
      const createRes = await request(app)
        .post('/api/v1/events')
        .send(buildReservation());

      expect(createRes.statusCode).toBe(201);

      const res = await request(app)
        .get(`/api/v1/events/${createRes.body.id}/public`);

      expect(res.statusCode).toBe(200);
      expect(res.body.detalles.niños.precioApplied).toBe(15);
      expect(res.body.precioTotal).toBe(180);
    });
  });

  describe('Casos límite', () => {
    it('precioUnitario: 0 en CREATE -> calcular desde catálogo', async () => {
      const res = await request(app)
        .post('/api/v1/events')
        .send(buildReservation({
          detalles: {
            adultos: {
              cantidad: 1,
              comida: [{ item: 'Pasteles', cantidad: 1, precioUnitario: 0 }]
            }
          }
        }));

      expect(res.statusCode).toBe(201);
      expect(res.body.detalles.adultos.comida[0].precioUnitario).toBe(16);
      expect(res.body.precioTotal).toBe(196);
    });

    it('Payload front con precioTotal (PWA cache) -> ignorado sin error', async () => {
      const res = await request(app)
        .post('/api/v1/events')
        .send(buildReservation({ precioTotal: 99999 }));

      expect(res.statusCode).toBe(201);
      expect(res.body.precioTotal).toBe(180);
    });

    it('Admin envía snapshots falsificados -> el servidor resuelve desde catálogo y conserva costoExtra', async () => {
      const res = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(buildReservation({
          precioTotal: 1,
          detalles: {
            extras: {
              costoExtra: -20,
              talleres: ['Magia'],
              precioTallerApplied: 0,
              personajes: ['Princesa'],
              precioPersonajeApplied: 0
            },
            adultos: {
              cantidad: 1,
              comida: [{ item: 'Pasteles', cantidad: 1, precioUnitario: 0 }]
            }
          },
          horario: { extensionMinutos: 30, costoExtension: 0 }
        }));

      expect(res.statusCode).toBe(201);
      expect(res.body.detalles.extras.costoExtra).toBe(-20);
      expect(res.body.detalles.extras.precioTallerApplied).toBe(25);
      expect(res.body.detalles.extras.precioPersonajeApplied).toBe(40);
      expect(res.body.detalles.adultos.comida[0].precioUnitario).toBe(16);
      expect(res.body.horario.costoExtension).toBe(30);
      // 12*15 (niños) + 25 (taller) + 40 (personaje) + 16 (comida) + 30 (extensión) - 20 (descuento)
      expect(res.body.precioTotal).toBe(271);
    });
  });
});
