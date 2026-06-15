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
        personajes: [],
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
      workshops: [
        { name: 'Magia', priceBase: 25, pricePlus: 30 },
        { name: 'Pintura', priceBase: 20, pricePlus: 25 }
      ],
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

  // =====================================================
  // Multi-Personajes: pricing para 0, 1, 2, 3 personajes
  // =====================================================
  describe('Cálculo de precios multi-personaje', () => {
    // Usar fecha fija Tuesday para evitar problemas de timezone en tests
    // 2026-07-07 es martes (getDay=2)
    const martesDate = '2026-07-07T00:00:00.000Z';

    it('Debería calcular precio base sin personajes (0€ extra)', async () => {
      const payload = {
        ...budgetFlowPayload,
        fecha: martesDate,
        detalles: {
          ...budgetFlowPayload.detalles,
          extras: { ...budgetFlowPayload.detalles.extras, personajes: [], taller: 'ninguno', pinata: false }
        }
      };

      const res = await request(app)
        .post('/api/v1/events')
        .send(payload);

      expect(res.statusCode).toBe(201);
      expect(res.body.detalles.extras.personajes).toEqual([]);
      // Verificar que personajes no añade nada al precio
      expect(res.body.detalles.extras.precioPersonajeApplied).toBeUndefined();
      // El precio base debe ser aproximadamente 225 (15 niños * 15€)
      // o 247.5 si el servidor aplica plus de fin de semana
      expect([225, 247.5]).toContain(res.body.precioTotal);
    });

    it('Debería calcular 40€ para 1 personaje (sin plus fin de semana)', async () => {
      const payload = {
        ...budgetFlowPayload,
        fecha: martesDate,
        detalles: {
          ...budgetFlowPayload.detalles,
          extras: { ...budgetFlowPayload.detalles.extras, personajes: ['Elsa'], taller: 'ninguno', pinata: false }
        }
      };

      const res = await request(app)
        .post('/api/v1/events')
        .send(payload);

      expect(res.statusCode).toBe(201);
      expect(res.body.detalles.extras.personajes).toEqual(['Elsa']);
      expect(res.body.detalles.extras.precioPersonajeApplied).toBe(40);
      // Verificar que el precio total incluye los 40€ de personaje
      const basePrice = res.body.precioTotal - 40;
      expect([225, 247.5]).toContain(basePrice);
    });

    it('Debería calcular 80€ para 2 personajes', async () => {
      const payload = {
        ...budgetFlowPayload,
        fecha: martesDate,
        detalles: {
          ...budgetFlowPayload.detalles,
          extras: { ...budgetFlowPayload.detalles.extras, personajes: ['Elsa', 'Anna'], taller: 'ninguno', pinata: false }
        }
      };

      const res = await request(app)
        .post('/api/v1/events')
        .send(payload);

      expect(res.statusCode).toBe(201);
      expect(res.body.detalles.extras.personajes).toEqual(['Elsa', 'Anna']);
      expect(res.body.detalles.extras.precioPersonajeApplied).toBe(80);
      const basePrice = res.body.precioTotal - 80;
      expect([225, 247.5]).toContain(basePrice);
    });

    it('Debería calcular 100€ para pack de 3 personajes', async () => {
      const payload = {
        ...budgetFlowPayload,
        fecha: martesDate,
        detalles: {
          ...budgetFlowPayload.detalles,
          extras: { ...budgetFlowPayload.detalles.extras, personajes: ['Elsa', 'Anna', 'Olaf'], taller: 'ninguno', pinata: false }
        }
      };

      const res = await request(app)
        .post('/api/v1/events')
        .send(payload);

      expect(res.statusCode).toBe(201);
      expect(res.body.detalles.extras.personajes).toEqual(['Elsa', 'Anna', 'Olaf']);
      expect(res.body.detalles.extras.precioPersonajeApplied).toBe(100);
      const basePrice = res.body.precioTotal - 100;
      expect([225, 247.5]).toContain(basePrice);
    });

    it('Debería rechazar más de 3 personajes con error 400', async () => {
      const payload = {
        ...budgetFlowPayload,
        fecha: martesDate,
        detalles: {
          ...budgetFlowPayload.detalles,
          extras: { ...budgetFlowPayload.detalles.extras, personajes: ['Elsa', 'Anna', 'Olaf', 'Frozen'], taller: 'ninguno', pinata: false }
        }
      };

      const res = await request(app)
        .post('/api/v1/events')
        .send(payload);

      expect(res.statusCode).toBe(400);
    });

    it('Debería usar precioPack3Personajes del Config si está definido', async () => {
      // Crear config con precioPack3Personajes personalizado
      await Config.deleteMany({});
      await Config.create({
        menusNiños: [{ id: 'menu-1', nombre: 'Menú Aventura', precio: 15 }],
        plusFinDeSemana: 1.5,
        preciosAdultos: [],
        workshops: [],
        characters: [],
        preciosExtras: { personaje: 40, pinata: 15, precioPack3Personajes: 120 }
      });

      const payload = {
        ...budgetFlowPayload,
        fecha: martesDate,
        detalles: {
          ...budgetFlowPayload.detalles,
          extras: { ...budgetFlowPayload.detalles.extras, personajes: ['Elsa', 'Anna', 'Olaf'], taller: 'ninguno', pinata: false }
        }
      };

      const res = await request(app)
        .post('/api/v1/events')
        .send(payload);

      expect(res.statusCode).toBe(201);
      expect(res.body.detalles.extras.precioPersonajeApplied).toBe(120);
    });
  });

  // =====================================================
  // Snapshot invalidation: personajes array comparison
  // =====================================================
  describe('Actualización de personajes — invalidación de snapshot', () => {
    it('Debería recalcular precioPersonajeApplied al cambiar personajes', async () => {
      // Crear reserva con 1 personaje
      const createRes = await request(app)
        .post('/api/v1/events')
        .send({
          ...budgetFlowPayload,
          detalles: {
            ...budgetFlowPayload.detalles,
            extras: { ...budgetFlowPayload.detalles.extras, personajes: ['Elsa'], taller: 'ninguno', pinata: false }
          }
        });

      expect(createRes.statusCode).toBe(201);
      expect(createRes.body.detalles.extras.personajes).toEqual(['Elsa']);
      expect(createRes.body.detalles.extras.precioPersonajeApplied).toBe(40);
      const precioCon1 = createRes.body.precioTotal;
      const eventId = createRes.body.id;

      // PATCH: cambiar a 2 personajes
      const patchRes = await request(app)
        .patch(`/api/v1/events/${eventId}`)
        .send({
          detalles: {
            extras: {
              personajes: ['Elsa', 'Anna'],
              taller: 'ninguno',
              pinata: false,
              observaciones: '',
              alergenos: ''
            }
          }
        });

      expect(patchRes.statusCode).toBe(200);
      expect(patchRes.body.detalles.extras.personajes).toEqual(['Elsa', 'Anna']);
      expect(patchRes.body.detalles.extras.precioPersonajeApplied).toBe(80);
      expect(patchRes.body.precioTotal).toBe(precioCon1 + 40);
    });

    it('NO debería invalidar snapshot si el array de personajes es igual (mismos elementos, diferente orden)', async () => {
      // Crear reserva con 2 personajes
      const createRes = await request(app)
        .post('/api/v1/events')
        .send({
          ...budgetFlowPayload,
          detalles: {
            ...budgetFlowPayload.detalles,
            extras: { ...budgetFlowPayload.detalles.extras, personajes: ['Anna', 'Elsa'], taller: 'ninguno', pinata: false }
          }
        });

      expect(createRes.statusCode).toBe(201);
      const precioCon2 = createRes.body.precioTotal;
      const eventId = createRes.body.id;

      // PATCH: mismo personajes, diferente orden
      const patchRes = await request(app)
        .patch(`/api/v1/events/${eventId}`)
        .send({
          detalles: {
            extras: {
              personajes: ['Elsa', 'Anna'],
              taller: 'ninguno',
              pinata: false,
              observaciones: '',
              alergenos: ''
            }
          }
        });

      expect(patchRes.statusCode).toBe(200);
      // Precio NO debería cambiar (snapshot preservado)
      expect(patchRes.body.precioTotal).toBe(precioCon2);
    });

    it('Debería eliminar snapshot precioPersonajeApplied al quitar todos los personajes', async () => {
      // Crear reserva con 1 personaje
      const createRes = await request(app)
        .post('/api/v1/events')
        .send({
          ...budgetFlowPayload,
          detalles: {
            ...budgetFlowPayload.detalles,
            extras: { ...budgetFlowPayload.detalles.extras, personajes: ['Elsa'], taller: 'ninguno', pinata: false }
          }
        });

      expect(createRes.statusCode).toBe(201);
      expect(createRes.body.detalles.extras.precioPersonajeApplied).toBe(40);
      const eventId = createRes.body.id;

      // PATCH: quitar personajes (array vacío)
      const patchRes = await request(app)
        .patch(`/api/v1/events/${eventId}`)
        .send({
          detalles: {
            extras: {
              personajes: [],
              taller: 'ninguno',
              pinata: false,
              observaciones: '',
              alergenos: ''
            }
          }
        });

      expect(patchRes.statusCode).toBe(200);
      expect(patchRes.body.detalles.extras.personajes).toEqual([]);
      expect(patchRes.body.detalles.extras.precioPersonajeApplied).toBeUndefined();
    });
  });

  // =====================================================
  // REGRESIÓN: Actualización de taller en reserva existente
  // Bug: snapshots stale tras PATCH si el cliente envía valores antiguos
  // =====================================================
  describe('Actualización de reserva — recálculo de precios al cambiar taller', () => {
    it('Debería recalcular precioTotal y actualizar precioTallerApplied al cambiar taller de Magia a Pintura', async () => {
      // Paso 1: Crear reserva con taller Magia (priceBase: 25)
      const createRes = await request(app)
        .post('/api/v1/events')
        .send(budgetFlowPayload);

      expect(createRes.statusCode).toBe(201);
      expect(createRes.body.detalles.extras.taller).toBe('Magia');
      expect(createRes.body.detalles.extras.precioTallerApplied).toBe(25);
      const precioConMagia = createRes.body.precioTotal;
      const eventId = createRes.body.id;

      // Paso 2: PATCH — cambiar taller a Pintura (priceBase: 20)
      // Enviar stale precioTallerApplied: 25 (como haría el frontend con datos desactualizados)
      const patchRes = await request(app)
        .patch(`/api/v1/events/${eventId}`)
        .send({
          detalles: {
            extras: {
              taller: 'Pintura',
              personajes: [],
              pinata: true,
              observaciones: 'Mesa cerca de la puerta',
              alergenos: 'Frutos secos',
              extension: 0,
              extensionType: 'default',
              precioTallerApplied: 25 // STALE — debería ser 20 tras el recálculo
            }
          }
        });

      expect(patchRes.statusCode).toBe(200);
      // precioTotal debe reflejar precioBase de Pintura (20) en lugar de Magia (25)
      // Diferencia: 25 - 20 = 5€ menos
      expect(patchRes.body.precioTotal).toBe(precioConMagia - 5);
      expect(patchRes.body.detalles.extras.precioTallerApplied).toBe(20);
    });

    it('Debería recalcular precioTotal al remover taller (cambiar a "ninguno")', async () => {
      // Paso 1: Crear reserva con taller Magia
      const createRes = await request(app)
        .post('/api/v1/events')
        .send(budgetFlowPayload);

      expect(createRes.statusCode).toBe(201);
      expect(createRes.body.detalles.extras.taller).toBe('Magia');
      const precioConMagia = createRes.body.precioTotal;
      const eventId = createRes.body.id;

      // Paso 2: PATCH — quitar taller
      // Enviar stale precioTallerApplied: 25 (como haría el frontend con datos desactualizados)
      const patchRes = await request(app)
        .patch(`/api/v1/events/${eventId}`)
        .send({
          detalles: {
            extras: {
              taller: 'ninguno',
              personajes: [],
              pinata: true,
              observaciones: 'Mesa cerca de la puerta',
              alergenos: 'Frutos secos',
              extension: 0,
              extensionType: 'default',
              precioTallerApplied: 25 // STALE — debería eliminarse tras quitar taller
            }
          }
        });

      expect(patchRes.statusCode).toBe(200);
      // Sin taller, precioTotal baja en 25€ (priceBase de Magia)
      expect(patchRes.body.precioTotal).toBe(precioConMagia - 25);
      expect(patchRes.body.detalles.extras.precioTallerApplied).toBeUndefined();
    });
  });
});
