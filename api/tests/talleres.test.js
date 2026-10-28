const request = require('supertest');
const app = require('../app');
const Taller = require('../models/taller.model');
const Event = require('../models/event.model');
const User = require('../models/user.model');
const jwt = require('jsonwebtoken');

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

// --- Helpers ---

const tallerBase = {
  nombre: 'Taller de Slime',
  descripcion: 'Aprende a hacer slime divertido',
  precio: 10,
  aforo: 5,
  fecha: '2027-06-15T00:00:00.000Z', // Fecha futura garantizada
  turnos: ['T1'],
  horario: { inicio: '10:00', fin: '12:00' },
};

const inscripcionBase = {
  nombreNiño: 'Pedrito',
  edadNiño: 7,
  nombreResponsable: 'Juan Pérez',
  telefonoResponsable: '123456789',
  emailResponsable: 'juan@example.com',
  privacyPolicyConsent: true,
};

// --- Fixtures independientes de la zona horaria para la regla de producto "visible hasta el inicio" ---
// El día calendario actual de Europe/Madrid + la hora local se calculan con
// Intl, así que los fixtures nunca dependen de la zona horaria local del servidor.

const ZONA_HORARIA_MADRID = 'Europe/Madrid';

const obtenerPartesMadrid = (instante) => {
  const formateador = new Intl.DateTimeFormat('en-US', {
    timeZone: ZONA_HORARIA_MADRID,
    hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const partes = {};
  for (const parte of formateador.formatToParts(instante)) partes[parte.type] = parte.value;
  return {
    anio: Number(partes.year),
    mes: Number(partes.month),
    dia: Number(partes.day),
    hora: Number(partes.hour) % 24,
    minuto: Number(partes.minute),
  };
};

const completarConCeros = (numero) => String(numero).padStart(2, '0');

// Mismo día de Madrid, horario.inicio = hora actual de Madrid menos 1 minuto
// (limitado a "00:00"), horario.fin = "23:59". El fin queda deliberadamente
// todavía en el futuro para que el filtro antiguo basado en fin lo mantuviera visible.
const crearTallerIniciado = () => {
  const madrid = obtenerPartesMadrid(new Date());
  let minutosInicio = madrid.hora * 60 + madrid.minuto - 1;
  if (minutosInicio < 0) minutosInicio = 0;
  return {
    ...tallerBase,
    nombre: 'Taller Ya Iniciado',
    fecha: `${madrid.anio}-${completarConCeros(madrid.mes)}-${completarConCeros(madrid.dia)}T00:00:00.000Z`,
    horario: {
      inicio: `${completarConCeros(Math.floor(minutosInicio / 60))}:${completarConCeros(minutosInicio % 60)}`,
      fin: '23:59',
    },
    publico: true,
  };
};

// Mismo día de Madrid, horario.inicio = hora actual de Madrid más 60 minutos;
// si cruza la medianoche, se usa el SIGUIENTE día de Madrid a las "00:00".
const crearTallerProximo = () => {
  const madrid = obtenerPartesMadrid(new Date());
  const minutosAhora = madrid.hora * 60 + madrid.minuto;
  let dia = { anio: madrid.anio, mes: madrid.mes, dia: madrid.dia };
  let inicio;

  if (minutosAhora + 60 >= 24 * 60) {
    const siguienteDiaUtc = new Date(Date.UTC(madrid.anio, madrid.mes - 1, madrid.dia + 1));
    dia = {
      anio: siguienteDiaUtc.getUTCFullYear(),
      mes: siguienteDiaUtc.getUTCMonth() + 1,
      dia: siguienteDiaUtc.getUTCDate(),
    };
    inicio = '00:00';
  } else {
    const minutosInicio = minutosAhora + 60;
    inicio = `${completarConCeros(Math.floor(minutosInicio / 60))}:${completarConCeros(minutosInicio % 60)}`;
  }

  return {
    ...tallerBase,
    nombre: 'Taller Por Empezar',
    fecha: `${dia.anio}-${completarConCeros(dia.mes)}-${completarConCeros(dia.dia)}T00:00:00.000Z`,
    horario: { inicio, fin: '23:59' },
    publico: true,
  };
};

// --- Setup: crear usuario admin en MongoMemoryServer ---
// NOTA: setup.js hace afterEach que borra TODAS las colecciones.
// Por eso usamos beforeEach (no beforeAll) para recrear el admin antes de cada test.

let usuarioAdmin;

beforeEach(async () => {
  usuarioAdmin = await User.create({
    name: 'Test',
    surname: 'Admin',
    email: 'admin-test@neverland.com',
    password: 'test1234',
    role: 'admin',
  });
});

// Genera un token JWT con el _id real del admin creado en BD
const obtenerTokenAdmin = () => {
  if (!usuarioAdmin) throw new Error('usuarioAdmin not initialized — beforeEach no corrió');
  return jwt.sign({ sub: usuarioAdmin._id }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
};

describe('Talleres API — Sistema de Talleres con Inscripciones', () => {

  // ============================================================
  // BLOQUE 1: CRUD Admin
  // ============================================================
  describe('CRUD de Talleres (Admin)', () => {

    it('Debería crear un taller con datos válidos (admin)', async () => {
      const token = obtenerTokenAdmin();
      const res = await request(app)
        .post('/api/v1/talleres')
        .set('Authorization', `Bearer ${token}`)
        .send(tallerBase);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.nombre).toBe(tallerBase.nombre);
      expect(res.body.precio).toBe(tallerBase.precio);
      expect(res.body.publico).toBe(false); // Siempre inicia como no público
    });

    it('Debería rechazar un taller sin nombre → 400', async () => {
      const token = obtenerTokenAdmin();
      const { nombre, ...sinNombre } = tallerBase;
      const res = await request(app)
        .post('/api/v1/talleres')
        .set('Authorization', `Bearer ${token}`)
        .send(sinNombre);

      expect(res.statusCode).toBe(400);
    });

    it('Debería rechazar un taller sin fecha → 400', async () => {
      const token = obtenerTokenAdmin();
      const { fecha, ...sinFecha } = tallerBase;
      const res = await request(app)
        .post('/api/v1/talleres')
        .set('Authorization', `Bearer ${token}`)
        .send(sinFecha);

      expect(res.statusCode).toBe(400);
    });

    it('Debería rechazar un taller sin turnos → 400', async () => {
      const token = obtenerTokenAdmin();
      const res = await request(app)
        .post('/api/v1/talleres')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...tallerBase, turnos: [] });

      expect(res.statusCode).toBe(400);
    });

    it('Debería rechazar un taller sin horario → 400', async () => {
      const token = obtenerTokenAdmin();
      const { horario, ...sinHorario } = tallerBase;
      const res = await request(app)
        .post('/api/v1/talleres')
        .set('Authorization', `Bearer ${token}`)
        .send(sinHorario);

      expect(res.statusCode).toBe(400);
    });

    it('Debería rechazar talleres duplicados en misma fecha y turno → 409', async () => {
      const token = obtenerTokenAdmin();
      // Crear el primero
      await request(app)
        .post('/api/v1/talleres')
        .set('Authorization', `Bearer ${token}`)
        .send(tallerBase);

      // Intentar crear uno duplicado
      const res = await request(app)
        .post('/api/v1/talleres')
        .set('Authorization', `Bearer ${token}`)
        .send(tallerBase);

      expect(res.statusCode).toBe(409);
    });

    it('Debería listar talleres → 200 con array', async () => {
      const token = obtenerTokenAdmin();
      // Crear un taller primero
      await Taller.create({ ...tallerBase, publico: true });

      const res = await request(app)
        .get('/api/v1/talleres')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('Debería obtener el detalle de un taller existente → 200', async () => {
      const token = obtenerTokenAdmin();
      const taller = await Taller.create(tallerBase);

      const res = await request(app)
        .get(`/api/v1/talleres/${taller._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.nombre).toBe(tallerBase.nombre);
    });

    it('Debería retornar 404 para un taller que no existe', async () => {
      const token = obtenerTokenAdmin();
      const idFalso = '000000000000000000000001';

      const res = await request(app)
        .get(`/api/v1/talleres/${idFalso}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
    });

    it('Debería actualizar un taller existente → 200', async () => {
      const token = obtenerTokenAdmin();
      const taller = await Taller.create(tallerBase);

      const res = await request(app)
        .patch(`/api/v1/talleres/${taller._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ nombre: 'Taller Actualizado', precio: 15 });

      expect(res.statusCode).toBe(200);
      expect(res.body.nombre).toBe('Taller Actualizado');
      expect(res.body.precio).toBe(15);
    });

    it('NO debe sobreescribir inscripciones al actualizar el taller', async () => {
      const token = obtenerTokenAdmin();
      // Crear taller con una inscripción directamente en BD
      const taller = await Taller.create({
        ...tallerBase,
        publico: true,
        inscripciones: [{ ...inscripcionBase, fechaConsentimiento: new Date() }],
      });

      // Intentar sobreescribir inscripciones via PATCH
      const res = await request(app)
        .patch(`/api/v1/talleres/${taller._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ nombre: 'Nuevo Nombre', inscripciones: [] }); // Malicious attempt

      expect(res.statusCode).toBe(200);
      // Las inscripciones deben mantenerse intactas
      const tallerActualizado = await Taller.findById(taller._id);
      expect(tallerActualizado.inscripciones.length).toBe(1);
    });

    it('Debería eliminar un taller → 204', async () => {
      const token = obtenerTokenAdmin();
      const taller = await Taller.create(tallerBase);

      const res = await request(app)
        .delete(`/api/v1/talleres/${taller._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(204);

      // Verificar que realmente se eliminó de la BD
      const tallerEliminado = await Taller.findById(taller._id);
      expect(tallerEliminado).toBeNull();
    });

    it('Debería retornar 404 al eliminar un taller que no existe', async () => {
      const token = obtenerTokenAdmin();
      const idFalso = '000000000000000000000002';

      const res = await request(app)
        .delete(`/api/v1/talleres/${idFalso}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
    });
  });

  // ============================================================
  // BLOQUE 2: Inscripciones
  // ============================================================
  describe('Inscripciones de niños', () => {

    let tallerDisponible;

    beforeEach(async () => {
      // Crear un taller público con fecha futura y aforo para tests de inscripción
      tallerDisponible = await Taller.create({
        ...tallerBase,
        publico: true,
      });
    });

    it('Debería inscribir un niño con datos válidos → 201', async () => {
      const res = await request(app)
        .post(`/api/v1/talleres/${tallerDisponible._id}/inscripciones`)
        .send(inscripcionBase);

      expect(res.statusCode).toBe(201);
      expect(res.body.inscripcionExitosa).toBe(true);
      expect(res.body.numInscripciones).toBe(1);
    });

    it('Debería rechazar inscripción sin nombreNiño → 400', async () => {
      const { nombreNiño, ...sinNombre } = inscripcionBase;
      const res = await request(app)
        .post(`/api/v1/talleres/${tallerDisponible._id}/inscripciones`)
        .send(sinNombre);

      expect(res.statusCode).toBe(400);
    });

    it('Debería rechazar inscripción sin email → 400', async () => {
      const { emailResponsable, ...sinEmail } = inscripcionBase;
      const res = await request(app)
        .post(`/api/v1/talleres/${tallerDisponible._id}/inscripciones`)
        .send(sinEmail);

      expect(res.statusCode).toBe(400);
    });

    it('Debería rechazar un email inválido → 400', async () => {
      const res = await request(app)
        .post(`/api/v1/talleres/${tallerDisponible._id}/inscripciones`)
        .send({ ...inscripcionBase, emailResponsable: 'correo-invalido' });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/Email inválido/);
    });

    it('Debería rechazar teléfono con menos de 9 dígitos → 400', async () => {
      const res = await request(app)
        .post(`/api/v1/talleres/${tallerDisponible._id}/inscripciones`)
        .send({ ...inscripcionBase, telefonoResponsable: '1234' }); // Solo 4 dígitos

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/Teléfono inválido/);
    });

    it('Debería aceptar teléfono con formato internacional (+34 612 345 678) si tiene ≥9 dígitos', async () => {
      const res = await request(app)
        .post(`/api/v1/talleres/${tallerDisponible._id}/inscripciones`)
        .send({ ...inscripcionBase, telefonoResponsable: '+34 612 345 678' });

      expect(res.statusCode).toBe(201);
    });

    it('Debería rechazar nombre del niño mayor a 100 caracteres → 400', async () => {
      const nombreLargo = 'A'.repeat(101);
      const res = await request(app)
        .post(`/api/v1/talleres/${tallerDisponible._id}/inscripciones`)
        .send({ ...inscripcionBase, nombreNiño: nombreLargo });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/demasiado largo/);
    });

    it('Debería rechazar inscripción sin aceptar política de privacidad → 400', async () => {
      const res = await request(app)
        .post(`/api/v1/talleres/${tallerDisponible._id}/inscripciones`)
        .send({ ...inscripcionBase, privacyPolicyConsent: false });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/política de privacidad/);
    });

    it('Debería rechazar inscripción cuando el aforo está completo → 409', async () => {
      // Llenar el taller hasta el aforo (5)
      for (let i = 0; i < 5; i++) {
        await Taller.findByIdAndUpdate(
          tallerDisponible._id,
          { $push: { inscripciones: { ...inscripcionBase, emailResponsable: `test${i}@ex.com`, fechaConsentimiento: new Date() } } }
        );
      }

      // Intentar inscribir cuando ya no hay plazas
      const res = await request(app)
        .post(`/api/v1/talleres/${tallerDisponible._id}/inscripciones`)
        .send(inscripcionBase);

      expect(res.statusCode).toBe(409);
      expect(res.body.message).toMatch(/Aforo completo/);
    });

    it('Solo 1 inscripción debe tener éxito cuando queda exactamente 1 plaza', async () => {
      // Llenar hasta aforo-1 (4 de 5)
      for (let i = 0; i < 4; i++) {
        await Taller.findByIdAndUpdate(
          tallerDisponible._id,
          { $push: { inscripciones: { ...inscripcionBase, emailResponsable: `fill${i}@ex.com`, fechaConsentimiento: new Date() } } }
        );
      }

      // Dos peticiones simultáneas — solo una debe tener éxito
      const [res1, res2] = await Promise.all([
        request(app)
          .post(`/api/v1/talleres/${tallerDisponible._id}/inscripciones`)
          .send({ ...inscripcionBase, emailResponsable: 'primero@ex.com' }),
        request(app)
          .post(`/api/v1/talleres/${tallerDisponible._id}/inscripciones`)
          .send({ ...inscripcionBase, emailResponsable: 'segundo@ex.com' }),
      ]);

      const exitosos = [res1, res2].filter(r => r.statusCode === 201);
      const fallidos = [res1, res2].filter(r => r.statusCode === 409);

      expect(exitosos.length).toBe(1); // Solo una inscripción aceptada
      expect(fallidos.length).toBe(1); // La otra rechazada
    });

    it('El detalle público NO debe exponer datos de inscripciones', async () => {
      // Inscribir a alguien
      await Taller.findByIdAndUpdate(
        tallerDisponible._id,
        { $push: { inscripciones: { ...inscripcionBase, fechaConsentimiento: new Date() } } }
      );

      // Consultar sin token de admin
      const res = await request(app)
        .get(`/api/v1/talleres/${tallerDisponible._id}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).not.toHaveProperty('inscripciones'); // No debe exponer la lista
      expect(res.body).toHaveProperty('numInscripciones', 1); // Solo el conteo
    });

    it('El admin SÍ debe ver las inscripciones completas en el detalle', async () => {
      const token = obtenerTokenAdmin();
      await Taller.findByIdAndUpdate(
        tallerDisponible._id,
        { $push: { inscripciones: { ...inscripcionBase, fechaConsentimiento: new Date() } } }
      );

      const res = await request(app)
        .get(`/api/v1/talleres/${tallerDisponible._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      // El admin recibe el objeto Mongoose completo: tiene .inscripciones[] (no .numInscripciones)
      expect(Array.isArray(res.body.inscripciones)).toBe(true);
      expect(res.body.inscripciones.length).toBe(1);
      expect(res.body.inscripciones[0].emailResponsable).toBe(inscripcionBase.emailResponsable);
    });

    it('Un taller NO publicado no es accesible para el público (404)', async () => {
      const tallerNoPublicado = await Taller.create({
        ...tallerBase,
        nombre: 'Taller Sin Publicar',
        publico: false,
      });

      const res = await request(app)
        .get(`/api/v1/talleres/${tallerNoPublicado._id}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toMatch(/no encontrado/i);
    });

    it('El admin SÍ puede ver un taller no publicado por URL directa', async () => {
      const token = obtenerTokenAdmin();
      const tallerNoPublicado = await Taller.create({
        ...tallerBase,
        nombre: 'Taller Sin Publicar',
        publico: false,
      });

      const res = await request(app)
        .get(`/api/v1/talleres/${tallerNoPublicado._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.nombre).toBe('Taller Sin Publicar');
    });
  });

  // ============================================================
  // BLOQUE 3: Bloqueo de turnos en el calendario
  // ============================================================
  describe('Bloqueo de turnos en checkAvailability', () => {

    it('Un taller debe bloquear sus turnos en checkAvailability', async () => {
      // Crear taller directamente en BD
      await Taller.create({
        ...tallerBase,
        fecha: '2027-09-10T00:00:00.000Z',
        turnos: ['T2'],
        publico: true,
      });

      const res = await request(app)
        .get('/api/v1/events/availability?fecha=2027-09-10');

      expect(res.statusCode).toBe(200);
      expect(res.body.occupiedShifts).toBeDefined();

      const turnos = res.body.occupiedShifts.map(s => s.shift);
      expect(turnos).toContain('T2');

      // Verificar que el tipo es 'taller' (para que la UI lo muestre diferente)
      const turnoTaller = res.body.occupiedShifts.find(s => s.shift === 'T2' && s.tipo === 'taller');
      expect(turnoTaller).toBeDefined();
    });

    it('Crear un taller debe eliminar los bloqueos existentes en esos turnos', async () => {
      const token = obtenerTokenAdmin();
      const fechaTest = '2027-10-20T00:00:00.000Z';

      // Crear un bloqueo en T1 primero
      await Event.create({
        tipo: 'bloqueo',
        fecha: fechaTest,
        turno: 'T1',
        estado: 'confirmado',
      });

      // Verificar que el bloqueo existe
      const bloqueoAntes = await Event.findOne({ fecha: fechaTest, turno: 'T1', tipo: 'bloqueo' });
      expect(bloqueoAntes).not.toBeNull();

      // Crear taller que ocupa T1
      const res = await request(app)
        .post('/api/v1/talleres')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...tallerBase, fecha: fechaTest, turnos: ['T1'] });

      expect(res.statusCode).toBe(201);

      // El bloqueo debe haberse eliminado
      const bloqueoDepues = await Event.findOne({ fecha: fechaTest, turno: 'T1', tipo: 'bloqueo' });
      expect(bloqueoDepues).toBeNull();
    });

    it('Talleres pasados NO deben aparecer en el listado público', async () => {
      // Crear taller con fecha pasada
      await Taller.create({
        ...tallerBase,
        nombre: 'Taller Pasado',
        fecha: '2020-01-01T00:00:00.000Z',
        publico: true,
      });

      // Consultar sin token (público)
      const res = await request(app)
        .get('/api/v1/talleres/public');

      expect(res.statusCode).toBe(200);
      const nombres = res.body.map(t => t.nombre);
      expect(nombres).not.toContain('Taller Pasado');
    });
  });

  // ============================================================
  // BLOQUE 4: Autorización
  // ============================================================
  describe('Autorización — Rutas Protegidas', () => {

    it('Debería denegar POST /talleres sin token de admin → 401 o 403', async () => {
      const res = await request(app)
        .post('/api/v1/talleres')
        .send(tallerBase);

      expect([401, 403]).toContain(res.statusCode);
    });

    it('Debería denegar DELETE /talleres/:id sin token → 401 o 403', async () => {
      const taller = await Taller.create(tallerBase);

      const res = await request(app)
        .delete(`/api/v1/talleres/${taller._id}`);

      expect([401, 403]).toContain(res.statusCode);
    });

    it('Debería denegar PATCH /talleres/:id sin token → 401 o 403', async () => {
      const taller = await Taller.create(tallerBase);

      const res = await request(app)
        .patch(`/api/v1/talleres/${taller._id}`)
        .send({ nombre: 'Hack Attempt' });

      expect([401, 403]).toContain(res.statusCode);
    });

    it('Las inscripciones son públicas — no requieren autenticación', async () => {
      const taller = await Taller.create({ ...tallerBase, publico: true });

      const res = await request(app)
        .post(`/api/v1/talleres/${taller._id}/inscripciones`)
        .send(inscripcionBase);

      // No debe dar 401 ni 403 — el resultado puede ser 201 o 409 pero no auth error
      expect([201, 409]).toContain(res.statusCode);
    });
  });

  // ============================================================
  // BLOQUE 5: Regla de producto — visible/librable HASTA horario.inicio
  // ============================================================
  describe('Visibilidad hasta la hora de inicio del taller', () => {

    it('GET /talleres/public devuelve un taller cuya hora de inicio aún no ha llegado', async () => {
      const taller = await Taller.create(crearTallerProximo());

      const res = await request(app)
        .get('/api/v1/talleres/public');

      expect(res.statusCode).toBe(200);
      const nombres = res.body.map(t => t.nombre);
      expect(nombres).toContain(taller.nombre);
    });

    it('GET /talleres/public NO devuelve un taller ya iniciado el mismo día aunque horario.fin siga en el futuro', async () => {
      // Regresión clave: el filtro antiguo comparaba fecha + horario.fin, así que un
      // taller iniciado a las p. ej. 10:00 con fin a las 23:59 seguía visible.
      const taller = await Taller.create(crearTallerIniciado());

      const res = await request(app)
        .get('/api/v1/talleres/public');

      expect(res.statusCode).toBe(200);
      const nombres = res.body.map(t => t.nombre);
      expect(nombres).not.toContain(taller.nombre);
    });

    it('POST /talleres/:id/inscripciones: 201 para un taller por empezar y 409 para uno ya iniciado', async () => {
      const porEmpezar = await Taller.create(crearTallerProximo());
      const yaIniciado = await Taller.create(crearTallerIniciado());

      const ok = await request(app)
        .post(`/api/v1/talleres/${porEmpezar._id}/inscripciones`)
        .send(inscripcionBase);
      expect(ok.statusCode).toBe(201);
      expect(ok.body.inscripcionExitosa).toBe(true);

      const fallido = await request(app)
        .post(`/api/v1/talleres/${yaIniciado._id}/inscripciones`)
        .send({ ...inscripcionBase, emailResponsable: 'otro@example.com' });
      expect(fallido.statusCode).toBe(409);
      expect(fallido.body.message).toMatch(/ya ha comenzado/);
    });
  });

});
