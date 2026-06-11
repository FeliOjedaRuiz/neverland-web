/**
 * Sincroniza las 6 reservas migradas con Google Calendar.
 * Como ya tienen googleEventId, el servicio hará update (no insert).
 *
 * Uso: node scripts/sync-google-calendar.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Event = require('../models/event.model');
const googleService = require('../services/google.service');

const AFFECTED_IDS = ['ZCJ33Z', 'SKUTB3', '9MOMOF', 'YOS8HI', '9Z97MA', 'KWK6MQ'];

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ MongoDB conectado.');

  // Esperar a que el servicio de Google se inicialice (init() es async en el fondo)
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const events = await Event.find({ publicId: { $in: AFFECTED_IDS } });
  console.log(`📅 ${events.length} reservas a sincronizar.\n`);

  let synced = 0;
  let skipped = 0;
  let failed = 0;

  for (const event of events) {
    const fecha = new Date(event.fecha).toISOString().split('T')[0];
    console.log(`🔄 ${event.publicId} | ${fecha} | ${event.cliente?.nombreNiño}`);

    if (!event.googleEventId) {
      console.log(`   ⚠️  Sin googleEventId — no se puede sincronizar.`);
      skipped++;
      continue;
    }

    try {
      const result = await googleService.createCalendarEvent(event);
      if (result?.id) {
        console.log(`   ✅ Sincronizado: ${result.id}`);
        synced++;
      } else {
        console.log(`   ⚠️  Sin respuesta del servicio.`);
        skipped++;
      }
    } catch (err) {
      console.log(`   ❌ Error: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📊 RESULTADO:`);
  console.log(`   Sincronizadas: ${synced}`);
  console.log(`   Saltadas: ${skipped}`);
  console.log(`   Fallidas: ${failed}`);

  await mongoose.disconnect();
  console.log('\n👋 Desconectado.');
}

main().catch((err) => { console.error('❌', err); process.exit(1); });
