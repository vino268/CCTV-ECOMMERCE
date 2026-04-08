import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";

export async function GET() {
  try {
    await connectDB();

    const db = mongoose.connection.db; // ✅ FIXED

    const products = await db
      .collection("products")
      .find({})
      .toArray();

    console.log("✅ PRODUCTS COUNT:", products.length);

    return Response.json({
      success: true,
      products,
    });

  } catch (error) {
    console.error("❌ FULL ERROR:", error);

    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}