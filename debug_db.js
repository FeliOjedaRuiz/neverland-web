const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, 'api', '.env') });

const configSchema = new mongoose.Schema({
  menusNiños: [mongoose.Schema.Types.Mixed],
});

const Config = mongoose.model('Config', configSchema);

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const config = await Config.findOne();
    console.log('CONFIG:', JSON.stringify(config, null, 2));

    // Also check one recent reservation to see how menuId is stored
    const reservationSchema = new mongoose.Schema({
      detalles: mongoose.Schema.Types.Mixed
    });
    const Event = mongoose.model('Event', reservationSchema);
    const lastRes = await Event.findOne({ 'detalles.niños.menuId': { $exists: true } }).sort({ createdAt: -1 });
    console.log('LAST RESERVATION MENU ID:', JSON.stringify(lastRes?.detalles?.niños?.menuId, null, 2));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
