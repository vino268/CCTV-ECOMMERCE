import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";

const ALLOWED_ORIGINS = ["http://localhost:3000", "https://tnautomation.in"];

function getCorsHeaders(request) {
  const origin = request?.headers?.get("origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[1];

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
    "Content-Type": "application/json",
  };
}

export async function GET(req) {
  try {
    await connectDB();

    const db = mongoose.connection.useDb("tn_automation");
    const products = await db
      .collection("products")
      .find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    return new Response(
      JSON.stringify({
        success: true,
        products,
      }),
      {
        status: 200,
        headers: getCorsHeaders(req),
      }
    );
  } catch (error) {
    console.error("Recent products API error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to fetch recent products",
      }),
      {
        status: 500,
        headers: getCorsHeaders(req),
      }
    );
  }
}

export async function OPTIONS(req) {
  return new Response(null, {
    status: 200,
    headers: getCorsHeaders(req),
  });
}