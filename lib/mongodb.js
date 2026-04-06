import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined");
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export const connectDB = async () => {
  try {
    if (cached.conn) return cached.conn;

    if (!cached.promise) {
      cached.promise = mongoose.connect(MONGODB_URI, {
        dbName: "tn_automation",
      });
    }

    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    console.error("MongoDB Error:", error);
    throw error;
  }
};