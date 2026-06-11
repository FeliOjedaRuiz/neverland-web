/**
 * Backup de las 6 reservas afectadas antes de la migración.
 * Uso: node scripts/backup-affected.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Event = require('../models/event.model');
const fs = require('fs');
const path = require('path');

const AFFECTED_IDS = ['ZCJ33Z', 'SKUTB3', '9MOMOF', 'YOS8HI', '9Z97MA', 'KWK6MQ'];

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Conectado.');

  const events = await Event.find({ publicId: { $in: AFFECTED_IDS } }).lean();

  const backup = events.map((e) => ({
    publicId: e.publicId,
    fecha: e.fecha,
    turno: e.turno,
    estado: e.estado,
    cliente: { nombreNiño: e.cliente?.nombreNiño },
    precioTotal: e.precioTotal,
    precioTallerApplied: e.detalles?.extras?.precioTallerApplied,
    taller: e.detalles?.extras?.taller,
    niños: e.detalles?.niños?.cantidad,
    _id: e._id.toString(),
    _raw: e,
  }));

  const dir = path.join(__dirname, 'backups');
  fs.mkdirSync(dir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const file = path.join(dir, `reservas-backup-${ts}.json`);
  fs.writeFileSync(file, JSON.stringify(backup, null, 2));

  console.log(`✅ Backup guardado: ${file}`);
  console.log(`   ${backup.length} reservas respaldadas.`);
  for (const b of backup) {
    console.log(`   ${b.publicId} | ${b.precioTotal}€ | taller: ${b.taller} (${b.precioTallerApplied}€)`);
  }
  await mongoose.disconnect();
}

main().catch((err) => { console.error('❌', err); process.exit(1); });
