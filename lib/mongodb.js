import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please add MONGODB_URI in environment");
}

function hasDatabaseNameInUri(uri) {
  try {
    const parsed = new URL(uri);
    return parsed.pathname && parsed.pathname !== "/";
  } catch {
    return /mongodb(\+srv)?:\/\/[^/]+\/[^?]+/.test(uri);
  }
}

if (!hasDatabaseNameInUri(MONGODB_URI)) {
  throw new Error(
    "MONGODB_URI must include a database name, e.g. mongodb+srv://<user>:<pass>@<cluster>/tn_automation"
  );
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  try {
    if (cached.conn) return cached.conn;

    if (!cached.promise) {
      cached.promise = mongoose.connect(MONGODB_URI);
    }

    cached.conn = await cached.promise;
    console.log("MongoDB connected");

    return cached.conn;
  } catch (error) {
    console.error("MongoDB error", error);
    throw error;
  }
}