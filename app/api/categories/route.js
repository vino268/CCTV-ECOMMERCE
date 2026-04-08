import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function GET() {
  try {
    await connectDB();

    const db = mongoose.connection.db;

    const categories = await db
      .collection("products")
      .aggregate([
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
          },
        },
      ])
      .toArray();

    return Response.json({
      success: true,
      categories,
    }, { headers: CORS_HEADERS });
  } catch (error) {
    console.error("CATEGORY ERROR:", error);
    return Response.json(
      { success: false, error: "Failed to fetch categories" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: CORS_HEADERS,
  });
}
