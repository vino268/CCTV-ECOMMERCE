import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

// Global cache fix (no TS / JS error)
let cached = global._mongoose;

if (!cached) {
  cached = global._mongoose = { conn: null, promise: null };
}

export const connectDB = async () => {
  try {
    if (!MONGODB_URI) {
      console.error("❌ MONGODB_URI is not defined");
      return;
    }

    // Already connected
    if (cached.conn) {
      console.log("⚡ Using existing MongoDB connection");
      return cached.conn;
    }

    // Create new connection
    if (!cached.promise) {
      cached.promise = mongoose.connect(MONGODB_URI, {
        bufferCommands: false,
      });
    }

    cached.conn = await cached.promise;

    console.log("✅ MongoDB Connected Successfully");

    return cached.conn;
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
    throw error;
  }
};