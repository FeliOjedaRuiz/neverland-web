/**
 * Migración one-time — Limpia el campo legacy `preciosExtras.pinata`
 * de los documentos Config existentes en MongoDB.
 *
 * Contexto: la Piñata pasó a vivir en `extrasCatalogo[]` (slug 'pinata').
 * El campo legacy `preciosExtras.pinata` quedó en configs viejos de la BD
 * pero ya no se usa — el precio de las reservas legacy vive en su
 * snapshot `precioPinataApplied`. Solo queda como ruido en el admin UI.
 *
 * Uso:
 *   node scripts/cleanup-legacy-pinata-config.js       (ejecuta)
 *   node scripts/cleanup-legacy-pinata-config.js --dry-run  (preview)
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Config = require('../models/config.model');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI no definida en api/.env');
  process.exit(1);
}

const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Conectado a MongoDB\n');

  const configs = await Config.find({ 'preciosExtras.pinata': { $exists: true } });
  console.log(`📋 Documentos Config con 'preciosExtras.pinata' legacy: ${configs.length}\n`);

  if (configs.length === 0) {
    console.log('✨ Nada que limpiar. La BD ya está al día.');
    await mongoose.disconnect();
    return;
  }

  for (const config of configs) {
    const oldValue = config.preciosExtras.pinata;
    console.log(`  Config id=${config._id} | preciosExtras.pinata legacy = ${oldValue}€`);
    if (!DRY_RUN) {
      config.preciosExtras.pinata = undefined;
      await config.save();
      console.log(`    → Eliminado`);
    }
  }

  console.log(`\n${DRY_RUN ? '🔍 DRY RUN' : '✅ Limpieza completa'}: ${configs.length} documento(s) procesado(s)`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
