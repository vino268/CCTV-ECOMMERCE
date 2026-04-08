import mongoose from "mongoose";

function hasDatabaseNameInUri(uri) {
  try {
    const parsed = new URL(uri);
    return parsed.pathname && parsed.pathname !== "/";
  } catch {
    return /mongodb(\+srv)?:\/\/[^/]+\/[^?]+/.test(uri);
  }
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("Please add MONGODB_URI in environment");
    }

    if (!hasDatabaseNameInUri(mongoUri)) {
      throw new Error(
        "MONGODB_URI must include a database name, e.g. mongodb+srv://<user>:<pass>@<cluster>/tn_automation"
      );
    }

    if (cached.conn) return cached.conn;

    if (!cached.promise) {
      cached.promise = mongoose.connect(mongoUri);
    }

    cached.conn = await cached.promise;
    console.log("MongoDB connected");

    return cached.conn;
  } catch (error) {
    console.error("MongoDB error", error);
    throw error;
  }
}