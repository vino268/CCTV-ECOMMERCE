/**
 * One-time script to hash all plain-text admin passwords in MongoDB.
 *
 * Run with:  node scripts/hash-admin-passwords.js
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGODB_URI = "mongodb://127.0.0.1:27017/tn_automation";

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  const Admin = mongoose.connection.collection("admins");
  const admins = await Admin.find({}).toArray();

  let updated = 0;

  for (const admin of admins) {
    const pw = admin.password;
    if (!pw) continue;

    // Skip already-hashed passwords
    if (pw.startsWith("$2a$") || pw.startsWith("$2b$")) {
      console.log(`${admin.email} — already hashed, skipping`);
      continue;
    }

    const hashed = await bcrypt.hash(pw, 10);
    await Admin.updateOne(
      { _id: admin._id },
      { $set: { password: hashed } }
    );
    console.log(`${admin.email} — password hashed successfully`);
    updated++;
  }

  console.log(`\nDone. ${updated} password(s) hashed.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
