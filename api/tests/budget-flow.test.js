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

// Helper para generar fechas futuras garantizadas (evita que tests fallen
// por la ventana de 72h de modificación de reservas).
const getFutureDate = (targetDayOfWeek, daysAhead = 30) => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  while (d.getDay() !== targetDayOfWeek) d.setDate(d.getDate() + 1);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T00:00:00.000Z`;
};

const futureFriday = getFutureDate(5);   // Viernes
const futureTuesday = getFutureDate(2);  // Martes

describe('Flujo Presupuesto → Reserva (Budget Stepper Flow)', () => {

  // Datos base reutilizables: simula lo que BudgetPage envía al servidor
  const budgetFlowPayload = {
    tipo: 'reserva',
    fecha: futureFriday, // Viernes
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
        talleres: ['Magia'],
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
      preciosExtras: { personaje: 40, extension30: 30, extension60: 50 },
      extrasCatalogo: [
        { id: 'pinata', slug: 'pinata', nombre: 'Piñata Neverland', precio: 15, active: true },
        { id: 'snack', slug: 'snack-bar', nombre: 'Snack Bar', precio: 25, active: true },
        { id: 'decoracion', slug: 'decoracion-tematica', nombre: 'Decoración Temática', precio: 35, active: true }
      ]
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
        fecha: futureTuesday, // Martes (sin plus fin de semana)
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
        fecha: futureTuesday, // Martes
        detalles: {
          ...budgetFlowPayload.detalles,
          extras: { ...budgetFlowPayload.detalles.extras, talleres: [], pinata: false }
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
    const martesDate = futureTuesday;

    it('Debería calcular precio base sin personajes (0€ extra)', async () => {
      const payload = {
        ...budgetFlowPayload,
        fecha: martesDate,
        detalles: {
          ...budgetFlowPayload.detalles,
          extras: { ...budgetFlowPayload.detalles.extras, personajes: [], talleres: [], pinata: false }
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
          extras: { ...budgetFlowPayload.detalles.extras, personajes: ['Elsa'], talleres: [], pinata: false }
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
          extras: { ...budgetFlowPayload.detalles.extras, personajes: ['Elsa', 'Anna'], talleres: [], pinata: false }
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
          extras: { ...budgetFlowPayload.detalles.extras, personajes: ['Elsa', 'Anna', 'Olaf'], talleres: [], pinata: false }
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
          extras: { ...budgetFlowPayload.detalles.extras, personajes: ['Elsa', 'Anna', 'Olaf', 'Frozen'], talleres: [], pinata: false }
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
        preciosExtras: { personaje: 40, precioPack3Personajes: 120 }
      });

      const payload = {
        ...budgetFlowPayload,
        fecha: martesDate,
        detalles: {
          ...budgetFlowPayload.detalles,
          extras: { ...budgetFlowPayload.detalles.extras, personajes: ['Elsa', 'Anna', 'Olaf'], talleres: [], pinata: false }
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
            extras: { ...budgetFlowPayload.detalles.extras, personajes: ['Elsa'], talleres: [], pinata: false }
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
              talleres: [],
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
            extras: { ...budgetFlowPayload.detalles.extras, personajes: ['Anna', 'Elsa'], talleres: [], pinata: false }
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
              talleres: [],
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
            extras: { ...budgetFlowPayload.detalles.extras, personajes: ['Elsa'], talleres: [], pinata: false }
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
              talleres: [],
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
      expect(createRes.body.detalles.extras.talleres).toEqual(['Magia']);
      expect(createRes.body.detalles.extras.precioTallerApplied).toBe(25);
      const precioConMagia = createRes.body.precioTotal;
      const eventId = createRes.body.id;

      // Paso 2: PATCH — cambiar taller a Pintura (priceBase: 20)
      // Se usa el array `talleres`; el guard de invalidación compara conjuntos ordenados.
      // Enviar stale precioTallerApplied: 25 (como haría el frontend con datos desactualizados)
      const patchRes = await request(app)
        .patch(`/api/v1/events/${eventId}`)
        .send({
          detalles: {
            extras: {
              talleres: ['Pintura'],
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

    it('Debería recalcular precioTotal al remover taller (selección vacía)', async () => {
      // Paso 1: Crear reserva con taller Magia
      const createRes = await request(app)
        .post('/api/v1/events')
        .send(budgetFlowPayload);

      expect(createRes.statusCode).toBe(201);
      expect(createRes.body.detalles.extras.talleres).toEqual(['Magia']);
      const precioConMagia = createRes.body.precioTotal;
      const eventId = createRes.body.id;

      // Paso 2: PATCH — quitar taller enviando array vacío
      // El guard por presencia de campo detecta 'talleres' aunque su valor sea falsy [].
      // Enviar stale precioTallerApplied: 25 (como haría el frontend con datos desactualizados)
      const patchRes = await request(app)
        .patch(`/api/v1/events/${eventId}`)
        .send({
          detalles: {
            extras: {
              talleres: [],
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

  // =====================================================
  // Multi-actividades: pricing por suma e invalidación de snapshots
  // =====================================================
  describe('Multi-actividades — pricing por suma e invalidación de snapshots', () => {
    const martesDate = futureTuesday;

    // Helper para construir un payload limpio con array de actividades
    const payloadConTalleres = (talleres, { ninos = 15, pinata = false, dia = martesDate } = {}) => {
      const payload = {
        ...budgetFlowPayload,
        fecha: dia,
        detalles: {
          ...budgetFlowPayload.detalles,
          niños: { cantidad: ninos, menuId: 'menu-1' },
          extras: {
            ...budgetFlowPayload.detalles.extras,
            talleres,
            pinata
          }
        }
      };
      delete payload.detalles.extras.taller; // forzar lectura desde talleres
      return payload;
    };

    it('Debería calcular 0€ y no snapshotear precioTallerApplied con 0 actividades', async () => {
      const res = await request(app)
        .post('/api/v1/events')
        .send(payloadConTalleres([]));

      expect(res.statusCode).toBe(201);
      expect(res.body.detalles.extras.talleres).toEqual([]);
      expect(res.body.detalles.extras.precioTallerApplied).toBeUndefined();
      expect([225, 247.5]).toContain(res.body.precioTotal);
    });

    it('Debería calcular el mismo precio legacy con 1 actividad', async () => {
      const res = await request(app)
        .post('/api/v1/events')
        .send(payloadConTalleres(['Magia']));

      expect(res.statusCode).toBe(201);
      expect(res.body.detalles.extras.talleres).toEqual(['Magia']);
      expect(res.body.detalles.extras.precioTallerApplied).toBe(25);
      expect([225, 247.5]).toContain(res.body.precioTotal - 25);
    });

    it('Debería sumar precios de 2 actividades', async () => {
      const res = await request(app)
        .post('/api/v1/events')
        .send(payloadConTalleres(['Magia', 'Pintura']));

      expect(res.statusCode).toBe(201);
      expect(res.body.detalles.extras.talleres).toEqual(['Magia', 'Pintura']);
      expect(res.body.detalles.extras.precioTallerApplied).toBe(45); // 25 + 20
      expect([225, 247.5]).toContain(res.body.precioTotal - 45);
    });

    it('Debería sumar precios de 3 actividades en grupo grande', async () => {
      await Config.deleteMany({});
      await Config.create({
        menusNiños: [{ id: 'menu-1', nombre: 'Menú Aventura', precio: 15 }],
        plusFinDeSemana: 1.5,
        preciosAdultos: [],
        workshops: [
          { name: 'Magia', priceBase: 25, pricePlus: 30 },
          { name: 'Pintura', priceBase: 20, pricePlus: 25 },
          { name: 'Cocina', priceBase: 22, pricePlus: 28 }
        ],
        characters: [],
        preciosExtras: { personaje: 40, extension30: 30, extension60: 50 }
      });

      const res = await request(app)
        .post('/api/v1/events')
        .send(payloadConTalleres(['Magia', 'Pintura', 'Cocina'], { ninos: 18 }));

      expect(res.statusCode).toBe(201);
      expect(res.body.detalles.extras.talleres).toEqual(['Magia', 'Pintura', 'Cocina']);
      expect(res.body.detalles.extras.precioTallerApplied).toBe(83); // 30 + 25 + 28
    });

    it('Debería aplicar precio base con exactamente 15 niños', async () => {
      const res = await request(app)
        .post('/api/v1/events')
        .send(payloadConTalleres(['Magia'], { ninos: 15 }));

      expect(res.statusCode).toBe(201);
      expect(res.body.detalles.extras.precioTallerApplied).toBe(25);
    });

    it('Debería aplicar precio plus con 16 niños', async () => {
      const res = await request(app)
        .post('/api/v1/events')
        .send(payloadConTalleres(['Magia'], { ninos: 16 }));

      expect(res.statusCode).toBe(201);
      expect(res.body.detalles.extras.precioTallerApplied).toBe(30);
    });

    it('Debería usar priceBase como fallback cuando pricePlus es 0 en grupo grande', async () => {
      await Config.deleteMany({});
      await Config.create({
        menusNiños: [{ id: 'menu-1', nombre: 'Menú Aventura', precio: 15 }],
        plusFinDeSemana: 1.5,
        preciosAdultos: [],
        workshops: [
          { name: 'Magia', priceBase: 25, pricePlus: 0 }
        ],
        characters: [],
        preciosExtras: { personaje: 40, extension30: 30, extension60: 50 }
      });

      const res = await request(app)
        .post('/api/v1/events')
        .send(payloadConTalleres(['Magia'], { ninos: 18 }));

      expect(res.statusCode).toBe(201);
      expect(res.body.detalles.extras.precioTallerApplied).toBe(25);
    });

    it('NO debería aplicar fallback cuando una actividad resuelta tiene priceBase 0', async () => {
      await Config.deleteMany({});
      await Config.create({
        menusNiños: [{ id: 'menu-1', nombre: 'Menú Aventura', precio: 15 }],
        plusFinDeSemana: 1.5,
        preciosAdultos: [],
        workshops: [
          { name: 'Magia', priceBase: 0, pricePlus: 0 }
        ],
        characters: [],
        preciosExtras: { personaje: 40, extension30: 30, extension60: 50 }
      });

      const res = await request(app)
        .post('/api/v1/events')
        .send(payloadConTalleres(['Magia'], { ninos: 15 }));

      expect(res.statusCode).toBe(201);
      expect(res.body.detalles.extras.precioTallerApplied).toBe(0);
    });

    it('Debería invalidar snapshot al cambiar el conjunto de actividades', async () => {
      const createRes = await request(app)
        .post('/api/v1/events')
        .send(payloadConTalleres(['Magia']));

      expect(createRes.statusCode).toBe(201);
      expect(createRes.body.detalles.extras.precioTallerApplied).toBe(25);
      const precioInicial = createRes.body.precioTotal;
      const eventId = createRes.body.id;

      const patchRes = await request(app)
        .patch(`/api/v1/events/${eventId}`)
        .send({
          detalles: {
            extras: {
              talleres: ['Magia', 'Pintura'],
              personajes: [],
              pinata: false,
              observaciones: '',
              alergenos: ''
            }
          }
        });

      expect(patchRes.statusCode).toBe(200);
      expect(patchRes.body.detalles.extras.precioTallerApplied).toBe(45);
      expect(patchRes.body.precioTotal).toBe(precioInicial + 20);
    });

    it('NO debería invalidar snapshot si el conjunto es igual en orden distinto', async () => {
      const createRes = await request(app)
        .post('/api/v1/events')
        .send(payloadConTalleres(['Magia', 'Pintura']));

      expect(createRes.statusCode).toBe(201);
      const precioInicial = createRes.body.precioTotal;
      const eventId = createRes.body.id;

      const patchRes = await request(app)
        .patch(`/api/v1/events/${eventId}`)
        .send({
          detalles: {
            extras: {
              talleres: ['Pintura', 'Magia'],
              personajes: [],
              pinata: false,
              observaciones: '',
              alergenos: ''
            }
          }
        });

      expect(patchRes.statusCode).toBe(200);
      expect(patchRes.body.precioTotal).toBe(precioInicial);
    });

    it('Debería eliminar snapshot al vaciar la selección de actividades', async () => {
      const createRes = await request(app)
        .post('/api/v1/events')
        .send(payloadConTalleres(['Magia']));

      expect(createRes.statusCode).toBe(201);
      expect(createRes.body.detalles.extras.precioTallerApplied).toBe(25);
      const eventId = createRes.body.id;

      const patchRes = await request(app)
        .patch(`/api/v1/events/${eventId}`)
        .send({
          detalles: {
            extras: {
              talleres: [],
              personajes: [],
              pinata: false,
              observaciones: '',
              alergenos: ''
            }
          }
        });

      expect(patchRes.statusCode).toBe(200);
      expect(patchRes.body.detalles.extras.talleres).toEqual([]);
      expect(patchRes.body.detalles.extras.precioTallerApplied).toBeUndefined();
    });

    it('Debería sobrescribir snapshot stale enviado por el cliente', async () => {
      const createRes = await request(app)
        .post('/api/v1/events')
        .send(payloadConTalleres(['Magia']));

      expect(createRes.statusCode).toBe(201);
      const eventId = createRes.body.id;

      const patchRes = await request(app)
        .patch(`/api/v1/events/${eventId}`)
        .send({
          detalles: {
            extras: {
              talleres: ['Pintura'],
              personajes: [],
              pinata: false,
              observaciones: '',
              alergenos: '',
              precioTallerApplied: 25 // stale
            }
          }
        });

      expect(patchRes.statusCode).toBe(200);
      expect(patchRes.body.detalles.extras.precioTallerApplied).toBe(20);
    });

    it('Debería aplicar fallback y emitir warning para actividad legacy no resoluble sin devolver 400', async () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      // Crear directamente en BD una reserva con actividad que ya no existe en catálogo
      const eventoLegacy = await Event.create({
        tipo: 'reserva',
        fecha: martesDate,
        turno: 'T2',
        cliente: {
          nombreNiño: 'Lucía',
          edadNiño: 6,
          nombrePadre: 'Carlos García',
          telefono: '+34612345678',
          email: 'carlos@example.com',
          privacyPolicyConsent: true,
          marketingConsent: false
        },
        detalles: {
          niños: { cantidad: 15, menuId: 'menu-1' },
          adultos: { cantidad: 5, comida: [] },
          extras: {
            talleres: ['ActividadAntigua'],
            personajes: [],
            pinata: false
          }
        },
        horario: {
          inicio: '18:00',
          fin: '20:00',
          extensionMinutos: 0
        }
      });

      // PATCH sin modificar la selección: solo cambiamos observaciones
      const patchRes = await request(app)
        .patch(`/api/v1/events/${eventoLegacy.id}`)
        .send({
          detalles: {
            extras: {
              observaciones: 'Nota actualizada'
            }
          }
        });

      expect(patchRes.statusCode).toBe(200);
      expect(patchRes.body.detalles.extras.precioTallerApplied).toBe(25);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('ActividadAntigua'));
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('fallback'));

      warnSpy.mockRestore();
    });

    it('D-01: debería resolver del catálogo un nombre con espacio final (priceBase 30) en vez de cobrar el fallback 25', async () => {
      await Config.deleteMany({});
      await Config.create({
        menusNiños: [{ id: 'menu-1', nombre: 'Menú Aventura', precio: 15 }],
        plusFinDeSemana: 1.5,
        preciosAdultos: [],
        workshops: [
          // Caso real D-01: el catálogo conserva el espacio final, la migración
          // trimmea el valor guardado en el evento.
          { name: 'Fiesta aquatica básica ', priceBase: 30, pricePlus: 35 }
        ],
        characters: [],
        preciosExtras: { personaje: 40, tallerBase: 25, tallerPlus: 30, extension30: 30, extension60: 50 }
      });

      const res = await request(app)
        .post('/api/v1/events')
        .send(payloadConTalleres(['Fiesta aquatica básica'], { ninos: 12 }));

      expect(res.statusCode).toBe(201);
      // 12 niños (≤ 15) → priceBase del catálogo = 30; el fallback daría 25.
      expect(res.body.detalles.extras.precioTallerApplied).toBe(30);
      // 12 * 15 = 180 + 30 = 210 (martes sin plus de fin de semana)
      expect(res.body.precioTotal).toBe(210);
    });

    it('Debería incluir la suma de actividades en precioTotal', async () => {
      const res = await request(app)
        .post('/api/v1/events')
        .send(payloadConTalleres(['Magia', 'Pintura']));

      expect(res.statusCode).toBe(201);
      // 15 niños * 15€ = 225€ + 2 actividades (45€) = 270€ (martes sin plus)
      expect(res.body.precioTotal).toBe(270);
    });

    it('Debería preservar el precio legacy al editar una reserva antigua con campo taller', async () => {
      // Simula una reserva creada antes de multi-actividades que solo tiene
      // `taller` y NO tiene la clave `talleres` en el documento.
      const eventoLegacy = await Event.create({
        tipo: 'reserva',
        fecha: martesDate,
        turno: 'T2',
        cliente: {
          nombreNiño: 'Leo',
          edadNiño: 7,
          nombrePadre: 'Ana',
          telefono: '+34612345678',
          email: 'ana@example.com',
          privacyPolicyConsent: true,
          marketingConsent: false
        },
        detalles: {
          niños: { cantidad: 15, menuId: 'menu-1' },
          adultos: { cantidad: 5, comida: [] },
          extras: {
            taller: 'Magia',
            personajes: [],
            pinata: false
          }
        },
        horario: {
          inicio: '18:00',
          fin: '20:00',
          extensionMinutos: 0
        }
      });

      const patchRes = await request(app)
        .patch(`/api/v1/events/${eventoLegacy.id}`)
        .send({
          detalles: {
            extras: {
              observaciones: 'Solo cambio de nota'
            }
          }
        });

      expect(patchRes.statusCode).toBe(200);
      expect(patchRes.body.detalles.extras.precioTallerApplied).toBe(25);
      // 15 niños * 15€ = 225€ + Magia 25€ = 250€
      expect(patchRes.body.precioTotal).toBe(250);
    });

    // ---------------------------------------------------------------
    // activity-sum-pricing/REQ-06 — guard por PRESENCIA del campo
    // `talleres`. El test anterior NO es discriminante: su snapshot
    // resultante (25) coincide con el recálculo, así que no distingue
    // "el guard no se disparó" de "se invalidó y se recalculó al mismo
    // valor". Estos dos tests usan un snapshot IMPOSIBLE (99 €) para
    // separar ambos caminos.
    // ---------------------------------------------------------------
    it('REQ-06: NO debe tocar precioTallerApplied cuando el PATCH NO trae la clave `talleres`', async () => {
      // 99 € jamás puede ser un precio real de actividades.
      const evento = await Event.create({
        tipo: 'reserva',
        fecha: martesDate,
        turno: 'T2',
        cliente: {
          nombreNiño: 'Nora',
          edadNiño: 8,
          nombrePadre: 'Ana',
          telefono: '+34612345678',
          email: 'ana@example.com',
          privacyPolicyConsent: true,
          marketingConsent: false
        },
        detalles: {
          niños: { cantidad: 15, menuId: 'menu-1' },
          adultos: { cantidad: 5, comida: [] },
          extras: {
            talleres: ['Magia'],
            precioTallerApplied: 99,
            personajes: [],
            pinata: false
          }
        },
        horario: {
          inicio: '18:00',
          fin: '20:00',
          extensionMinutos: 0
        }
      });

      // PATCH de un cliente con datos desactualizados: reenvía el snapshot
      // viejo (99) pero NO incluye la clave `talleres` en `extras`.
      const patchRes = await request(app)
        .patch(`/api/v1/events/${evento.id}`)
        .send({
          detalles: {
            extras: {
              observaciones: 'Solo cambio de nota',
              precioTallerApplied: 99
            }
          }
        });

      expect(patchRes.statusCode).toBe(200);
      expect(patchRes.body.detalles.extras.talleres).toEqual(['Magia']);
      // Discriminante: si el guard se disparara (invalidación no condicionada
      // a la presencia de `talleres`), calculateEventPrice borraría 99 y lo
      // recalcularía a 25 € (priceBase real de Magia).
      expect(patchRes.body.detalles.extras.precioTallerApplied).toBe(99);
    });

    it('REQ-06: SÍ debe recalcular el snapshot cuando el PATCH SÍ trae `talleres` distinto', async () => {
      const evento = await Event.create({
        tipo: 'reserva',
        fecha: martesDate,
        turno: 'T2',
        cliente: {
          nombreNiño: 'Nora',
          edadNiño: 8,
          nombrePadre: 'Ana',
          telefono: '+34612345678',
          email: 'ana@example.com',
          privacyPolicyConsent: true,
          marketingConsent: false
        },
        detalles: {
          niños: { cantidad: 15, menuId: 'menu-1' },
          adultos: { cantidad: 5, comida: [] },
          extras: {
            talleres: ['Magia'],
            precioTallerApplied: 99,
            personajes: [],
            pinata: false
          }
        },
        horario: {
          inicio: '18:00',
          fin: '20:00',
          extensionMinutos: 0
        }
      });

      const patchRes = await request(app)
        .patch(`/api/v1/events/${evento.id}`)
        .send({
          detalles: {
            extras: {
              talleres: ['Pintura'],
              personajes: [],
              pinata: false,
              observaciones: 'Cambio de actividad',
              alergenos: ''
            }
          }
        });

      expect(patchRes.statusCode).toBe(200);
      expect(patchRes.body.detalles.extras.talleres).toEqual(['Pintura']);
      // El snapshot stale (99) se invalidó y se recalculó con el precio real
      // de Pintura (priceBase 20 con 15 niños).
      expect(patchRes.body.detalles.extras.precioTallerApplied).toBe(20);
      expect(patchRes.body.detalles.extras.precioTallerApplied).not.toBe(99);
    });
  });

  // =====================================================
  // Catálogo de extras
  // =====================================================
  describe('Flujo completo con catálogo de extras', () => {
    it('Debería persistir catalogoItemIds y snapshotear precioCatalogoApplied', async () => {
      const payload = {
        ...budgetFlowPayload,
        detalles: {
          ...budgetFlowPayload.detalles,
          extras: {
            ...budgetFlowPayload.detalles.extras,
            catalogoItemIds: ['snack-bar', 'decoracion-tematica']
          }
        }
      };

      const res = await request(app)
        .post('/api/v1/events')
        .send(payload);

      expect(res.statusCode).toBe(201);
      expect(res.body.detalles.extras.catalogoItemIds).toEqual(['snack-bar', 'decoracion-tematica']);
      expect(res.body.detalles.extras.precioCatalogoApplied).toBe(60);
    });

    it('Debería sincronizar Piñata cuando está en catalogoItemIds', async () => {
      const payload = {
        ...budgetFlowPayload,
        detalles: {
          ...budgetFlowPayload.detalles,
          extras: {
            ...budgetFlowPayload.detalles.extras,
            pinata: false,
            catalogoItemIds: ['pinata', 'snack-bar']
          }
        }
      };

      const res = await request(app)
        .post('/api/v1/events')
        .send(payload);

      expect(res.statusCode).toBe(201);
      expect(res.body.detalles.extras.pinata).toBe(true);
      expect(res.body.detalles.extras.precioPinataApplied).toBe(15);
      // 15 niños * 15 = 225 + plus viernes 22.5 + taller base 25 + piñata 15 + snack 25 = 312.5
      expect(res.body.precioTotal).toBe(312.5);
    });

    it('Debería recalcular snapshot al cambiar catalogoItemIds por PATCH', async () => {
      const createRes = await request(app)
        .post('/api/v1/events')
        .send({
          ...budgetFlowPayload,
          detalles: {
            ...budgetFlowPayload.detalles,
            extras: {
              ...budgetFlowPayload.detalles.extras,
              catalogoItemIds: ['snack-bar']
            }
          }
        });

      expect(createRes.statusCode).toBe(201);
      expect(createRes.body.detalles.extras.precioCatalogoApplied).toBe(25);
      const eventId = createRes.body.id;

      const patchRes = await request(app)
        .patch(`/api/v1/events/${eventId}`)
        .send({
          detalles: {
            extras: {
              catalogoItemIds: ['snack-bar', 'decoracion-tematica'],
              pinata: true,
              personajes: [],
              taller: 'Magia',
              observaciones: '',
              alergenos: ''
            }
          }
        });

      expect(patchRes.statusCode).toBe(200);
      expect(patchRes.body.detalles.extras.precioCatalogoApplied).toBe(60);
      expect(patchRes.body.detalles.extras.catalogoItemIds).toEqual(['snack-bar', 'decoracion-tematica']);
    });

    it('Debería mantener reservas legacy sin catalogoItemIds funcionando', async () => {
      const payload = {
        ...budgetFlowPayload,
        detalles: {
          ...budgetFlowPayload.detalles,
          extras: {
            ...budgetFlowPayload.detalles.extras,
            pinata: true
          }
        }
      };

      const res = await request(app)
        .post('/api/v1/events')
        .send(payload);

      expect(res.statusCode).toBe(201);
      // Mongoose inicializa el array con default []; lo importante es que no contenga Piñata duplicado
      expect(res.body.detalles.extras.catalogoItemIds).toEqual([]);
      expect(res.body.detalles.extras.pinata).toBe(true);
      expect(res.body.detalles.extras.precioPinataApplied).toBe(15);
    });
  });
});
