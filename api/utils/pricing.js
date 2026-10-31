/**
 * Helpers puros de precio y lectura compatible de actividades.
 * No tienen efectos de lado ni dependen de red, mongoose ni estado global.
 */

/**
 * Devuelve el array de actividades seleccionadas, con fallback al campo legacy
 * `taller` durante la ventana deploy ↔ migración.
 *
 * Garantías:
 * - Si `extras.talleres` es un array, se devuelve una COPIA defensiva (nunca la
 *   referencia original), para que el llamante no pueda mutar el documento.
 * - Si no lo es, se ignora y se evalúa el legacy `extras.taller`.
 * - El sentinel `ninguno` se compara de forma insensible a mayúsculas y se
 *   ignoran espacios en blanco al inicio/final.
 * - Solo se acepta un `taller` legacy de tipo string; cualquier otro valor se
 *   descarta, evitando nombres inválidos como "[object Object]".
 * - El valor legacy devuelto está limpio de espacios exteriores.
 *
 * @param {Object} extras - Objeto `detalles.extras` de un evento.
 * @returns {Array} Array de nombres de actividades; siempre es un array.
 */
const obtenerTalleres = (extras) => {
  if (extras && Array.isArray(extras.talleres)) {
    return [...extras.talleres];
  }

  const legacy = extras?.taller;
  if (typeof legacy === 'string') {
    const normalizado = legacy.trim();
    if (normalizado !== '' && normalizado.toLowerCase() !== 'ninguno') {
      return [normalizado];
    }
  }

  return [];
};

/**
 * Indica si un grupo de niños supera el umbral de grupo grande.
 * @param {number} ninos - Cantidad de niños.
 * @returns {boolean} true si ninos > 15.
 */
const esGrupoGrande = (ninos) => ninos > 15;

/**
 * Calcula el precio unitario de una actividad para una cantidad de niños.
 *
 * - Si el grupo es grande y existe un pricePlus válido (> 0), lo usa;
 *   en caso contrario usa priceBase.
 * - Si el taller es inválido devuelve 0.
 * - Los valores de priceBase/pricePlus se coercen a número.
 *
 * NOTA: el fallback histórico de 25/30 € para un nombre no resuelto en el
 * catálogo NO se aplica aquí; es responsabilidad del controlador (TASK-03).
 *
 * @param {Object} workshop - Actividad del catálogo con priceBase/pricePlus.
 * @param {number} ninos - Cantidad de niños.
 * @returns {number} Precio de la actividad.
 */
const obtenerPrecioTaller = (workshop, ninos) => {
  if (!workshop || typeof workshop !== 'object') return 0;

  const priceBase = Number(workshop.priceBase) || 0;
  const pricePlus = Number(workshop.pricePlus) || 0;

  return esGrupoGrande(ninos)
    ? (pricePlus > 0 ? pricePlus : priceBase)
    : priceBase;
};

module.exports = {
  obtenerTalleres,
  esGrupoGrande,
  obtenerPrecioTaller
};
