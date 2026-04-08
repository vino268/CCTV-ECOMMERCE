import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";

export async function GET() {
  try {
    console.log("🔥 API HIT");

    await connectDB();
    console.log("✅ DB CONNECTED");

    const products = await mongoose.connection.db
      .collection("products")
      .find({})
      .toArray();

    console.log("📦 PRODUCTS:", products.length);

    return Response.json(
      { success: true, products },
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("❌ ERROR:", error);

    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}