const request = require('supertest');
const app = require('../app');
const Event = require('../models/event.model');
const Config = require('../models/config.model');

// Mock de Google Calendar Service
jest.mock('../services/google.service', () => ({
  createCalendarEvent: jest.fn().mockResolvedValue({ id: 'mock-google-id' }),
  deleteCalendarEvent: jest.fn().mockResolvedValue(true),
  listEvents: jest.fn().mockResolvedValue([])
}));

describe('Flujo Presupuesto → Reserva (Budget Stepper Flow)', () => {

  // Datos base reutilizables: simula lo que BudgetPage envía al servidor
  const budgetFlowPayload = {
    tipo: 'reserva',
    fecha: '2026-07-10T00:00:00.000Z', // Viernes
    turno: 'T2',
    cliente: {
      nombreNiño: 'Martina',
      edadNiño: 6,
      nombrePadre: 'Carlos García',
      telefono: '+34612345678',
      email: 'carlos@example.com',
      privacyPolicyConsent: true,
      marketingConsent: false,
      fechaConsentimiento: new Date().toISOString()
    },
    precioTotal: 999, // El servidor DEBE recalcular — nunca confiar en el frontend
    detalles: {
      niños: { cantidad: 15, menuId: 'menu-1' },
      adultos: { cantidad: 5, comida: [] },
      extras: {
        taller: 'Magia',
        personaje: 'ninguno',
        pinata: true,
        observaciones: 'Mesa cerca de la puerta',
        alergenos: 'Frutos secos',
        extension: 0,
        extensionType: 'default'
      }
    },
    horario: {
      inicio: '18:00',
      fin: '20:00',
      extensionMinutos: 0,
      horaFinalEstimada: '18:00 - 20:00',
      costoExtension: 0
    }
  };

  beforeEach(async () => {
    // Configuración de precios base (simula lo que devuelve /api/v1/config)
    await Config.create({
      menusNiños: [
        { id: 'menu-1', nombre: 'Menú Aventura', precio: 15 },
        { id: 'menu-2', nombre: 'Menú Pirata', precio: 18 }
      ],
      plusFinDeSemana: 1.5,
      preciosAdultos: [],
      workshops: [{ name: 'Magia', priceBase: 25, pricePlus: 30 }],
      characters: [{ name: 'Minnie', precio: 40 }],
      preciosExtras: { personaje: 40, pinata: 15, extension30: 30, extension60: 50 }
    });
  });

  // =====================================================
  // REGRESIÓN CRÍTICA: el bug que corregimos hoy
  // =====================================================
  describe('Validación del campo "tipo"', () => {
    it('Debería RECHAZAR tipo "presupuesto" (no es un valor válido del enum)', async () => {
      const invalidPayload = { ...budgetFlowPayload, tipo: 'presupuesto' };

      const res = await request(app)
        .post('/api/v1/events')
        .send(invalidPayload);

      // Mongoose rechaza el enum inválido — puede ser 400 o 500 dependiendo del middleware
      expect(res.statusCode).toBeGreaterThanOrEqual(400);
    });

    it('Debería ACEPTAR tipo "reserva" (valor correcto del flujo presupuesto→reserva)', async () => {
      const res = await request(app)
        .post('/api/v1/events')
        .send(budgetFlowPayload);

      expect(res.statusCode).toBe(201);
      expect(res.body.tipo).toBe('reserva');
      expect(res.body).toHaveProperty('publicId');
      expect(res.body).toHaveProperty('invitationId');
    });
  });

  // =====================================================
  // Verificación de precio recalculado por el servidor
  // =====================================================
  describe('Cálculo de precios desde el flujo de presupuesto', () => {
    it('Debería recalcular el precio en el servidor (ignorar precioTotal del frontend)', async () => {
      // El frontend envía precioTotal: 999 — el servidor DEBE ignorarlo y recalcular
      const res = await request(app)
        .post('/api/v1/events')
        .send(budgetFlowPayload);

      expect(res.statusCode).toBe(201);
      // 15 niños * 15€ = 225€ + plus viernes (15 * 1.5€ = 22.5€) + taller base (25€) + piñata (15€) = 287.5€
      expect(res.body.precioTotal).toBe(287.5);
      expect(res.body.precioTotal).not.toBe(999); // Nunca confiar en el frontend
    });

    it('Debería aplicar taller "plus" cuando hay más de 15 niños', async () => {
      const payload = {
        ...budgetFlowPayload,
        fecha: '2026-07-07T00:00:00.000Z', // Martes (sin plus fin de semana)
        detalles: {
          ...budgetFlowPayload.detalles,
          niños: { cantidad: 20, menuId: 'menu-1' },
          extras: { ...budgetFlowPayload.detalles.extras, pinata: false }
        }
      };

      const res = await request(app)
        .post('/api/v1/events')
        .send(payload);

      expect(res.statusCode).toBe(201);
      // 20 niños * 15€ = 300€ + taller plus (30€, porque > 15 niños) = 330€
      expect(res.body.precioTotal).toBe(330);
    });

    it('Debería incluir snapshot del nombre del menú en la respuesta', async () => {
      const res = await request(app)
        .post('/api/v1/events')
        .send(budgetFlowPayload);

      expect(res.statusCode).toBe(201);
      expect(res.body.detalles.niños.menuNombre).toBe('Menú Aventura');
      expect(res.body.detalles.niños.precioApplied).toBe(15);
    });
  });

  // =====================================================
  // Consentimiento GDPR (viene del DataProtectionModal)
  // =====================================================
  describe('Consentimiento GDPR desde el flujo presupuesto', () => {
    it('Debería persistir el consentimiento de privacidad y marketing', async () => {
      const res = await request(app)
        .post('/api/v1/events')
        .send(budgetFlowPayload);

      expect(res.statusCode).toBe(201);
      expect(res.body.cliente.privacyPolicyConsent).toBe(true);
      expect(res.body.cliente.marketingConsent).toBe(false);
      expect(res.body.cliente.fechaConsentimiento).toBeDefined();
    });
  });

  // =====================================================
  // Extensión de horarios (datos que viajan desde extras)
  // =====================================================
  describe('Extensión de horario desde presupuesto', () => {
    it('Debería calcular correctamente el coste de extensión de 30 minutos', async () => {
      const payload = {
        ...budgetFlowPayload,
        fecha: '2026-07-07T00:00:00.000Z', // Martes
        detalles: {
          ...budgetFlowPayload.detalles,
          extras: { ...budgetFlowPayload.detalles.extras, taller: 'ninguno', pinata: false }
        },
        horario: {
          inicio: '17:30',
          fin: '20:00',
          extensionMinutos: 30,
          costoExtension: 30
        }
      };

      const res = await request(app)
        .post('/api/v1/events')
        .send(payload);

      expect(res.statusCode).toBe(201);
      // 15 niños * 15€ = 225€ + extensión 30min (30€) = 255€
      expect(res.body.precioTotal).toBe(255);
      expect(res.body.horario.extensionMinutos).toBe(30);
    });
  });
});
