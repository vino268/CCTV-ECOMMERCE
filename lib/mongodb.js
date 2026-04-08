import mongoose from "mongoose";

const DEFAULT_DB_NAME = "tn_automation";

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("Please add MONGODB_URI in environment");
    }

    if (cached.conn) return cached.conn;

    if (!cached.promise) {
      cached.promise = mongoose.connect(process.env.MONGODB_URI, {
        dbName: DEFAULT_DB_NAME,
      });
    }

    cached.conn = await cached.promise;
    console.log("MongoDB connected");

    return cached.conn;
  } catch (error) {
    cached.promise = null;
    cached.conn = null;
    console.error("MongoDB error", error);
    throw error;
  }
}