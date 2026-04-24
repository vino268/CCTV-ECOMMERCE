const dotenv = require("dotenv");
const mongoose = require("mongoose");
const Settings = require("../models/Settings");

dotenv.config();

const TARGET_SETTINGS = {
  email: "tnautomation@yahoo.com",
  businessHours: {
    monday: "9:00 AM - 7:00 PM",
    tuesday: "9:00 AM - 7:00 PM",
    wednesday: "9:00 AM - 7:00 PM",
    thursday: "9:00 AM - 7:00 PM",
    friday: "9:00 AM - 7:00 PM",
    saturday: "9:00 AM - 5:00 PM",
    sunday: "Closed",
  },
};

async function run() {
  const mongoUri = String(process.env.MONGODB_URI || "").trim();
  if (!mongoUri) {
    throw new Error("MONGODB_URI is missing in .env");
  }

  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 15000 });

  const existing = await Settings.findOne().sort({ updatedAt: -1 });

  if (existing) {
    existing.email = TARGET_SETTINGS.email;
    existing.businessHours = TARGET_SETTINGS.businessHours;
    await existing.save();
  } else {
    await Settings.create(TARGET_SETTINGS);
  }

  const updated = await Settings.findOne().sort({ updatedAt: -1 }).lean();
  console.log("Settings upserted:");
  console.log(JSON.stringify(updated, null, 2));

  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error("Failed to upsert settings:", error.message);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
