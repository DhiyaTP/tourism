const mongoose = require("mongoose");
const Place = require("./models/place");

const trivandrumPlaces = require("./data/trivandrum");
const kollamPlaces = require("./data/kollam");
const alappuzhaPlaces = require("./data/alappuzha");
const pathanamthittaPlaces = require("./data/pathanamthitta");

// connect to MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/keralaTourismDB");

const allPlaces = [
  ...trivandrumPlaces,
  ...kollamPlaces,
  ...alappuzhaPlaces,
  ...pathanamthittaPlaces
];

async function syncPlaces() {

  for (const p of allPlaces) {

    // check if place already exists
    const exists = await Place.findOne({ name: p.name });

    if (!exists) {
      await Place.create({
        name: p.name,
        district: p.district || "Unknown",
        description: p.description,
        location: p.location,
        activities: p.activities,
        image: p.image
      });

      console.log("Added:", p.name);
    }
  }

  console.log("✅ Sync complete");
  process.exit();
}

syncPlaces();