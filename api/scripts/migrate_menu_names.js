const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Event = require('../models/event.model');
const Config = require('../models/config.model');

async function migrate() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!');

    const config = await Config.findOne();
    if (!config) {
      console.log('No config found. Exiting.');
      return;
    }

    const events = await Event.find({
      'detalles.niños.menuId': { $exists: true },
      'detalles.niños.menuNombre': { $exists: false }
    });

    console.log(`Found ${events.length} events to update.`);

    let updatedCount = 0;
    for (const event of events) {
      const menuIdStr = String(event.detalles.niños.menuId).toLowerCase();

      // 1. Direct match
      let menu = config.menusNiños.find(m => String(m.id || m._id).toLowerCase() === menuIdStr);

      // 2. Fuzzy match for legacy IDs based on suffixes / common values
      if (!menu) {
        if (menuIdStr === '1' || menuIdStr === 'normal' || menuIdStr.endsWith('3') || menuIdStr.endsWith('a') || menuIdStr.endsWith('0')) {
          menu = config.menusNiños[0];
        } else if (menuIdStr === '2' || menuIdStr.endsWith('4') || menuIdStr.endsWith('b') || menuIdStr.endsWith('1')) {
          menu = config.menusNiños[1];
        } else if (menuIdStr === '3' || menuIdStr.endsWith('5') || menuIdStr.endsWith('c') || menuIdStr.endsWith('2')) {
          menu = config.menusNiños[2];
        }
      }

      if (menu) {
        event.detalles.niños.menuNombre = menu.nombre;
        if (!event.detalles.niños.precioApplied) {
          event.detalles.niños.precioApplied = menu.precio;
        }

        await event.save();
        updatedCount++;
        console.log(`- Updated event ${event.publicId} (${event.detalles.niños.menuId}) -> ${menu.nombre}`);
      } else {
        console.log(`- Could not find or map menu with ID ${menuIdStr} for event ${event.publicId}`);
      }
    }

    console.log(`Migration finished. ${updatedCount} events updated.`);
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await mongoose.disconnect();
  }
}

migrate();
