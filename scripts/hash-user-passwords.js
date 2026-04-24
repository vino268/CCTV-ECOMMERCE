/**
 * One-time script to hash plain-text user passwords in MongoDB.
 *
 * Run with: node scripts/hash-user-passwords.js
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

dotenv.config();

const MONGODB_URI = String(process.env.MONGODB_URI || "").trim();

function isBcryptHash(value) {
  return /^\$2[aby]\$\d{2}\$/.test(String(value || ""));
}

async function main() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is missing in .env");
  }

  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  console.log("Connected to MongoDB");

  const usersCollection = mongoose.connection.collection("users");
  const users = await usersCollection
    .find({ password: { $exists: true, $type: "string", $ne: "" } })
    .toArray();

  let updated = 0;

  for (const user of users) {
    if (isBcryptHash(user.password)) {
      continue;
    }

    const hashed = await bcrypt.hash(String(user.password), 10);
    await usersCollection.updateOne({ _id: user._id }, { $set: { password: hashed } });
    updated += 1;
  }

  console.log(`Done. ${updated} user password(s) hashed.`);
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
