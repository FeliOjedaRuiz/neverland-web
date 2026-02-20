const { MongoClient } = require("mongodb");
require("dotenv").config();

async function run() {
  const uri = process.env.MONGODB_URI; // includes "neverland-app"
  const client = new MongoClient(uri);

  try {
    await client.connect();
    // Use the default database from the connection string
    const db = client.db();
    console.log(`Connected to database: ${db.databaseName}`);

    const configCollection = db.collection("configs");
    const config = await configCollection.findOne();

    if (!config) {
      console.log("No config found in this database!");
      return;
    }

    console.log(`Found config with ID: ${config._id}`);

    let workshops = config.workshops || [];

    // Update images
    workshops = workshops.map(w => {
      if (w.id === "pintacaras" || w.name === "Pintacaras") w.imageUrl = "/workshops/face_painting.png";
      if (w.id === "slime" || w.name === "Taller de Slime") w.imageUrl = "/workshops/slime.png";
      if (w.id === "magia" || w.name === "Show de Magia") w.imageUrl = "/workshops/magic.png";
      if (w.id === "princesas" || w.name === "Taller de Princesas") w.imageUrl = "/workshops/princess.jpg";
      // Check for ObjectIds too just in case (as seen in the curl output)
      if (w.name === "Pintacaras" && !w.imageUrl) w.imageUrl = "/workshops/face_painting.png";
      // etc
      return w;
    });

    // Add Princess workshop if missing
    const hasPrincess = workshops.some(w => w.id === "princesas" || w.name === "Taller de Princesas");
    if (!hasPrincess) {
      workshops.push({
        id: "princesas",
        name: "Taller de Princesas",
        priceBase: 25,
        pricePlus: 30,
        desc: "¡Vive un cuento de hadas! Disfraces, coronas y maquillaje mágico.",
        imageUrl: "/workshops/princess.jpg"
      });
      console.log("Added new Princess workshop");
    } else {
      // ensure image is set for princess workshop even if it exists
      workshops = workshops.map(w => {
        if (w.id === "princesas" || w.name === "Taller de Princesas") {
          w.imageUrl = "/workshops/princess.jpg";
        }
        return w;
      });
    }

    await configCollection.updateOne({ _id: config._id }, { $set: { workshops: workshops } });
    console.log("Updated config in the CORRECT database.");

  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}
run();
