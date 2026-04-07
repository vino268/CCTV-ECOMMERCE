import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined");
}

if (!/\/tn_automation(?:\?|$)/.test(MONGODB_URI)) {
  throw new Error(
    "Invalid MONGODB_URI. Use format mongodb+srv://username:password@cluster.mongodb.net/tn_automation"
  );
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export const connectDB = async () => {
  try {
    if (cached.conn) {
      return cached.conn;
    }

    if (!cached.promise) {
      cached.promise = mongoose.connect(MONGODB_URI);
    }

    cached.conn = await cached.promise;
    console.log("MongoDB connected");
    return cached.conn;
  } catch (error) {
    console.error("MongoDB Error:", error);
    throw error;
  }
};