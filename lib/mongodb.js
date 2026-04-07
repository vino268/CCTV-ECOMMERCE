import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please add MONGODB_URI in environment");
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  try {
    if (cached.conn) return cached.conn;

    if (!cached.promise) {
      cached.promise = mongoose.connect(MONGODB_URI, {
        dbName: "tn_automation",
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    }

    cached.conn = await cached.promise;
    console.log("✅ MongoDB Connected");

    return cached.conn;
  } catch (error) {
    console.error("❌ MongoDB ERROR:", error);
    throw error;
  }
}