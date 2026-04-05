import mongoose from "mongoose";
const MONGODB_URI = process.env.MONGODB_URI;
// ❗ Do NOT throw error during build
if (!MONGODB_URI) {
  console.warn("⚠️ MONGODB_URI is not defined (will fail at runtime if not set)");
}
// Global cache for Next.js (prevents multiple connections)
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}
export const connectDB = async () => {
  try {
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
