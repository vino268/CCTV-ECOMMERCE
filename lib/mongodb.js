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

let isConnected = false;

export async function connectDB() {
  if (isConnected) return;

  try {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: DB_NAME });
    isConnected = true;
    console.log("MongoDB connected once");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}