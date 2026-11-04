/**
 * Normalización de nombres del catálogo de actividades: elimina espacios
 * finales (y de inicio) en `Config.workshops[].name`.
 *
 * Propósito:
 *   El catálogo legacy contiene nombres con espacio final
 *   (p. ej. `"Taller de chapas "`), mientras que la migración de eventos
 *   trimmea el valor guardado en `detalles.extras.talleres`. Esa discrepancia
 *   provocaba falsos negativos al resolver actividades (defecto D-01).
 *   Este script limpia el catálogo para que ambos lados coincidan.
 *
 * Uso:
 *   node api/scripts/normalize-workshop-names.js
 *   node api/scripts/normalize-workshop-names.js --dry-run
 *
 * Requisitos previos:
 *   - Base de datos accesible mediante MONGODB_URI (o mongodb://localhost:27017/neverland).
 *   - En ejecución real se invoca automáticamente api/scripts/backup-before-migrate.js
 *     ANTES de cualquier escritura. Si el backup falla, el script aborta sin tocar
 *     la base de datos.
 *
 * Reglas de transformación:
 *   - SOLO se modifica `workshops[].name` aplicando `trim()`.
 *   - NO se tocan `id`, `priceBase`, `pricePlus`, `desc`, `imageUrl`, `active`,
 *     `suspended` ni ningún otro campo del workshop.
 *   - NO se tocan `menusNiños`, `preciosAdultos`, `personajes`, `extrasCatalogo`
 *     ni `preciosExtras`.
 *   - Idempotente: un nombre ya limpio no genera escritura.
 *
 * Aviso: este script es una operación de datos manual. No tiene test automático.
 *        Su correcto funcionamiento se verifica mediante --dry-run y una segunda
 *        ejecución que reporte 0 normalizaciones.
 */

require('dotenv').config();
const path = require('path');
const { spawnSync } = require('child_process');
const mongoose = require('mongoose');

const Event = require('../models/event.model');
const Config = require('../models/config.model');
const { resolverWorkshop, obtenerTalleres } = require('../utils/pricing');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neverland';
const IS_DRY_RUN = process.argv.includes('--dry-run');

/**
 * Oculta las credenciales de una URI de MongoDB para poder mostrarla en
 * mensajes de error sin filtrar usuario ni contraseña.
 * @param {string} uri - URI de conexión.
 * @returns {string} URI con las credenciales sustituidas por '***'.
 */
const redactarUri = (uri) => String(uri).replace(/\/\/[^@/]+@/, '//***@');

/**
 * Ejecuta el script de backup previo como proceso independiente. Se reutiliza
 * api/scripts/backup-before-migrate.js sin modificaciones.
 */
function ejecutarBackup() {
  const backupScript = path.resolve(__dirname, 'backup-before-migrate.js');
  const repoRoot = path.resolve(__dirname, '..', '..');

  console.log('→ Ejecutando backup previo...\n');
  const result = spawnSync('node', [backupScript], {
    cwd: repoRoot,
    stdio: 'inherit',
    env: process.env
  });

  if (result.status !== 0) {
    throw new Error(
      `El backup previo falló (código ${result.status || result.signal}). ` +
      'Abortando sin realizar ninguna escritura.'
    );
  }
  console.log('\n✓ Backup previo completado.\n');
}

/**
 * Comprueba, con el criterio de comparación normalizado (trim + minúsculas),
 * cuántos valores de actividad de los eventos resuelven contra el catálogo y
 * cuáles no.
 *
 * Se consideran tanto el campo nuevo `detalles.extras.talleres` como el legacy
 * `detalles.extras.taller`, de modo que el reporte es útil tanto antes de la
 * migración (solo legacy) como después (solo `talleres`). La lectura de la
 * selección usa `obtenerTalleres`, que ya aplica la semántica de presencia con
 * fallback al campo legacy.
 *
 * Es un reporte INFORMATIVO (no un error): los valores no resueltos
 * corresponden a actividades retiradas del catálogo, para las que el sistema
 * mantiene el fallback histórico 25/30 €.
 *
 * NO se imprimen datos personales de los clientes.
 *
 * @param {Array} talleresDelCatalogo - Catálogo ya normalizado en memoria.
 * @returns {Promise<void>} Imprime el reporte por consola.
 */
async function reportarCoherencia(talleresDelCatalogo) {
  // Se incluyen los eventos con el array nuevo y los que solo tienen el campo
  // legacy, para que el reporte sea válido antes y después de la migración.
  const eventos = await Event.find({
    $or: [
      { 'detalles.extras.talleres': { $exists: true, $ne: [] } },
      { 'detalles.extras.taller': { $exists: true } }
    ]
  }).lean();

  let resueltas = 0;
  const noResueltas = new Map(); // valor → conteo

  for (const evento of eventos) {
    const extras = evento.detalles?.extras;
    if (!extras) continue;

    // `obtenerTalleres` resuelve la semántica de presencia y el fallback legacy.
    const talleres = obtenerTalleres(extras);
    if (!Array.isArray(talleres)) continue;

    for (const valor of talleres) {
      if (typeof valor !== 'string' || valor.trim() === '') continue;
      if (resolverWorkshop(talleresDelCatalogo, valor)) {
        resueltas++;
      } else {
        noResueltas.set(valor, (noResueltas.get(valor) || 0) + 1);
      }
    }
  }

  const totalNoResueltos = [...noResueltas.values()].reduce((a, b) => a + b, 0);
  const totalValores = resueltas + totalNoResueltos;

  console.log('\n==============================================');
  console.log('VERIFICACIÓN DE COHERENCIA (informativa)');
  console.log('==============================================');
  console.log(`Valores de actividad analizados:            ${totalValores}`);
  console.log(`Resuelven contra el catálogo (normalizado): ${resueltas}`);
  console.log(`NO resuelven (fallback histórico 25/30 €):  ${totalNoResueltos}`);

  if (noResueltas.size > 0) {
    console.log('\nValores no resueltos, agrupados por valor y conteo:');
    const ordenados = [...noResueltas.entries()].sort((a, b) => b[1] - a[1]);
    for (const [valor, conteo] of ordenados) {
      console.log(`  - "${valor}" → ${conteo} aparicion${conteo === 1 ? '' : 'es'}`);
    }
    console.log('\nNota: no es un error. Son actividades retiradas del catálogo;');
    console.log('      el sistema aplica el fallback histórico diseñado al recalcular.');
  } else if (totalValores === 0) {
    console.log('\nNo hay valores de actividad que analizar en la base de datos.');
  } else {
    console.log('\n✓ Todos los valores de actividades resuelven contra el catálogo.');
  }
  console.log('==============================================');
}

async function normalizar() {
  console.log('==================================================');
  console.log('NORMALIZACIÓN: workshops[].name (espacios finales)');
  console.log(`Modo: ${IS_DRY_RUN ? 'DRY-RUN (sin escrituras)' : 'REAL'}`);
  console.log('==================================================\n');

  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 20000
    });
    console.log('✓ Conectado a MongoDB\n');

    const config = await Config.findOne();
    if (!config) {
      throw new Error('No se encontró documento de Config. Nada que normalizar.');
    }

    const workshops = config.workshops || [];
    const cambios = [];
    let yaLimpios = 0;

    workshops.forEach((w, index) => {
      const original = w.name;
      if (typeof original !== 'string') {
        yaLimpios++;
        return;
      }
      const limpio = original.trim();
      if (limpio === original) {
        yaLimpios++;
        return;
      }
      cambios.push({ index, original, limpio });
    });

    console.log('==============================================');
    console.log('ESTADÍSTICAS DEL CATÁLOGO');
    console.log('==============================================');
    console.log(`Total de workshops:            ${workshops.length}`);
    console.log(`A normalizar:                   ${cambios.length}`);
    console.log(`Ya limpios:                     ${yaLimpios}`);
    if (cambios.length > 0) {
      console.log('\nDetalle de cambios (antes → después):');
      for (const c of cambios) {
        console.log(`  - [${c.index}] "${c.original}" → "${c.limpio}"`);
      }
    }
    console.log('==============================================\n');

    // Backup obligatorio solo en ejecución real y solo si hay cambios.
    if (!IS_DRY_RUN && cambios.length > 0) {
      ejecutarBackup();
    }

    let escrituras = 0;
    if (!IS_DRY_RUN && cambios.length > 0) {
      for (const c of cambios) {
        // Solo el campo name del workshop en la posición exacta.
        config.workshops[c.index].name = c.limpio;
      }
      await config.save();
      escrituras = cambios.length;
    }

    console.log(`Escrituras realizadas:         ${escrituras}${IS_DRY_RUN ? ' (dry-run)' : ''}`);

    // Verificación de coherencia con el catálogo final en memoria
    // (en dry-run, con los cambios ya aplicados en memoria pero no guardados).
    const catalogoFinal = IS_DRY_RUN
      ? workshops.map((w, i) => {
          const cambio = cambios.find((c) => c.index === i);
          return cambio ? { ...w, name: cambio.limpio } : w;
        })
      : (config.workshops || []);

    await reportarCoherencia(catalogoFinal);

    if (IS_DRY_RUN) {
      console.log('\n✓ Dry-run completado. Ningún documento fue modificado.');
    } else if (escrituras === 0) {
      console.log('\n✓ Nada que normalizar: el catálogo ya estaba limpio (idempotente).');
    } else {
      console.log('\n✓ Normalización completada exitosamente.');
      console.log('  Recuerda: una segunda ejecución debe reportar 0 normalizaciones.');
    }
  } catch (error) {
    let mensaje = error.message || error.reason?.message || String(error);
    if (error.name === 'MongooseServerSelectionError') {
      mensaje = `No se pudo conectar a MongoDB en ${redactarUri(MONGODB_URI)}. Verifica que el servidor esté activo y la URI sea correcta.`;
    }
    console.error('\n✗ Error fatal de normalización:', mensaje);
    if (error.stack && error.name !== 'MongooseServerSelectionError') {
      console.error(error.stack);
    }
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    console.log('✓ Conexión a MongoDB cerrada.');
  }
}

if (require.main === module) {
  normalizar();
}

module.exports = normalizar;
