const request = require('supertest');
const app = require('../app'); // Importamos la aplicación, pero sin arrancar el puerto
const Event = require('../models/event.model');
const Config = require('../models/config.model');
const googleService = require('../services/google.service'); // Necesario para modificar el mock bajo demanda

// Mock de Google Calendar Service para evitar llamadas reales a internet durante los tests
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

const futureDate = getFutureDate(new Date().getDay());      // cualquier día futuro
const futureTuesday = getFutureDate(2);                     // Martes
const futureSaturday = getFutureDate(6);                    // Sábado

describe('Eventos API - Testing de Lógica de Reservas', () => {

  // Test 1: Crear una reserva válida
  it('Debería poder crear una nueva reserva correctamente', async () => {
    const newEvent = {
      tipo: 'reserva',
      fecha: futureDate,
      turno: 'T1',
      cliente: {
        nombreNiño: 'Pedrito',
        nombrePadre: 'Juan Pérez',
        email: 'juan@example.com',
        telefono: '123456789',
        privacyPolicyConsent: true
      },
      detalles: {
        niños: { cantidad: 15, menuId: 'menu-1' }
      }
    };

    const res = await request(app)
      .post('/api/v1/events')
      .send(newEvent);

    expect(res.statusCode).toEqual(201); // 201 Creado
    expect(res.body).toHaveProperty('publicId');
    expect(res.body.turno).toEqual('T1');
  });

  // Test 2: Prevenir overbooking (Doble reserva en el mismo turno)
  it('Debería devolver error si intentamos hacer doble reserva en el mismo turno', async () => {
    const fixedDate = getFutureDate(new Date().getDay(), 60);

    // Primero, "inyectamos" un evento directamente a la base de datos simulada
    await Event.create({
      tipo: 'bloqueo',
      fecha: fixedDate,
      turno: 'T2',
      estado: 'confirmado'
    });

    // Ahora simulamos a un cliente intentando reservar ese mismo turno
    const res = await request(app)
      .post('/api/v1/events')
      .send({
        tipo: 'reserva',
        fecha: fixedDate,
        turno: 'T2',
        cliente: {
          nombreNiño: 'Lolito',
          nombrePadre: 'Cliente Tardío',
          email: 'tarde@example.com',
          telefono: '987654321',
          privacyPolicyConsent: true
        },
        detalles: {
          niños: { cantidad: 20, menuId: 'menu-2' }
        }
      });

    // Debería fallar, idealmente con un código de conflicto o error de validación
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });

  describe('Validaciones y Seguridad', () => {
    it('Debería rechazar reserva sin nombre de niño', async () => {
      const res = await request(app).post('/api/v1/events').send({
        tipo: 'reserva', fecha: futureDate, turno: 'T1',
        cliente: { email: 'juan@example.com', telefono: '123456789', privacyPolicyConsent: true }, // Faltan nombres
        detalles: { niños: { cantidad: 15, menuId: 'menu-1' } }
      });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/Datos del cliente incompletos/);
    });

    it('Debería rechazar un correo electrónico inválido', async () => {
      const res = await request(app).post('/api/v1/events').send({
        tipo: 'reserva', fecha: futureDate, turno: 'T1',
        cliente: { nombreNiño: 'Pedrito', nombrePadre: 'Juan Pérez', email: 'correo-falso', telefono: '123456789', privacyPolicyConsent: true },
        detalles: { niños: { cantidad: 15, menuId: 'menu-1' } }
      });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/Email inválido/);
    });

    it('Debería rechazar una edad irreal (mayor a 99 años)', async () => {
      const res = await request(app).post('/api/v1/events').send({
        tipo: 'reserva', fecha: futureDate, turno: 'T1',
        cliente: { nombreNiño: 'Pedrito', edadNiño: 105, nombrePadre: 'Juan Pérez', email: 'juan@example.com', telefono: '123456789', privacyPolicyConsent: true },
        detalles: { niños: { cantidad: 15, menuId: 'menu-1' } }
      });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/La edad debe ser de máximo 2 cifras/);
    });

    it('Debería rechazar reserva con más de 50 niños', async () => {
      const res = await request(app).post('/api/v1/events').send({
        tipo: 'reserva', fecha: futureDate, turno: 'T1',
        cliente: { nombreNiño: 'Pedrito', edadNiño: 5, nombrePadre: 'Juan Pérez', email: 'juan@example.com', telefono: '123456789', privacyPolicyConsent: true },
        detalles: { niños: { cantidad: 51, menuId: 'menu-1' } }
      });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/Máximo 50 niños/);
    });

    it('Debería rechazar reserva con más de 40 adultos', async () => {
      const res = await request(app).post('/api/v1/events').send({
        tipo: 'reserva', fecha: futureDate, turno: 'T1',
        cliente: { nombreNiño: 'Pedrito', edadNiño: 5, nombrePadre: 'Juan Pérez', email: 'juan@example.com', telefono: '123456789', privacyPolicyConsent: true },
        detalles: {
          niños: { cantidad: 15, menuId: 'menu-1' },
          adultos: { cantidad: 41 }
        }
      });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/Máximo 40 adultos/);
    });

    it('Debería rechazar raciones de comida de adultos mayores a 20 unidades', async () => {
      const res = await request(app).post('/api/v1/events').send({
        tipo: 'reserva', fecha: futureDate, turno: 'T1',
        cliente: { nombreNiño: 'Pedrito', edadNiño: 5, nombrePadre: 'Juan Pérez', email: 'juan@example.com', telefono: '123456789', privacyPolicyConsent: true },
        detalles: {
          niños: { cantidad: 15, menuId: 'menu-1' },
          adultos: {
            cantidad: 20,
            comida: [{ item: 'Tortilla', cantidad: 21, precioUnitario: 10 }]
          }
        }
      });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/Máximo 20 unidades por ración/);
    });

    it('Debería rechazar nombres de más de 100 caracteres', async () => {
      const longName = 'A'.repeat(101);
      const res = await request(app).post('/api/v1/events').send({
        tipo: 'reserva', fecha: futureDate, turno: 'T1',
        cliente: { nombreNiño: longName, nombrePadre: 'Juan Pérez', email: 'juan@example.com', telefono: '123456789', privacyPolicyConsent: true },
        detalles: { niños: { cantidad: 15, menuId: 'menu-1' } }
      });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/Nombre del niño demasiado largo/);
    });
  });

  describe('Cálculo de Precios', () => {
    beforeEach(async () => {
      // Inyectamos una configuración de precios base para testear la matemática del servidor
      await Config.create({
        menusNiños: [{ id: 'menu-1', precio: 15 }],
        plusFinDeSemana: 2,
        preciosAdultos: [],
        workshops: [{ name: 'Magia', priceBase: 25, pricePlus: 30 }],
        preciosExtras: { extension30: 30, extension60: 50 },
          extrasCatalogo: [
            { id: 'pinata', slug: 'pinata', nombre: 'Piñata Neverland', precio: 15, active: true },
            { id: 'snack', slug: 'snack-bar', nombre: 'Snack Bar', precio: 25, active: true },
            { id: 'decoracion', slug: 'decoracion-tematica', nombre: 'Decoración Temática', precio: 35, active: true },
            { id: 'inactivo', slug: 'extra-inactivo', nombre: 'Extra Inactivo', precio: 10, active: false }
        ]
      });
    });

    it('Debería calcular correctamente el precio base (niños * menú)', async () => {
      // Un martes (día de semana), 12 niños a 15€ = 180€
      const res = await request(app).post('/api/v1/events').send({
        tipo: 'reserva', fecha: futureTuesday, // Martes
        turno: 'T1',
        cliente: { nombreNiño: 'Leo', nombrePadre: 'Ana', email: 'ana@example.com', telefono: '123456789', privacyPolicyConsent: true },
        detalles: { niños: { cantidad: 12, menuId: 'menu-1' } }
      });
      expect(res.statusCode).toBe(201);
      expect(res.body.precioTotal).toBe(180);
    });

    it('Debería aplicar el plus de fin de semana correctamente', async () => {
      // Un sábado (fin de semana), 12 niños a 15€ = 180€ + (12 niños * 2€ plus) = 204€
      const res = await request(app).post('/api/v1/events').send({
        tipo: 'reserva', fecha: futureSaturday, // Sábado
        turno: 'T1',
        cliente: { nombreNiño: 'Leo', nombrePadre: 'Ana', email: 'ana@example.com', telefono: '123456789', privacyPolicyConsent: true },
        detalles: { niños: { cantidad: 12, menuId: 'menu-1' } }
      });
      expect(res.body.precioTotal).toBe(204); // 180 base + 24 plus
    });

    it('Debería facturar correctamente tiempo extra y talleres interactivos interactivos', async () => {
      // Martes, 20 niños a 15€ = 300€ + (Taller Plus por ser > 15 niños: 30€) + (Extensión 30 min: 30€) = 360€
      const res = await request(app).post('/api/v1/events').send({
        tipo: 'reserva', fecha: futureTuesday,
        turno: 'T1',
        cliente: { nombreNiño: 'Leo', nombrePadre: 'Ana', email: 'ana@example.com', telefono: '123456789', privacyPolicyConsent: true },
        detalles: {
          niños: { cantidad: 20, menuId: 'menu-1' },
          extras: { taller: 'Magia' }
        },
        horario: { extensionMinutos: 30 }
      });
      expect(res.body.precioTotal).toBe(360);
    });

    it('Debería aplicar tallerBase (no plus) si hay exactamente 15 niños', async () => {
      // Martes, 15 niños a 15€ = 225€ + (Taller Base por ser <= 15 niños: 25€) = 250€
      const res = await request(app).post('/api/v1/events').send({
        tipo: 'reserva', fecha: futureTuesday,
        turno: 'T1',
        cliente: { nombreNiño: 'Leo', nombrePadre: 'Ana', email: 'ana@example.com', telefono: '123456789', privacyPolicyConsent: true },
        detalles: {
          niños: { cantidad: 15, menuId: 'menu-1' },
          extras: { taller: 'Magia' }
        }
      });
      expect(res.body.precioTotal).toBe(250);
    });

    describe('Catálogo de extras', () => {
      it('Debería sumar precios de items del catálogo y snapshotear precioCatalogoApplied', async () => {
        const res = await request(app).post('/api/v1/events').send({
          tipo: 'reserva', fecha: futureTuesday,
          turno: 'T1',
          cliente: { nombreNiño: 'Leo', nombrePadre: 'Ana', email: 'ana@example.com', telefono: '123456789', privacyPolicyConsent: true },
          detalles: {
            niños: { cantidad: 12, menuId: 'menu-1' },
            extras: { catalogoItemIds: ['snack-bar', 'decoracion-tematica'] }
          }
        });
        expect(res.statusCode).toBe(201);
        // 12*15 = 180 + 25 + 35 = 240
        expect(res.body.precioTotal).toBe(240);
        expect(res.body.detalles.extras.precioCatalogoApplied).toBe(60);
      });

      it('Debería hacer dual-write de Piñata cuando está en catalogoItemIds', async () => {
        const res = await request(app).post('/api/v1/events').send({
          tipo: 'reserva', fecha: futureTuesday,
          turno: 'T1',
          cliente: { nombreNiño: 'Leo', nombrePadre: 'Ana', email: 'ana@example.com', telefono: '123456789', privacyPolicyConsent: true },
          detalles: {
            niños: { cantidad: 12, menuId: 'menu-1' },
            extras: { catalogoItemIds: ['pinata', 'snack-bar'] }
          }
        });
        expect(res.statusCode).toBe(201);
        expect(res.body.detalles.extras.pinata).toBe(true);
        expect(res.body.detalles.extras.precioPinataApplied).toBe(15);
        // precioCatalogoApplied now includes Piñata (15 + 25 = 40)
        expect(res.body.detalles.extras.precioCatalogoApplied).toBe(40);
        // 12*15 + 15 (pinata) + 25 (snack) = 220
        expect(res.body.precioTotal).toBe(220);
      });

      it('No debería duplicar el precio de Piñata', async () => {
        const res = await request(app).post('/api/v1/events').send({
          tipo: 'reserva', fecha: futureTuesday,
          turno: 'T1',
          cliente: { nombreNiño: 'Leo', nombrePadre: 'Ana', email: 'ana@example.com', telefono: '123456789', privacyPolicyConsent: true },
          detalles: {
            niños: { cantidad: 12, menuId: 'menu-1' },
            extras: { pinata: true, catalogoItemIds: ['pinata'] }
          }
        });
        expect(res.statusCode).toBe(201);
        // 12*15 + 15 (pinata una sola vez) = 195
        expect(res.body.precioTotal).toBe(195);
      });

      it('Debería rechazar items inactivos o desconocidos con 400', async () => {
        const res = await request(app).post('/api/v1/events').send({
          tipo: 'reserva', fecha: futureTuesday,
          turno: 'T1',
          cliente: { nombreNiño: 'Leo', nombrePadre: 'Ana', email: 'ana@example.com', telefono: '123456789', privacyPolicyConsent: true },
          detalles: {
            niños: { cantidad: 12, menuId: 'menu-1' },
            extras: { catalogoItemIds: ['extra-inactivo'] }
          }
        });
        expect(res.statusCode).toBe(400);
      });

      it('Debería rechazar IDs duplicados en catalogoItemIds', async () => {
        const res = await request(app).post('/api/v1/events').send({
          tipo: 'reserva', fecha: futureTuesday,
          turno: 'T1',
          cliente: { nombreNiño: 'Leo', nombrePadre: 'Ana', email: 'ana@example.com', telefono: '123456789', privacyPolicyConsent: true },
          detalles: {
            niños: { cantidad: 12, menuId: 'menu-1' },
            extras: { catalogoItemIds: ['snack-bar', 'snack-bar'] }
          }
        });
        expect(res.statusCode).toBe(400);
      });

      it('Debería recalcular precioCatalogoApplied al cambiar catalogoItemIds por PATCH', async () => {
        const createRes = await request(app).post('/api/v1/events').send({
          tipo: 'reserva', fecha: futureTuesday,
          turno: 'T1',
          cliente: { nombreNiño: 'Leo', nombrePadre: 'Ana', email: 'ana@example.com', telefono: '123456789', privacyPolicyConsent: true },
          detalles: {
            niños: { cantidad: 12, menuId: 'menu-1' },
            extras: { catalogoItemIds: ['snack-bar'] }
          }
        });
        expect(createRes.statusCode).toBe(201);
        expect(createRes.body.detalles.extras.precioCatalogoApplied).toBe(25);
        const eventId = createRes.body.id;

        const patchRes = await request(app).patch(`/api/v1/events/${eventId}`).send({
          detalles: {
            extras: {
              catalogoItemIds: ['snack-bar', 'decoracion-tematica'],
              pinata: false,
              personajes: [],
              taller: 'ninguno',
              observaciones: '',
              alergenos: ''
            }
          }
        });
        expect(patchRes.statusCode).toBe(200);
        expect(patchRes.body.detalles.extras.precioCatalogoApplied).toBe(60);
      });

      it('Debería recalcular precioCatalogoApplied cuando cambia el precio base del menú', async () => {
        const createRes = await request(app).post('/api/v1/events').send({
          tipo: 'reserva', fecha: futureTuesday,
          turno: 'T1',
          cliente: { nombreNiño: 'Leo', nombrePadre: 'Ana', email: 'ana@example.com', telefono: '123456789', privacyPolicyConsent: true },
          detalles: {
            niños: { cantidad: 12, menuId: 'menu-1' },
            extras: { catalogoItemIds: ['snack-bar'] }
          }
        });
        expect(createRes.statusCode).toBe(201);
        const eventId = createRes.body.id;

        await Config.deleteMany({});
        await Config.create({
          menusNiños: [{ id: 'menu-1', precio: 20 }],
          plusFinDeSemana: 2,
          preciosAdultos: [],
          workshops: [],
          preciosExtras: { extension30: 30, extension60: 50 },
          extrasCatalogo: [
            { id: 'snack', slug: 'snack-bar', nombre: 'Snack Bar', precio: 30, active: true }
          ]
        });

        const patchRes = await request(app).patch(`/api/v1/events/${eventId}`).send({
          detalles: {
            niños: { menuId: 'menu-1' },
            extras: {
              catalogoItemIds: ['snack-bar'],
              pinata: false,
              personajes: [],
              taller: 'ninguno',
              observaciones: '',
              alergenos: ''
            }
          }
        });
        expect(patchRes.statusCode).toBe(200);
        expect(patchRes.body.detalles.extras.precioCatalogoApplied).toBe(30);
      });
    });
  });

  describe('Autorización (Rutas Protegidas)', () => {
    it('Debería denegar acceso a la lista de eventos sin token de administrador', async () => {
      const res = await request(app).get('/api/v1/events');
      // Dependiendo de tu middleware "secure.isAdmin", esto puede ser 401 o 403
      expect([401, 403]).toContain(res.statusCode);
    });

    it('Debería denegar el borrado parcial o total de un evento sin sesión', async () => {
      const res = await request(app).delete('/api/v1/events/fake-id');
      expect([401, 403]).toContain(res.statusCode);
    });
  });

  describe('Consulta de Disponibilidad (Motor Principal)', () => {
    it('Debería reportar ocupado un turno proveniente de la base de datos local', async () => {
      // 1. Creamos un evento directamente en BD local
      const availDate = getFutureDate(new Date().getDay(), 45);
      await Event.create({ tipo: 'reserva', fecha: availDate, turno: 'T3', estado: 'confirmado', cliente: { privacyPolicyConsent: true } });

      // 2. Solicitamos disponibilidad a esa fecha
      const res = await request(app).get(`/api/v1/events/availability?fecha=${availDate.split('T')[0]}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.occupiedShifts).toBeDefined();
      expect(res.body.occupiedShifts.length).toBe(1);
      expect(res.body.occupiedShifts[0].shift).toBe('T3');
    });

    it('Debería reconocer eventos externos de Google Calendar mediante la palabra clave #T1', async () => {
      const gDate = getFutureDate(new Date().getDay(), 50);
      const gDateStr = gDate.split('T')[0];
      // Obligamos al mock a devolver de mentira un evento proveniente de Google Calendar
      googleService.listEvents.mockResolvedValueOnce([
        {
          id: 'external-google-id',
          summary: 'Cumpleaños Manuel #T1',
          transparency: 'opaque',
          status: 'confirmed',
          extendedProperties: {}, // Simula ser creado desde google UI directamente (sin metadatos)
          start: { dateTime: `${gDateStr}T17:00:00+01:00` },
          end: { dateTime: `${gDateStr}T19:00:00+01:00` }
        }
      ]);

      const res = await request(app).get(`/api/v1/events/availability?fecha=${gDateStr}`);

      expect(res.statusCode).toBe(200);
      const shifts = res.body.occupiedShifts.map(s => s.shift);
      expect(shifts).toContain('T1'); // Debe haber leido el #T1 del titulo
    });

    it('Debería bloquear turnos por solapamiento de horarios de Google Calendar genérico', async () => {
      const gDate = getFutureDate(new Date().getDay(), 55);
      const gDateStr = gDate.split('T')[0];
      // Evento genérico #Neverland que ocupa de 17:30 a 20:30 hora local España
      // Usamos +01:00 (CET, invierno España) para simular lo que realmente envía Google Calendar
      googleService.listEvents.mockResolvedValueOnce([
        {
          id: 'external-block',
          summary: 'Mantenimiento #Neverland',
          transparency: 'opaque',
          status: 'confirmed',
          start: { dateTime: `${gDateStr}T17:30:00+01:00` },
          end: { dateTime: `${gDateStr}T20:30:00+01:00` }
        }
      ]);

      const res = await request(app).get(`/api/v1/events/availability?fecha=${gDateStr}`);

      expect(res.statusCode).toBe(200);
      const shifts = res.body.occupiedShifts.map(s => s.shift);
      // 17:30–20:30 local solapa con T1(17:00-19:00), T2(18:00-20:00), T3(19:15-21:15)
      expect(shifts).toContain('T1');
      expect(shifts).toContain('T2');
      expect(shifts).toContain('T3');
      expect(shifts.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Multi-actividades (talleres)', () => {
    beforeEach(async () => {
      await Config.create({
        menusNiños: [{ id: 'menu-1', precio: 15 }],
        plusFinDeSemana: 2,
        preciosAdultos: [],
        workshops: [
          { name: 'Slime', priceBase: 20, pricePlus: 30, active: true },
          { name: 'Tattoos', priceBase: 22, pricePlus: 32, active: true },
          { name: 'Cocina', priceBase: 25, pricePlus: 35, active: false },
          { name: 'Magia', priceBase: 25, pricePlus: 30, active: true }
        ],
        preciosExtras: { extension30: 30, extension60: 50 },
        extrasCatalogo: []
      });
    });

    const buildEvent = (extras = {}) => ({
      tipo: 'reserva',
      fecha: futureTuesday,
      turno: 'T1',
      cliente: {
        nombreNiño: 'Leo',
        nombrePadre: 'Ana',
        email: 'ana@example.com',
        telefono: '123456789',
        privacyPolicyConsent: true
      },
      detalles: {
        niños: { cantidad: 12, menuId: 'menu-1' },
        extras
      }
    });

    describe('Normalización del payload legacy en la escritura', () => {
      it('POST legacy: convierte `extras.taller` (string) en `extras.talleres` y no persiste el campo legacy', async () => {
        const res = await request(app)
          .post('/api/v1/events')
          .send(buildEvent({ taller: 'Magia' }));

        expect(res.statusCode).toBe(201);
        expect(res.body.detalles.extras.talleres).toEqual(['Magia']);
        expect(res.body.detalles.extras.taller).toBeUndefined();
        // priceBase de Magia en el catálogo (25 €), 12 niños → grupo normal
        expect(res.body.detalles.extras.precioTallerApplied).toBe(25);
      });

      it('POST legacy: si vienen `taller` y `talleres`, gana `talleres` y `taller` no se guarda', async () => {
        const res = await request(app)
          .post('/api/v1/events')
          .send(buildEvent({ talleres: ['Slime'], taller: 'Magia' }));

        expect(res.statusCode).toBe(201);
        expect(res.body.detalles.extras.talleres).toEqual(['Slime']);
        expect(res.body.detalles.extras.taller).toBeUndefined();
        // El precio se calcula con Slime (20 €), no con Magia (25 €)
        expect(res.body.detalles.extras.precioTallerApplied).toBe(20);
      });

      it('PATCH legacy: un payload con `taller` dispara la invalidación del snapshot y recalcula el precio', async () => {
        const fixedDate = getFutureDate(2, 60);
        const { insertedId } = await Event.collection.insertOne({
          tipo: 'reserva',
          fecha: fixedDate,
          turno: 'T1',
          estado: 'pendiente',
          cliente: {
            nombreNiño: 'Leo',
            nombrePadre: 'Ana',
            email: 'ana@example.com',
            telefono: '123456789',
            privacyPolicyConsent: true
          },
          detalles: {
            niños: { cantidad: 12, menuId: 'menu-1' },
            // Snapshot stale a propósito: 99 € no corresponde a ningún precio real
            extras: { talleres: ['Magia'], precioTallerApplied: 99 }
          }
        });

        const res = await request(app)
          .patch(`/api/v1/events/${insertedId}`)
          .send({ detalles: { extras: { taller: 'Slime' } } });

        expect(res.statusCode).toBe(200);
        expect(res.body.detalles.extras.talleres).toEqual(['Slime']);
        expect(res.body.detalles.extras.taller).toBeUndefined();
        // Sin normalización el guard `'talleres' in extras` no dispara y el
        // snapshot stale (99) sobreviviría al PATCH.
        expect(res.body.detalles.extras.precioTallerApplied).toBe(20);
        expect(res.body.detalles.extras.precioTallerApplied).not.toBe(99);
      });
    });

    it('Debería aceptar exactamente 3 actividades válidas', async () => {
      const res = await request(app)
        .post('/api/v1/events')
        .send(buildEvent({ talleres: ['Slime', 'Tattoos', 'Magia'] }));
      expect(res.statusCode).toBe(201);
      expect(res.body.detalles.extras.talleres).toEqual(['Slime', 'Tattoos', 'Magia']);
    });

    it('Debería rechazar 4 actividades con 400', async () => {
      const res = await request(app)
        .post('/api/v1/events')
        .send(buildEvent({ talleres: ['Slime', 'Tattoos', 'Cocina', 'Magia'] }));
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/Máximo 3 actividades permitidas/);
    });

    it('Debería aceptar un array vacío de actividades', async () => {
      const res = await request(app)
        .post('/api/v1/events')
        .send(buildEvent({ talleres: [] }));
      expect(res.statusCode).toBe(201);
      expect(res.body.detalles.extras.talleres).toEqual([]);
    });

    it('Debería rechazar actividades duplicadas en talleres', async () => {
      const res = await request(app)
        .post('/api/v1/events')
        .send(buildEvent({ talleres: ['Slime', 'Tattoos', 'Slime'] }));
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Actividad duplicada: Slime');
    });

    it('Debería aceptar actividades sin duplicados', async () => {
      const res = await request(app)
        .post('/api/v1/events')
        .send(buildEvent({ talleres: ['Slime', 'Tattoos'] }));
      expect(res.statusCode).toBe(201);
      expect(res.body.detalles.extras.talleres).toEqual(['Slime', 'Tattoos']);
    });

    it('Debería rechazar personajes duplicados', async () => {
      const res = await request(app)
        .post('/api/v1/events')
        .send(buildEvent({ personajes: ['Elsa', 'Anna', 'Elsa'] }));
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Personaje duplicado: Elsa');
    });

    it('Debería aceptar personajes sin duplicados', async () => {
      const res = await request(app)
        .post('/api/v1/events')
        .send(buildEvent({ personajes: ['Elsa', 'Anna'] }));
      expect(res.statusCode).toBe(201);
    });

    it('Debería rechazar actividad inexistente en el catálogo', async () => {
      const res = await request(app)
        .post('/api/v1/events')
        .send(buildEvent({ talleres: ['Slime', 'ActividadFantasma'] }));
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Actividad no válida o inactiva: ActividadFantasma');
    });

    it('Debería rechazar actividad existente pero inactiva', async () => {
      const res = await request(app)
        .post('/api/v1/events')
        .send(buildEvent({ talleres: ['Slime', 'Cocina'] }));
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Actividad no válida o inactiva: Cocina');
    });

    it('REQ-05: debería rechazar con 400 un PATCH que modifica la selección a una actividad inexistente', async () => {
      // Selección inicial VÁLIDA: Slime existe y está activo en el catálogo.
      const createRes = await request(app)
        .post('/api/v1/events')
        .send(buildEvent({ talleres: ['Slime'] }));

      expect(createRes.statusCode).toBe(201);
      expect(createRes.body.detalles.extras.talleres).toEqual(['Slime']);

      // PATCH que MODIFICA la selección hacia un nombre que no existe.
      // Al cambiar el conjunto respecto al snapshot previo, la validación de
      // catálogo (activity-validation/REQ-05) debe rechazarlo con 400.
      const res = await request(app)
        .patch(`/api/v1/events/${createRes.body.id}`)
        .send({ detalles: { extras: { talleres: ['ActividadInexistente'] } } });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Actividad no válida o inactiva: ActividadInexistente');
    });

    it('Debería aceptar todas las actividades válidas y activas', async () => {
      const res = await request(app)
        .post('/api/v1/events')
        .send(buildEvent({ talleres: ['Slime', 'Tattoos', 'Magia'] }));
      expect(res.statusCode).toBe(201);
      expect(res.body.detalles.extras.talleres).toEqual(['Slime', 'Tattoos', 'Magia']);
    });

    it('Debería detectar el límite de 3 actividades en el check explícito (caso no cubierto por el validador de schema en operadores de array)', async () => {
      // Este test cubre activity-validation/REQ-07: el check explícito en
      // validateEventData debe existir además del validador de schema.
      const res = await request(app)
        .post('/api/v1/events')
        .send(buildEvent({ talleres: ['Slime', 'Tattoos', 'Magia', 'Otra'] }));
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/Máximo 3 actividades permitidas/);
    });

    it('Debería permitir editar una reserva legacy con taller (sin talleres) aunque la actividad ya no exista', async () => {
      const fixedDate = getFutureDate(2, 60);
      const { insertedId } = await Event.collection.insertOne({
        tipo: 'reserva',
        fecha: fixedDate,
        turno: 'T1',
        estado: 'pendiente',
        cliente: {
          nombreNiño: 'Leo',
          nombrePadre: 'Ana',
          email: 'ana@example.com',
          telefono: '123456789',
          privacyPolicyConsent: true
        },
        detalles: {
          niños: { cantidad: 12, menuId: 'menu-1' },
          extras: { taller: 'ActividadAntigua' }
        }
      });

      const res = await request(app)
        .patch(`/api/v1/events/${insertedId}`)
        .send({ notasAdmin: 'Nota de prueba legacy' });

      expect(res.statusCode).toBe(200);
      expect(res.body.notasAdmin).toBe('Nota de prueba legacy');
    });

    it('Debería rechazar un PATCH con cliente inválido (la validación async debe propagarse como 400)', async () => {
      const fixedDate = getFutureDate(2, 60);
      const { insertedId } = await Event.collection.insertOne({
        tipo: 'reserva',
        fecha: fixedDate,
        turno: 'T1',
        estado: 'pendiente',
        cliente: {
          nombreNiño: 'Leo',
          nombrePadre: 'Ana',
          email: 'ana@example.com',
          telefono: '123456789',
          privacyPolicyConsent: true
        },
        detalles: {
          niños: { cantidad: 12, menuId: 'menu-1' },
          extras: { talleres: [] }
        }
      });

      const res = await request(app)
        .patch(`/api/v1/events/${insertedId}`)
        .send({ cliente: { nombreNiño: 'x'.repeat(101) } });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/Nombre del niño demasiado largo/);
    });

    it('D-01: debería aceptar un PATCH que añade actividad sobre una reserva migrada cuyo nombre del catálogo tiene espacio final', async () => {
      // Reproduce el caso real: la migración trimmea el valor legacy
      // ('Taller de chapas ') mientras el catálogo conserva el espacio final.
      await Config.deleteMany({});
      await Config.create({
        menusNiños: [{ id: 'menu-1', precio: 15 }],
        plusFinDeSemana: 2,
        preciosAdultos: [],
        workshops: [
          { name: 'Taller de chapas ', priceBase: 20, pricePlus: 30, active: true },
          { name: 'Slime', priceBase: 20, pricePlus: 30, active: true }
        ],
        preciosExtras: { extension30: 30, extension60: 50 },
        extrasCatalogo: []
      });

      const fixedDate = getFutureDate(2, 60);
      const { insertedId } = await Event.collection.insertOne({
        tipo: 'reserva',
        fecha: fixedDate,
        turno: 'T1',
        estado: 'pendiente',
        cliente: {
          nombreNiño: 'Leo',
          nombrePadre: 'Ana',
          email: 'ana@example.com',
          telefono: '123456789',
          privacyPolicyConsent: true
        },
        detalles: {
          niños: { cantidad: 12, menuId: 'menu-1' },
          extras: { talleres: ['Taller de chapas'], precioTallerApplied: 20 }
        }
      });

      const res = await request(app)
        .patch(`/api/v1/events/${insertedId}`)
        .send({
          detalles: {
            extras: {
              talleres: ['Taller de chapas', 'Slime'],
              personajes: [],
              pinata: false,
              observaciones: '',
              alergenos: ''
            }
          }
        });

      // Antes del fix devolvía 400 "Actividad no válida o inactiva: Taller de chapas"
      expect(res.statusCode).toBe(200);
      expect(res.body.detalles.extras.talleres).toEqual(['Taller de chapas', 'Slime']);
      expect(res.body.detalles.extras.precioTallerApplied).toBe(40);
    });

    it('D-01: debería tratar como duplicada una actividad que solo difiere en espacios o mayúsculas', async () => {
      const res = await request(app)
        .post('/api/v1/events')
        .send(buildEvent({ talleres: ['Slime', ' slime '] }));

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Actividad duplicada:  slime ');
    });
  });
});
