import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("❌ Please define MONGODB_URI in environment variables");
}

// Global cache (for Next.js hot reload & serverless)
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = {
    conn: null,
    promise: null,
  };
}

export async function connectDB() {
  // If already connected, reuse it
  if (cached.conn) {
    console.log("⚡ Using existing DB connection");
    return cached.conn;
  }

  // If no connection promise, create one
  if (!cached.promise) {
    console.log("🔌 Connecting to MongoDB...");

    cached.promise = mongoose.connect(MONGODB_URI, {
      dbName: "tn_automation", // ✅ your database name
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;
    console.log("✅ MongoDB Connected Successfully");

    return cached.conn;
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
    cached.promise = null;
    throw error;
  }
}