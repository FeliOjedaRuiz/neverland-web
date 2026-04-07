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

  // Si ya es un objeto Date, lo devolvemos
  if (fechaStr instanceof ReferenciaFecha) return fechaStr;

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

  // Fallback final
  return new ReferenciaFecha(fechaStr);
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

module.exports = {
  safeParseDate,
  getSafeNow,
  createSafeDate
};
