/**
 * Restauración one-time — Vuelve a setear el campo legacy
 * `preciosExtras.pinata` en el documento Config de MongoDB.
 *
 * Contexto: el script cleanup-legacy-pinata-config.js eliminó este campo.
 * Antes del deploy de la feature de catálogo, lo restauramos para que la
 * BD quede igual que antes (defensa por si producción aún corre código
 * viejo que lee este campo).
 *
 * Uso:
 *   node scripts/restore-legacy-pinata-config.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Config = require('../models/config.model');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI no definida en api/.env');
  process.exit(1);
}

const PINATA_LEGACY_VALUE = 20; // € — valor histórico que mostraba el admin UI

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Conectado a MongoDB\n');

  const configs = await Config.find();
  console.log(`📋 Documentos Config encontrados: ${configs.length}\n`);

  let restored = 0;
  for (const config of configs) {
    const current = config.preciosExtras?.pinata;
    console.log(`  Config id=${config._id} | preciosExtras.pinata = ${current}€`);
    if (current === undefined || current === null) {
      config.preciosExtras = { ...config.preciosExtras, pinata: PINATA_LEGACY_VALUE };
      await config.save();
      console.log(`    → Restaurado a ${PINATA_LEGACY_VALUE}€`);
      restored++;
    } else {
      console.log(`    → Ya tenía valor, sin cambios`);
    }
  }

  console.log(`\n✅ Restauración completa: ${restored} documento(s) restaurado(s)`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
