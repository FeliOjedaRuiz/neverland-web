/**
 * Utilidad para manejar fechas de forma segura en Safari/iOS.
 * Safari suele fallar al parsear "YYYY-MM-DD", prefiriendo "YYYY/MM/DD".
 */

export const safeParseDate = (dateStr) => {
  if (!dateStr) return null;

  // Si ya es un objeto Date, devolverlo
  if (dateStr instanceof Date) return dateStr;

  // Si es un string, normalizar guiones a barras para Safari
  if (typeof dateStr === 'string') {
    // Eliminar la parte T00:00:00 si existe para evitar problemas de zona horaria local
    const baseDate = dateStr.split('T')[0];
    const normalized = baseDate.replace(/-/g, '/');
    const date = new Date(normalized);

    // Si la fecha no es válida, intentar con el string original como fallback
    if (isNaN(date.getTime())) {
      return new Date(dateStr);
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
