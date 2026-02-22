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

async function inspect() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const config = await Config.findOne();
    console.log('--- CONFIG MENUS ---');
    config.menusNiños.forEach(m => {
      console.log(`- ${m.nombre} (id: ${m.id}, _id: ${m._id})`);
    });

    const reservations = await Event.find({ tipo: 'reserva' });
    console.log('\n--- ALL RESERVATIONS ---');
    reservations.forEach(r => {
      const id = r.detalles?.niños?.menuId;
      const exists = config.menusNiños.some(m => String(m.id) === String(id) || String(m._id) === String(id));
      console.log(`- [${r.publicId}] menuId: ${id} | MATCHES CONFIG: ${exists}`);
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

inspect();
