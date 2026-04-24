import mongoose from "mongoose";

const DB_NAME = "tn_automation";

function normalizeMongoUri(rawUri) {
  const value = String(rawUri || "").trim().replace(/^['\"]|['\"]$/g, "");
  if (!value) return "";

  try {
    const parsed = new URL(value);
    const isAtlasHost = parsed.hostname.endsWith(".mongodb.net");
    const hasCredentials = Boolean(parsed.username);

    // Atlas users usually authenticate against admin. If URI includes a DB path
    // and authSource is omitted, Mongo may attempt auth against the wrong DB.
    if (isAtlasHost && hasCredentials && !parsed.searchParams.get("authSource")) {
      parsed.searchParams.set("authSource", "admin");
    }

    return parsed.toString();
  } catch {
    return value;
  }
}

const MONGODB_URI = normalizeMongoUri(process.env.MONGODB_URI);

if (!MONGODB_URI) {
  throw new Error("❌ MONGODB_URI not defined");
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
   const options = {
  dbName: DB_NAME,
  bufferCommands: false,
  serverSelectionTimeoutMS: 10000,

};

    cached.promise = mongoose.connect(MONGODB_URI, options).catch((error) => {
      cached.promise = null;
      throw error;
    });
  }

  try {
    cached.conn = await cached.promise;
    console.log(`MongoDB connected successfully (db: ${DB_NAME})`);
    return cached.conn;
  } catch (error) {
    cached.conn = null;
    console.error("MongoDB connection error:", error);

    if (error?.code === 8000 || String(error?.message || "").toLowerCase().includes("bad auth")) {
      throw new Error(
        `MongoDB authentication failed (code 8000). Verify MONGODB_URI username/password, ensure the Atlas DB user has access to database '${DB_NAME}', and allow your current IP in Atlas Network Access.`
      );
    }

    throw error;
  }
}