/**
 * Backup script: exporta events + config antes de la migración multi-personajes.
 * Guarda en api/scripts/backups/backup-YYYY-MM-DD-HHmmss.json
 */
require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const Event = require('../models/event.model');
const Config = require('../models/config.model');

async function backup() {
  const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
  const backupFile = path.join(__dirname, 'backups', `backup-${timestamp}.json`);

  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/neverland');
    console.log('✓ Conectado a MongoDB\n');

    const [eventos, config] = await Promise.all([
      Event.find({}).lean(),
      Config.findOne().lean()
    ]);

    const backup = {
      timestamp: new Date().toISOString(),
      counts: {
        eventos: eventos.length,
        config: config ? 1 : 0
      },
      config,
      eventos
    };

    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    console.log(`✓ Backup guardado: ${backupFile}`);
    console.log(`  ${backup.counts.eventos} eventos`);
    console.log(`  ${backup.counts.config ? '1' : '0'} config`);

  } catch (err) {
    console.error('✗ Error en backup:', err);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('✓ Conexión cerrada.');
  }
}

backup();
