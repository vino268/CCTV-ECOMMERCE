import mongoose from "mongoose";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI not found");
  process.exit(1);
}

async function cleanup() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    const collection = mongoose.connection.collection("sessions");
    
    // Delete sessions where token is null or missing
    const result = await collection.deleteMany({
      $or: [
        { token: null },
        { token: { $exists: false } }
      ]
    });

    console.log(`Deleted ${result.deletedCount} sessions with null/missing tokens.`);

    // Also drop the token unique index if it's causing issues, it will be recreated by Mongoose
    try {
        await collection.dropIndex("token_1");
        console.log("Dropped token_1 index to ensure fresh creation.");
    } catch (e) {
        console.log("Index token_1 not found or already dropped.");
    }

    process.exit(0);
  } catch (error) {
    console.error("Cleanup error:", error);
    process.exit(1);
  }
}

cleanup();
