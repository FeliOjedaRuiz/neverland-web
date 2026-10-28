/**
 * Utilidad para manejar fechas de forma segura en Safari/iOS.
 * Safari suele fallar al parsear "YYYY-MM-DD", prefiriendo "YYYY/MM/DD".
 */

export const safeParseDate = (dateStr) => {
  if (!dateStr) return null;

  // Si ya es un objeto Date, devolver una copia (nunca el mismo objeto:
  // los callers hacen .setHours() y mutarían el documento en memoria)
  if (dateStr instanceof Date) return new Date(dateStr.getTime());

  // Si es un string, normalizar guiones a barras para Safari
  if (typeof dateStr === 'string') {
    // Eliminar la parte T00:00:00 si existe para evitar problemas de zona horaria local
    const baseDate = dateStr.split('T')[0];
    const normalized = baseDate.replace(/-/g, '/');
    const date = new Date(normalized);

    // Si la fecha no es válida se devuelve una fecha inválida (Invalid Date),
    // sin parsear el string de forma nativa (Safari rompe con algunos formatos)
    if (isNaN(date.getTime())) {
      return new Date(NaN);
    }
    return date;
  }

  return new Date(dateStr);
};

/**
 * Formatea una fecha de forma consistente (DD/MM/YY).
 */
export const formatSafeDate = (dateStr, options = { year: '2-digit' }) => {
  const date = safeParseDate(dateStr);
  if (!date || isNaN(date.getTime())) return '';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = options.year === '2-digit'
    ? String(date.getFullYear()).slice(-2)
    : String(date.getFullYear());

  return `${day}/${month}/${year}`;
};

/**
 * Formatea una fecha en formato largo (Lunes, 26 de febrero de 2026).
 */
export const formatLongSafeDate = (dateStr) => {
  const date = safeParseDate(dateStr);
  if (!date || isNaN(date.getTime())) return '';

  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/* ────────────────────────────────────────────────────────────────
 * Talleres: instante de inicio de un taller.
 * Un taller es visible/reservable públicamente HASTA su hora de inicio
 * (horario.inicio leído como hora local de Europe/Madrid en el día
 * calendario del taller) y desaparece EN ese instante.
 * ──────────────────────────────────────────────────────────────── */

export const TIMEZONE_NEGOCIO = 'Europe/Madrid';

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
  return new Date(instant);
};

/**
 * El DÍA CALENDARIO del taller ({ year, month, day }), independiente de la zona horaria.
 * Mongoose convierte el "YYYY-MM-DD" del admin a medianoche UTC, así que el día
 * calendario almacenado es el día UTC. Nunca parsea con `new Date(string)`.
 * Devuelve null cuando la entrada falta o es inválida.
 */
export const getTallerDayParts = (fecha) => {
  if (fecha === null || fecha === undefined || fecha === '') return null;

  if (fecha instanceof Date) {
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
export const getTallerStartInstant = (fecha, horarioInicio) => {
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
export const isTallerIniciado = (taller, now = new Date()) => {
  const startInstant = getTallerStartInstant(taller?.fecha, taller?.horario?.inicio);
  if (!startInstant) return false;
  if (!now || Number.isNaN(now.getTime())) return false;
  return startInstant.getTime() <= now.getTime();
};
