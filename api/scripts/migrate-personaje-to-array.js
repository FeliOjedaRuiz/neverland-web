/**
 * Migración idempotente: personaje (String) → personajes (Array)
 * 
 * Uso: node migrate-personaje-to-array.js
 * 
 * Esta migración:
 * - Convierte `personaje: 'Elsa'` → `personajes: ['Elsa']`
 * - Convierte `personaje: 'ninguno'` / null / undefined → `personajes: []`
 * - Elimina el campo `personaje` obsoleto
 * - Recalcula `precioPersonajeApplied` según la nueva lógica
 * - Añade `precioPack3Personajes: 100` al Config si no existe
 */

require('dotenv').config();
const mongoose = require('mongoose');

const Event = require('../models/event.model');
const Config = require('../models/config.model');

const PRECIO_UNITARIO_DEFAULT = 40;
const PRECIO_PACK_3_DEFAULT = 100;

async function migrate() {
  console.log('===========================================');
  console.log('MIGRACIÓN: personaje → personajes (Array)');
  console.log('===========================================\n');

  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/neverland');
    console.log('✓ Conectado a MongoDB\n');

    let stats = {
      total: 0,
      converted: 0,
      skipped: 0,
      errors: 0
    };

    // 1. Añadir precioPack3Personajes al Config si no existe
    const config = await Config.findOne();
    if (config) {
      if (config.preciosExtras && config.preciosExtras.precioPack3Personajes === undefined) {
        config.preciosExtras.precioPack3Personajes = PRECIO_PACK_3_DEFAULT;
        await config.save();
        console.log('✓ Config actualizado: precioPack3Personajes =', PRECIO_PACK_3_DEFAULT);
      } else {
        console.log('✓ Config ya tiene precioPack3Personajes:', config.preciosExtras?.precioPack3Personajes);
      }
    } else {
      console.log('⚠ No se encontró documento de Config');
    }
    console.log('');

    // 2. Migrar eventos — usar lean() para evitar defaults de Mongoose que harían
    //    que `extras.personajes` siempre sea [] aunque no esté en la DB
    const eventos = await Event.find({}).lean();
    stats.total = eventos.length;
    console.log(`Procesando ${stats.total} eventos...\n`);

    for (const evento of eventos) {
      try {
        const extras = evento.detalles?.extras;
        if (!extras) {
          stats.skipped++;
          continue;
        }

        // Skip if already migrated (personajes field exists and is array)
        if (extras.personajes !== undefined) {
          stats.skipped++;
          console.log(`  ⏭ ${evento.publicId}: ya migrado (personajes existe)`);
          continue;
        }

        // Get the old personaje value
        const oldPersonaje = extras.personaje;

        // Convert to new format
        let newPersonajes = [];
        let newPrecioPersonajeApplied;

        if (oldPersonaje && oldPersonaje !== 'ninguno' && oldPersonaje !== null && oldPersonaje !== undefined) {
          // Single character: 'Elsa' → ['Elsa']
          newPersonajes = [oldPersonaje];
          
          // Recalculate price for single character (same as before)
          const precioUnitario = config?.preciosExtras?.personaje || PRECIO_UNITARIO_DEFAULT;
          newPrecioPersonajeApplied = precioUnitario;
        } else {
          // No character: 'ninguno'/null/undefined → []
          newPersonajes = [];
          newPrecioPersonajeApplied = undefined; // No price for no characters
        }

        // Update via updateOne (evento is lean plain object, no .save())
        const updateOps = {
          $set: {
            'detalles.extras.personajes': newPersonajes,
          },
          $unset: {
            'detalles.extras.personaje': '',
          }
        };
        if (newPrecioPersonajeApplied !== undefined) {
          updateOps.$set['detalles.extras.precioPersonajeApplied'] = newPrecioPersonajeApplied;
        } else {
          updateOps.$unset['detalles.extras.precioPersonajeApplied'] = '';
        }

        await Event.updateOne({ _id: evento._id }, updateOps);
        stats.converted++;

        const chars = newPersonajes.join(', ') || '(ninguno)';
        const price = newPrecioPersonajeApplied !== undefined ? `${newPrecioPersonajeApplied}€` : 'N/A';
        console.log(`  ✓ ${evento.publicId}: personajes=[${chars}], precioPersonajeApplied=${price}`);

      } catch (err) {
        stats.errors++;
        console.error(`  ✗ Error en evento ${evento.publicId}:`, err.message);
      }
    }

    console.log('\n===========================================');
    console.log('ESTADÍSTICAS DE MIGRACIÓN');
    console.log('===========================================');
    console.log(`Total eventos:     ${stats.total}`);
    console.log(`Migrados:          ${stats.converted}`);
    console.log(`Omitidos (ya migrados): ${stats.skipped}`);
    console.log(`Errores:           ${stats.errors}`);
    console.log('===========================================\n');

    if (stats.errors > 0) {
      console.warn('⚠ La migración terminó con errores. Revisar logs arriba.');
      process.exit(1);
    } else {
      console.log('✓ Migración completada exitosamente.');
    }

  } catch (error) {
    console.error('✗ Error fatal de migración:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n✓ Conexión a MongoDB cerrada.');
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  migrate();
}

module.exports = migrate;
