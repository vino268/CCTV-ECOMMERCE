import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";

export async function GET() {
  try {
    await connectDB();

    const products = await mongoose.connection
      .collection("products")
      .find({})
      .toArray();

    return Response.json({
      success: true,
      products,
    });
  } catch (error) {
    console.log("ERROR:", error);
    return Response.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}