const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const configSchema = new mongoose.Schema({
  menusNiños: [mongoose.Schema.Types.Mixed],
});
const eventSchema = new mongoose.Schema({
  tipo: String,
  detalles: mongoose.Schema.Types.Mixed,
  publicId: String
});

const Config = mongoose.model('Config', configSchema);
const Event = mongoose.model('Event', eventSchema);

async function aggressiveMigrate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const config = await Config.findOne();
    if (!config) throw new Error('No config found');

    const menus = config.menusNiños;
    // Map of common keywords/prices to current IDs
    // index 0 -> Menú 1, index 1 -> Menú 2, index 2 -> Menú 3
    const menu1Id = menus[0]?.id || menus[0]?._id;
    const menu2Id = menus[1]?.id || menus[1]?._id;
    const menu3Id = menus[2]?.id || menus[2]?._id;

    console.log('Target IDs:', { menu1Id, menu2Id, menu3Id });

    const reservations = await Event.find({ tipo: 'reserva' });
    let updatedCount = 0;

    for (const res of reservations) {
      const currentId = String(res.detalles?.niños?.menuId);
      let newId = null;

      // Match "1" or "2" or "3"
      if (currentId === '1') newId = menu1Id;
      else if (currentId === '2') newId = menu2Id;
      else if (currentId === '3') newId = menu3Id;

      // If we found a mapping and it's different from current
      if (newId && String(newId) !== currentId) {
        console.log(`Migrating [${res.publicId}]: ${currentId} -> ${newId}`);
        await Event.updateOne(
          { _id: res._id },
          { $set: { 'detalles.niños.menuId': newId } }
        );
        updatedCount++;
      }
    }

    console.log(`Total aggressive migrations: ${updatedCount}`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

aggressiveMigrate();
