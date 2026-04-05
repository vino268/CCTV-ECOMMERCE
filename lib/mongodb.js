import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("❌ Please define MONGODB_URI in environment variables");
}

// Global cache (important for Next.js hot reload & serverless)
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export const connectDB = async () => {
  try {
    // If already connected → reuse
    if (cached.conn) {
      console.log("⚡ Using existing MongoDB connection");
      return cached.conn;
    }

    // If no connection, create one
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
    throw error; // VERY IMPORTANT (prevents silent failure)
  }
};