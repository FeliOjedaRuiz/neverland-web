/**
 * Lectura one-time — Busca reservas con Piñata legacy (campo `pinata: true`
 * sin el slug 'pinata' en catalogoItemIds) para que el admin pueda
 * ver cómo se renderizan después de los cambios de catálogo.
 *
 * Uso:
 *   node scripts/find-legacy-pinata-reservations.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Event = require('../models/event.model');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI no definida en api/.env');
  process.exit(1);
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Conectado a MongoDB\n');

  // Reservas con Piñata legacy: pinata=true sin slug 'pinata' en catalogoItemIds
  const legacy = await Event.find({
    tipo: 'reserva',
    estado: { $ne: 'cancelada' },
    'detalles.extras.pinata': true,
    'detalles.extras.catalogoItemIds': { $nin: ['pinata'] },
  })
    .select('publicId cliente.nombreNiño fecha turno detalles.extras precioTotal')
    .sort({ fecha: -1 })
    .limit(10)
    .lean();

  console.log(`🎯 Reservas con Piñata LEGACY (pinata=true sin catalogoItemIds=['pinata']): ${legacy.length}\n`);
  for (const e of legacy) {
    const fecha = e.fecha ? new Date(e.fecha).toLocaleDateString('es-ES') : '?';
    const catalogoCount = (e.detalles?.extras?.catalogoItemIds || []).length;
    console.log(`  ${e.publicId} | ${fecha} | ${e.cliente?.nombreNiño || '?'} | ${e.precioTotal}€ | catalog=${catalogoCount}`);
  }

  // También reservas NUEVAS (con catálogo) para comparar
  const newStyle = await Event.find({
    tipo: 'reserva',
    estado: { $ne: 'cancelada' },
    'detalles.extras.catalogoItemIds': 'pinata',
  })
    .select('publicId cliente.nombreNiño fecha turno detalles.extras precioTotal')
    .sort({ fecha: -1 })
    .limit(5)
    .lean();

  console.log(`\n🆕 Reservas NUEVAS con Piñata del catálogo (catalogoItemIds=['pinata']): ${newStyle.length}\n`);
  for (const e of newStyle) {
    const fecha = e.fecha ? new Date(e.fecha).toLocaleDateString('es-ES') : '?';
    const catalogoCount = (e.detalles?.extras?.catalogoItemIds || []).length;
    console.log(`  ${e.publicId} | ${fecha} | ${e.cliente?.nombreNiño || '?'} | ${e.precioTotal}€ | catalog=${catalogoCount} items`);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
