import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";

export async function GET() {
  try {
    console.log("🔥 API HIT");

    // Check ENV
    console.log("MONGO URI:", process.env.MONGODB_URI ? "FOUND" : "NOT FOUND");

    await connectDB();

    console.log("✅ DB CONNECTED");

    const products = await mongoose.connection
      .collection("products")
      .find({})
      .toArray();

    console.log("📦 PRODUCTS:", products.length);

    return Response.json({
      success: true,
      products,
    });

  } catch (error) {
    console.error("❌ FULL ERROR:", error);

    return Response.json({
      error: error.message,
    }, { status: 500 });
  }
}