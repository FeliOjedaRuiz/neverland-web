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
  // Semántica de PRESENCIA: si la clave `talleres` existe y es un array,
  // se respeta tal cual (incluso cuando está vacío). Solo si la clave NO
  // está presente se recurre al campo legacy `taller`. Esto requiere que el
  // schema NO defina `default: []` para `talleres`; de lo contrario Mongoose
  // inyectaría siempre la clave y el fallback legacy nunca se activaría.
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

/**
 * Normaliza un nombre de actividad para compararlos de forma segura.
 *
 * Aplica `trim()` y `toLowerCase()`, de modo que un nombre con espacios
 * finales (dato legacy del catálogo, p. ej. `"Taller de chapas "`) o en
 * mayúsculas se considera IGUAL que su versión limpia.
 *
 * @param {*} nombre - Valor a normalizar; se acepta cualquier tipo
 *   (`null`/`undefined` se tratan como cadena vacía).
 * @returns {string} Nombre normalizado (trim + minúsculas).
 */
const normalizarNombreActividad = (nombre) => String(nombre ?? '').trim().toLowerCase();

/**
 * Busca una actividad en el catálogo comparando nombres normalizados.
 *
 * Insensible a espacios exteriores y a mayúsculas/minúsculas en AMBOS lados
 * (el nombre recibido y el `name` del catálogo). Esto evita falsos negativos
 * tras la migración de datos, que trimmea el valor guardado en el evento
 * mientras el catálogo conserva el espacio final (defecto D-01).
 *
 * @param {Array} workshops - Catálogo de actividades (`Config.workshops`).
 * @param {string} nombre - Nombre de la actividad a resolver.
 * @returns {Object|null} El workshop encontrado o `null` si no existe.
 */
const resolverWorkshop = (workshops, nombre) => {
  if (!Array.isArray(workshops) || typeof nombre !== 'string') return null;
  const nombreBuscado = normalizarNombreActividad(nombre);
  if (!nombreBuscado) return null;
  return workshops.find(
    (w) => w && typeof w.name === 'string' && normalizarNombreActividad(w.name) === nombreBuscado
  ) || null;
};

module.exports = {
  obtenerTalleres,
  esGrupoGrande,
  obtenerPrecioTaller,
  normalizarNombreActividad,
  resolverWorkshop
};
