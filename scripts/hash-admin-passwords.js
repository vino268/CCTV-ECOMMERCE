/**
 * One-time script to hash admin password in MongoDB.
 *
 * Run with: node scripts/hash-admin-passwords.js
 */

const dotenv = require("dotenv");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

dotenv.config();

const MONGODB_URI = String(process.env.MONGODB_URI || "").trim();
const ADMIN_EMAIL = "admin@tnautomation.com";
const ADMIN_PLAIN_PASSWORD = "877850";

async function main() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is missing in environment variables");
  }

  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  console.log("Connected to MongoDB");

  const adminCollection = mongoose.connection.collection("admins");
  const hash = await bcrypt.hash(ADMIN_PLAIN_PASSWORD, 10);

  const result = await adminCollection.updateOne(
    { email: ADMIN_EMAIL },
    { $set: { password: hash, role: "admin" } },
    { upsert: false }
  );

  if (result.matchedCount === 0) {
    console.log(`No admin found with email ${ADMIN_EMAIL}`);
  } else {
    console.log("Admin password hashed and updated successfully");
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
