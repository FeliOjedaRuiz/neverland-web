/**
 * Reparación de nombres de actividad corruptos en los eventos.
 *
 * Propósito:
 * Algunos eventos guardan el nombre de la actividad con saltos de línea embebidos,
 * típicamente porque el texto se compuso concatenando el nombre con su propia
 * copia ("Spa de beauty\nSpa beauty\nSpa beauty") o porque se truncó y se pegó
 * el nombre completo ("Fiesta aquatica premi\nFiesta aquatica premium").
 *
 * Esos valores NO resuelven contra el catálogo, así que:
 *   - la interfaz muestra texto ilegible (chips, resúmenes, email, Calendar);
 *   - un recálculo de precio aplicaría el fallback histórico 25/30 € en vez del
 *     precio real del catálogo (50 € en "Fiesta aquatica premium");
 *   - la validación de catálogo del admin rechaza cualquier modificación de la
 *     selección de actividades de esas reservas.
 *
 * Uso:
 *   node api/scripts/fix-corrupt-workshop-names.js
 *   node api/scripts/fix-corrupt-workshop-names.js --dry-run
 *
 * Requisitos previos:
 *   - Base de datos accesible mediante MONGODB_URI.
 *   - En ejecución real se invoca automáticamente api/scripts/backup-before-migrate.js
 *     ANTES de cualquier escritura. Si el backup falla, el script aborta sin tocar
 *     la base de datos.
 *
 * Reglas de transformación:
 *   - Solo se examinan los valores de actividad que contienen saltos de línea.
 *   - Para cada valor corrupto se prueba CADA línea por separado (trimmed) contra
 *     el catálogo, con comparación normalizada (trim + minúsculas).
 *   - Si alguna línea resuelve contra el catálogo, se sustituye el valor por el
 *     nombre EXACTO del catálogo.
 *   - Si ninguna línea resuelve, el evento se reporta como no reparado y NO se toca.
 *   - Se corrige el campo que exista: `detalles.extras.talleres` (array) si está
 *     presente; si no, `detalles.extras.taller` (legacy). Así el script es válido
 *     antes y después de la migración `taller` → `talleres`.
 *   - NUNCA se modifica `precioTotal` ni `precioTallerApplied`.
 *
 * Aviso: este script es una operación de datos manual. No tiene test automático.
 *        Su correcto funcionamiento se verifica mediante --dry-run y una segunda
 *        ejecución que reporte 0 reparaciones.
 */

require('dotenv').config();
const path = require('path');
const { spawnSync } = require('child_process');
const mongoose = require('mongoose');

const Event = require('../models/event.model');
const Config = require('../models/config.model');
const { resolverWorkshop, obtenerTalleres, obtenerPrecioTaller } = require('../utils/pricing');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neverland';
const IS_DRY_RUN = process.argv.includes('--dry-run');

/**
 * Oculta las credenciales de una URI de MongoDB para poder mostrarla en
 * mensajes de error sin filtrar usuario ni contraseña.
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
 * Indica si un valor de actividad está corrupto por contener saltos de línea.
 */
function esCorrupto(valor) {
  return typeof valor === 'string' && /[\n\r]/.test(valor);
}

/**
 * Extrae del catálogo las actividades utilizables.
 *
 * Se descartan las inactivas (`active === false`) y las suspendidas
 * (`suspended === true`) porque la validación de catálogo del runtime las
 * rechaza: reparar hacia una de ellas dejaría la reserva igual de inválida.
 * Filtrar antes de resolver evita además que, con nombres duplicados en el
 * catálogo, se elija la entrada inactiva.
 */
function actividadesUtilizables(workshops) {
  return (workshops || []).filter(
    (w) => w && typeof w.name === 'string' && w.active !== false && w.suspended !== true
  );
}

/**
 * Busca la línea de un valor corrupto que resuelve contra el catálogo.
 *
 * Devuelve el objeto del workshop del catálogo (con su nombre exacto) o null.
 * Si varias líneas resuelven a actividades DISTINTAS, el valor no se puede
 * reparar sin perder información: se devuelve null para que el script lo
 * reporte en lugar de colapsar actividades distintas en una sola.
 */
function resolverLineaDelCatalogo(workshops, valor) {
  const lineas = String(valor)
    .split(/[\n\r]+/)
    .map((l) => l.trim())
    .filter(Boolean);

  const encontrados = [];
  for (const linea of lineas) {
    const workshop = resolverWorkshop(workshops, linea);
    if (workshop && !encontrados.some((w) => w.name === workshop.name)) {
      encontrados.push(workshop);
    }
  }

  if (encontrados.length === 0) return null;
  if (encontrados.length > 1) return null; // actividades distintas: no se colapsa
  return encontrados[0];
}

/**
 * Calcula el precio total de una selección de actividades sumando el precio de
 * cada una. `precioTallerApplied` es el TOTAL de la selección, no el precio de
 * una actividad, así que la comparación debe hacerse contra la suma.
 */
function precioTotalDeSeleccion(workshops, nombres, ninos) {
  return nombres.reduce((total, nombre) => {
    const workshop = resolverWorkshop(workshops, nombre);
    if (!workshop) return total;
    return total + obtenerPrecioTaller(workshop, ninos);
  }, 0);
}

/**
 * Construye la operación de actualización para un evento, reparando solo los
 * valores corruptos del array `talleres`.
 */
function construirUpdateArray(evento, workshops) {
  const extras = evento.detalles.extras;
  const valores = Array.isArray(extras.talleres) ? extras.talleres : [];
  const reparados = [];
  const noResueltos = [];

  const nuevos = valores.map((valor) => {
    if (!esCorrupto(valor)) return valor;
    const workshop = resolverLineaDelCatalogo(workshops, valor);
    if (!workshop) {
      noResueltos.push(valor);
      return valor;
    }
    reparados.push({ antes: valor, despues: workshop.name });
    return workshop.name;
  });

  if (reparados.length === 0) return null;

  return {
    updateOps: { $set: { 'detalles.extras.talleres': nuevos } },
    reparados,
    noResueltos,
    seleccionReparada: nuevos
  };
}

/**
 * Construye la operación de actualización para un evento legacy con `taller`.
 */
function construirUpdateLegacy(evento, workshops) {
  const extras = evento.detalles.extras;
  const valor = extras.taller;
  if (!esCorrupto(valor)) return null;

  const workshop = resolverLineaDelCatalogo(workshops, valor);
  if (!workshop) {
    return { updateOps: null, reparados: [], noResueltos: [valor] };
  }

  return {
    updateOps: { $set: { 'detalles.extras.taller': workshop.name } },
    reparados: [{ antes: valor, despues: workshop.name }],
    noResueltos: []
  };
}

async function reparar() {
  console.log('==============================================');
  console.log('REPARACIÓN: nombres de actividad corruptos');
  console.log(`Modo: ${IS_DRY_RUN ? 'DRY-RUN (sin escrituras)' : 'REAL'}`);
  console.log('==============================================\n');

  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 20000
    });
    console.log('✓ Conectado a MongoDB\n');

    const config = await Config.findOne().lean();
    if (!config) {
      throw new Error(
        'No se encontró documento de Config. No se puede resolver el catálogo, abortando.'
      );
    }
    const workshops = config.workshops || [];
    const workshopsUtilizables = actividadesUtilizables(workshops);

    // Lectura con .lean() para que los campos ausentes sigan ausentes.
    const eventos = await Event.find({}).lean();
    console.log(`Procesando ${eventos.length} eventos...\n`);

    // Backup previo obligatorio solo en ejecución real.
    if (!IS_DRY_RUN) {
      ejecutarBackup();
    }

    const stats = {
      total: eventos.length,
      candidatos: 0,
      reparados: 0,
      escrituras: 0,
      noResueltos: 0,
      snapshotCoincide: 0,
      snapshotDiscrepa: 0
    };

    const detalleNoResueltos = new Map();
    const detalleDiscrepancias = new Map();

    for (const evento of eventos) {
      try {
        const extras = evento?.detalles?.extras;
        if (!extras) continue;

        const tieneArray =
          Array.isArray(extras.talleres) && extras.talleres.some((v) => esCorrupto(v));
        const tieneLegacy = esCorrupto(extras.taller);

        if (!tieneArray && !tieneLegacy) continue;
        stats.candidatos++;

        const construccion = tieneArray
          ? construirUpdateArray(evento, workshopsUtilizables)
          : construirUpdateLegacy(evento, workshopsUtilizables);

        if (!construccion || !construccion.updateOps) {
          if (construccion && construccion.noResueltos.length) {
            stats.noResueltos += construccion.noResueltos.length;
            for (const valor of construccion.noResueltos) {
              detalleNoResueltos.set(valor, (detalleNoResueltos.get(valor) || 0) + 1);
            }
          }
          continue;
        }

        stats.reparados += construccion.reparados.length;
        stats.noResueltos += construccion.noResueltos.length;
        for (const valor of construccion.noResueltos) {
          detalleNoResueltos.set(valor, (detalleNoResueltos.get(valor) || 0) + 1);
        }

        // Verificación informativa: `precioTallerApplied` es el TOTAL de la
        // selección, así que se compara con la suma de los precios de catálogo
        // de TODAS las actividades seleccionadas una vez reparada la selección.
        const ninos = evento?.detalles?.['niños']?.cantidad || 0;
        const snapshot = extras.precioTallerApplied;
        if (snapshot !== undefined && construccion.reparados.length > 0) {
          const seleccionReparada = obtenerTalleres({
            ...extras,
            ...(tieneArray
              ? { talleres: construccion.seleccionReparada }
              : { taller: construccion.reparados[0].despues })
          });
          const precioCatalogo = precioTotalDeSeleccion(
            workshopsUtilizables,
            seleccionReparada,
            ninos
          );
          if (Number(snapshot) === Number(precioCatalogo)) {
            stats.snapshotCoincide++;
          } else {
            stats.snapshotDiscrepa++;
            const clave = `${construccion.reparados[0].despues} (snapshot ${snapshot} vs catálogo ${precioCatalogo})`;
            detalleDiscrepancias.set(clave, (detalleDiscrepancias.get(clave) || 0) + 1);
          }
        }

        if (!IS_DRY_RUN) {
          await Event.updateOne({ _id: evento._id }, construccion.updateOps);
        }
        stats.escrituras++;

        const detalle = construccion.reparados
          .map((r) => `"${r.antes.replace(/[\n\r]+/g, '\\n')}" -> "${r.despues}"`)
          .join(', ');
        console.log(
          `  ${IS_DRY_RUN ? '[DRY-RUN] ' : ''}✓ ${evento.publicId || evento._id}: ${detalle}`
        );
      } catch (err) {
        console.error(`  ✗ Error procesando evento ${evento.publicId || evento._id}:`, err.message);
      }
    }

    console.log('\n==============================================');
    console.log('ESTADÍSTICAS DE REPARACIÓN');
    console.log('==============================================');
    console.log(`Total de documentos leídos:        ${stats.total}`);
    console.log(`Con actividad corrupta:             ${stats.candidatos}`);
    console.log(`Valores reparados:                  ${stats.reparados}`);
    console.log(`Valores NO reparados (sin coincidencia): ${stats.noResueltos}`);
    console.log(`Total de escrituras:                ${stats.escrituras}${IS_DRY_RUN ? ' (dry-run: 0 escrituras reales)' : ''}`);
    if (IS_DRY_RUN) {
      console.log(`Escrituras reales:                  0 (dry-run)`);
    }
    console.log(`Snapshot coherente con el catálogo:  ${stats.snapshotCoincide}`);
    console.log(`Snapshot discrepante (informativo): ${stats.snapshotDiscrepa}`);
    console.log('==============================================\n');

    if (detalleNoResueltos.size > 0) {
      console.log('Valores NO reparados (ninguna línea resuelve contra el catálogo):');
      for (const [valor, conteo] of detalleNoResueltos) {
        console.log(`  - "${valor.replace(/[\n\r]+/g, '\\n')}" → ${conteo} documento(s)`);
      }
      console.log('');
    }

    if (detalleDiscrepancias.size > 0) {
      console.log('Snapshot discrepante con el precio de catálogo (INFORMATIVO, no se modifica):');
      for (const [valor, conteo] of detalleDiscrepancias) {
        console.log(`  - "${valor}" → ${conteo} documento(s)`);
      }
      console.log('  El snapshot histórico se preserva; revisar antes de recalcular precios.');
      console.log('');
    }

    if (IS_DRY_RUN) {
      console.log('✓ Dry-run completado. Ningún documento fue modificado.');
    } else {
      console.log('✓ Reparación completada exitosamente.');
      console.log('  Recuerda: una segunda ejecución debe reportar 0 reparaciones.');
    }
  } catch (error) {
    let mensaje = error.message || error.reason?.message || String(error);
    if (error.name === 'MongooseServerSelectionError') {
      mensaje = `No se pudo conectar a MongoDB en ${redactarUri(MONGODB_URI)}. Verifica que el servidor esté activo y la URI sea correcta.`;
    }
    console.error('\n✗ Error fatal de reparación:', mensaje);
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
  reparar();
}

module.exports = reparar;
