const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("No Mongo URI");
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db("Neverland");

    // List all configs
    const configs = await db.collection("configs").find({}).toArray();
    console.log(`Found ${configs.length} config documents.`);

    for (const config of configs) {
      console.log(`Config ID: ${config._id}`);
      if (config.workshops) {
        config.workshops.forEach(w => {
          console.log(`  - ${w.name}: ${w.imageUrl || "NO IMAGE"}`);
          console.log(`    (id: ${w.id})`);
        });
      } else {
        console.log("  No workshops array found.");
      }
    }

    // Force update on the one being served (assuming the one with lots of workshops is the right one, likely the first one)
    // But better to update ALL of them or just the one with correct ID.
    // The API served document has ID: 698b91f5d2dbcdf763d96cc9
    // Wait, "698b91f5d2dbcdf763d96cc9" is likely a typo in my reading or a generated ID. Mongoose IDs are 24 hex chars.
    // Let's print them and see.

  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}
run();
