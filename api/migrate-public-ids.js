require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('./models/event.model');
require('./config/db.config'); // Start DB connection

const generatePublicId = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

const migrate = async () => {
  console.log('Waiting for DB connection...');
  await new Promise((resolve) => {
    if (mongoose.connection.readyState === 1) resolve();
    else mongoose.connection.once('open', resolve);
  });

  console.log('Starting migration of Public IDs...');
  try {
    const events = await Event.find({ publicId: { $exists: false } });
    console.log(`Found ${events.length} events without publicId.`);

    for (const event of events) {
      let isUnique = false;
      let newId;
      while (!isUnique) {
        newId = generatePublicId();
        const existing = await Event.findOne({ publicId: newId });
        if (!existing) isUnique = true;
      }
      event.publicId = newId;
      await event.save();
      console.log(`Updated event ${event._id} with publicId ${newId}`);
    }

    console.log('Migration complete!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

migrate();
