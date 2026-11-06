/**
 * Migración idempotente: taller (String legacy) → talleres (Array).
 *
 * Propósito:
 * Transforma los eventos que aún persisten la actividad como un único String
 * (`detalles.extras.taller`) al nuevo modelo array (`detalles.extras.talleres`)
 * usado por la feature multi-actividades.
 *
 * Uso:
 *   node api/scripts/migrate-taller-to-array.js
 *   node api/scripts/migrate-taller-to-array.js --dry-run
 *
 * Requisitos previos:
 *   - Base de datos accesible mediante MONGODB_URI (o mongodb://localhost:27017/neverland).
 *   - Ejecutar preferentemente en un entorno controlado con copia de datos.
 *   - En ejecución real se invoca automáticamente api/scripts/backup-before-migrate.js
 *     ANTES de cualquier escritura. Si el backup falla, el script aborta sin tocar
 *     la base de datos.
 *
 * Reglas de transformación:
 *   - `talleres` ya existe               → skip (idempotente).
 *   - `extras` no existe                 → skip.
 *   - `taller` válido ('X')              → `talleres: ['X']`, preserva/backfill de
 *                                          `precioTallerApplied`, `$unset taller`.
 *   - `taller` = 'ninguno'/''/null/undef → `talleres: []`, `$unset precioTallerApplied`,
 *                                          `$unset taller`.
 *   - `precioTotal` NUNCA se modifica.
 *
 * Aviso: este script es una operación de datos manual. No tiene test automático.
 *        Su correcto funcionamiento se verifica mediante --dry-run y una segunda
 *        ejecución que reporte 0 transformaciones.
 */

require('dotenv').config();
const path = require('path');
const { spawnSync } = require('child_process');
const mongoose = require('mongoose');

const Event = require('../models/event.model');
const Config = require('../models/config.model');
const { obtenerPrecioTaller, esGrupoGrande } = require('../utils/pricing');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neverland';
const IS_DRY_RUN = process.argv.includes('--dry-run');

const FALLBACK_BASE = 25;
const FALLBACK_PLUS = 30;

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
 * Busca un workshop por nombre de forma insensible a mayúsculas/minúsculas.
 */
function resolverWorkshop(workshops, nombre) {
  if (!Array.isArray(workshops) || typeof nombre !== 'string') return null;
  const needle = nombre.trim().toLowerCase();
  if (!needle) return null;
  return workshops.find((w) => w && typeof w.name === 'string' && w.name.trim().toLowerCase() === needle) || null;
}

/**
 * Calcula el snapshot histórico para un documento legacy que no lo tenga.
 * Si el taller se resuelve en el catálogo se usa la fórmula vigente; si no,
 * se recurre al fallback histórico 25/30 € según el tamaño del grupo.
 */
function calcularSnapshotBackfill(evento, config) {
  const extras = evento?.detalles?.extras;
  const ninos = evento?.detalles?.niños?.cantidad || 0;
  const workshops = config?.workshops || [];
  const taller = extras?.taller;

  const workshop = resolverWorkshop(workshops, taller);
  if (workshop) {
    return obtenerPrecioTaller(workshop, ninos);
  }

  const preciosExtras = config?.preciosExtras || {};
  return esGrupoGrande(ninos)
    ? (Number(preciosExtras.tallerPlus) || FALLBACK_PLUS)
    : (Number(preciosExtras.tallerBase) || FALLBACK_BASE);
}

/**
 * Determina si un valor legacy de `taller` representa una actividad válida.
 */
function esTallerValido(taller) {
  if (typeof taller !== 'string') return false;
  const normalizado = taller.trim();
  return normalizado !== '' && normalizado.toLowerCase() !== 'ninguno';
}

/**
 * Construye la operación de actualización para un documento legacy válido.
 */
function construirUpdateTallerValido(evento, config) {
  const extras = evento.detalles.extras;
  const tallerLimpio = extras.taller.trim();

  const updateOps = {
    $set: { 'detalles.extras.talleres': [tallerLimpio] },
    $unset: { 'detalles.extras.taller': '' }
  };

  if (!('precioTallerApplied' in extras)) {
    const snapshot = calcularSnapshotBackfill(evento, config);
    updateOps.$set['detalles.extras.precioTallerApplied'] = snapshot;
  }

  return updateOps;
}

/**
 * Construye la operación de actualización para una selección vacía legacy.
 */
function construirUpdateSeleccionVacia(evento) {
  const extras = evento.detalles.extras;
  const updateOps = {
    $set: { 'detalles.extras.talleres': [] }
  };

  updateOps.$unset = { 'detalles.extras.precioTallerApplied': '' };
  if ('taller' in extras) {
    updateOps.$unset['detalles.extras.taller'] = '';
  }

  return updateOps;
}

/**
 * Cuenta documentos que tienen ambos campos (`taller` y `talleres`) presentes.
 */
async function contarDocumentosConAmbosCampos() {
  return Event.countDocuments({
    'detalles.extras.taller': { $exists: true },
    'detalles.extras.talleres': { $exists: true }
  });
}

async function migrar() {
  console.log('==============================================');
  console.log('MIGRACIÓN: taller → talleres (Array)');
  console.log(`Modo: ${IS_DRY_RUN ? 'DRY-RUN (sin escrituras)' : 'REAL'}`);
  console.log('==============================================\n');

  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 20000
    });
    console.log('✓ Conectado a MongoDB\n');

    const stats = {
      total: 0,
      conActividad: 0,
      seleccionVacia: 0,
      yaMigrados: 0,
      sinExtras: 0,
      snapshotPreservado: 0,
      snapshotBackfill: 0,
      escrituras: 0,
      errores: 0
    };

    const config = await Config.findOne().lean();
    if (!config) {
      console.warn('⚠ No se encontró documento de Config. El backfill usará fallback 25/30 €.');
    }

    // Lectura con .lean() para que los campos ausentes sean realmente undefined.
    const eventos = await Event.find({}).lean();
    stats.total = eventos.length;
    console.log(`Procesando ${stats.total} eventos...\n`);

    // Validación de seguridad: no debe haber documentos con ambos campos.
    const conAmbosCampos = await contarDocumentosConAmbosCampos();
    if (conAmbosCampos > 0) {
      throw new Error(
        `Se encontraron ${conAmbosCampos} documentos con ambos campos (taller + talleres). ` +
        'Estado inconsistente: resolver manualmente antes de migrar.'
      );
    }

    // Backup previo obligatorio solo en ejecución real.
    if (!IS_DRY_RUN) {
      ejecutarBackup();
    }

    for (const evento of eventos) {
      try {
        const extras = evento.detalles?.extras;

        if (!extras) {
          stats.sinExtras++;
          console.log(`  ⏭ ${evento.publicId || evento._id}: sin extras que migrar`);
          continue;
        }

        // Skip idempotente: si la clave `talleres` ya existe, el documento
        // ya fue migrado (incluso si el array está vacío).
        if ('talleres' in extras) {
          stats.yaMigrados++;
          console.log(`  ⏭ ${evento.publicId || evento._id}: ya migrado (talleres existe)`);
          continue;
        }

        let updateOps;
        const snapshotExistente = 'precioTallerApplied' in extras;

        if (esTallerValido(extras.taller)) {
          stats.conActividad++;
          if (snapshotExistente) {
            stats.snapshotPreservado++;
          } else {
            stats.snapshotBackfill++;
          }
          updateOps = construirUpdateTallerValido(evento, config);
        } else {
          stats.seleccionVacia++;
          updateOps = construirUpdateSeleccionVacia(evento);
        }

        if (!IS_DRY_RUN) {
          await Event.updateOne({ _id: evento._id }, updateOps);
        }
        stats.escrituras++;

        const talleresFinal = updateOps.$set['detalles.extras.talleres'];
        const snapshotMsg = updateOps.$set['detalles.extras.precioTallerApplied'] !== undefined
          ? `snapshot=${updateOps.$set['detalles.extras.precioTallerApplied']}€ (backfill)`
          : snapshotExistente
            ? `snapshot=${extras.precioTallerApplied}€ (preservado)`
            : 'snapshot=$unset';
        console.log(
          `  ${IS_DRY_RUN ? '[DRY-RUN] ' : ''}✓ ${evento.publicId || evento._id}: ` +
          `talleres=[${talleresFinal.join(', ') || 'vacío'}], ${snapshotMsg}`
        );
      } catch (err) {
        stats.errores++;
        console.error(`  ✗ Error procesando evento ${evento.publicId || evento._id}:`, err.message);
      }
    }

    console.log('\n==============================================');
    console.log('ESTADÍSTICAS DE MIGRACIÓN');
    console.log('==============================================');
    console.log(`Total de documentos leídos:     ${stats.total}`);
    console.log(`A migrar (con actividad):       ${stats.conActividad}`);
    console.log(`A migrar (selección vacía):     ${stats.seleccionVacia}`);
    console.log(`Omitidos (ya migrados):         ${stats.yaMigrados}`);
    console.log(`Omitidos (sin extras):          ${stats.sinExtras}`);
    console.log(`Con snapshot preservado:        ${stats.snapshotPreservado}`);
    console.log(`Con snapshot a backfill:        ${stats.snapshotBackfill}`);
    console.log(`Total de escrituras:            ${stats.escrituras}`);
    if (IS_DRY_RUN) {
      console.log(`Escrituras reales:              0 (dry-run)`);
    }
    if (stats.errores > 0) {
      console.log(`Errores:                        ${stats.errores}`);
    }
    console.log('==============================================\n');

    if (stats.errores > 0) {
      throw new Error('La migración terminó con errores. Revisar el log arriba.');
    }

    if (IS_DRY_RUN) {
      console.log('✓ Dry-run completado. Ningún documento fue modificado.');
    } else {
      console.log('✓ Migración completada exitosamente.');
      console.log('  Recuerda: una segunda ejecución debe reportar 0 transformaciones.');
    }
  } catch (error) {
    let mensaje = error.message || error.reason?.message || String(error);
    if (error.name === 'MongooseServerSelectionError') {
      mensaje = `No se pudo conectar a MongoDB en ${redactarUri(MONGODB_URI)}. Verifica que el servidor esté activo y la URI sea correcta.`;
    }
    console.error('\n✗ Error fatal de migración:', mensaje);
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
  migrar();
}

module.exports = migrar;
