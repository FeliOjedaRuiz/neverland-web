/**
 * Utilidad para manejar fechas de forma segura en el Backend, 
 * sincronizada con la lógica del frontend para evitar inconsistencias en Safari/iOS.
 */

const ReferenciaFecha = Date;

/**
 * Parseo seguro de fecha para evitar errores en Safari/iOS.
 */
const safeParseDate = (fechaStr) => {
  if (!fechaStr) return null;

  // Si ya es un objeto Date, devolvemos una COPIA: los callers hacen
  // .setHours(...) y mutarían el documento Mongoose en memoria.
  if (fechaStr instanceof ReferenciaFecha) return new ReferenciaFecha(fechaStr.getTime());

  // Si es un número (timestamp), es seguro
  if (typeof fechaStr === 'number') return new ReferenciaFecha(fechaStr);

  // Si es un string, normalizamos para evitar inconsistencias de Safari
  if (typeof fechaStr === 'string') {
    // 1. Intentar parsear formato YYYY-MM-DD (común en el proyecto)
    const coincidencia = fechaStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (coincidencia) {
      const [, anio, mes, dia] = coincidencia.map(Number);
      // El constructor con números es siempre seguro en todos los navegadores
      return new ReferenciaFecha(anio, mes - 1, dia);
    }

    // 2. Fallback: Normalizar guiones por barras y usar timestamp
    const fechaBase = fechaStr.split('T')[0];
    const normalizada = fechaBase.replace(/-/g, '/');
    const milisegundos = ReferenciaFecha.parse(normalizada) || ReferenciaFecha.parse(fechaStr);
    
    if (!isNaN(milisegundos)) {
      return new ReferenciaFecha(milisegundos);
    }
  }

  // Fallback final: fecha inválida, sin parseo nativo del string (Safari)
  return new ReferenciaFecha(NaN);
};

/**
 * Devuelve la fecha y hora actuales.
 */
const getSafeNow = () => new ReferenciaFecha(ReferenciaFecha.now());

/**
 * Crea una fecha basada en componentes numéricos (seguro para Safari).
 */
const createSafeDate = (...argumentos) => {
  if (argumentos.length === 1 && argumentos[0] instanceof ReferenciaFecha) {
    return new ReferenciaFecha(argumentos[0].getTime());
  }
  return new ReferenciaFecha(...argumentos);
};

/* ────────────────────────────────────────────────────────────────
 * Talleres: instante de inicio de un taller.
 * Un taller es visible/reservable públicamente HASTA su hora de inicio
 * (horario.inicio leído como hora local de Europe/Madrid en el día
 * calendario del taller) y desaparece EN ese instante.
 * Refleja web/src/utils/safeDate.js — mantener ambos sincronizados.
 * ──────────────────────────────────────────────────────────────── */

const TIMEZONE_NEGOCIO = 'Europe/Madrid';

/**
 * Offset (ms) de `timeZone` respecto a UTC en el instante indicado.
 * A prueba de DST: derivado de los componentes de Intl, nunca de get/setHours locales.
 */
const getTimeZoneOffsetMs = (instant, timeZone) => {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const parts = {};
  for (const p of dtf.formatToParts(instant)) parts[p.type] = p.value;
  const asUTC = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24, // % 24 evita que ICU emita la hora "24"
    Number(parts.minute),
    Number(parts.second),
  );
  return asUTC - instant.getTime();
};

/**
 * Convierte una hora local de `timeZone` en un instante absoluto.
 * Corrección de offset en dos pasadas para resolver correctamente los cambios de DST.
 */
const zonedWallClockToInstant = ({ year, month, day, hour, minute }, timeZone) => {
  const naive = Date.UTC(year, month - 1, day, hour, minute, 0);
  let offset = getTimeZoneOffsetMs(new Date(naive), timeZone);
  let instant = naive - offset;
  const corrected = getTimeZoneOffsetMs(new Date(instant), timeZone);
  if (corrected !== offset) {
    offset = corrected;
    instant = naive - offset;
  }
  return new ReferenciaFecha(instant);
};

/**
 * El DÍA CALENDARIO del taller ({ year, month, day }), independiente de la zona horaria.
 * Mongoose convierte el "YYYY-MM-DD" del admin a medianoche UTC, así que el día
 * calendario almacenado es el día UTC. Nunca parsea con `new Date(string)`.
 * Devuelve null cuando la entrada falta o es inválida.
 */
const getTallerDayParts = (fecha) => {
  if (fecha === null || fecha === undefined || fecha === '') return null;

  if (fecha instanceof ReferenciaFecha) {
    if (Number.isNaN(fecha.getTime())) return null;
    return {
      year: fecha.getUTCFullYear(),
      month: fecha.getUTCMonth() + 1,
      day: fecha.getUTCDate(),
    };
  }

  const [yearStr, monthStr, dayStr] = String(fecha).split('T')[0].split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
};

/**
 * Instante exacto en el que empieza el taller: `horarioInicio` ("HH:MM") leído
 * como hora local de Europe/Madrid en el día calendario del taller.
 * Devuelve null si la entrada es inválida.
 */
const getTallerStartInstant = (fecha, horarioInicio) => {
  const dayParts = getTallerDayParts(fecha);
  if (!dayParts) return null;
  if (typeof horarioInicio !== 'string') return null;

  const match = horarioInicio.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;

  return zonedWallClockToInstant({ ...dayParts, hour, minute }, TIMEZONE_NEGOCIO);
};

/**
 * true cuando el taller ya comenzó (inscripciones cerradas / ocultarlo).
 * Falta `taller.fecha` / `taller.horario.inicio` o es inválido → false
 * (mantiene el taller visible, igual que el fallback histórico).
 */
const isTallerIniciado = (taller, now = new ReferenciaFecha()) => {
  const startInstant = getTallerStartInstant(taller?.fecha, taller?.horario?.inicio);
  if (!startInstant) return false;
  if (!now || Number.isNaN(now.getTime())) return false;
  return startInstant.getTime() <= now.getTime();
};

module.exports = {
  safeParseDate,
  getSafeNow,
  createSafeDate,
  TIMEZONE_NEGOCIO,
  getTallerDayParts,
  getTallerStartInstant,
  isTallerIniciado
};
