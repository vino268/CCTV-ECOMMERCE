import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";

// GET /api/products/latest — return newest 6 products
export async function GET() {
  try {
    await connectDB();
    const products = await Product.find().sort({ createdAt: -1 }).limit(6);
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch latest products" },
      { status: 500 }
    );
  }
}