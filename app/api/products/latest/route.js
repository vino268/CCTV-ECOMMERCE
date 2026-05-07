import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

// GET /api/products/latest — return newest 6 products
export async function GET() {
  try {
    await connectDB();
    const products = await Product.find({ isDeleted: { $ne: true } })
      .sort({ createdAt: -1, _id: -1 })
      .limit(6)
      .lean();

    return NextResponse.json(
      {
        success: true,
        data: products,
        products,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Latest products API error:", error);
    return NextResponse.json(
      { success: false, data: [], products: [], error: "Failed to fetch latest products" },
      { status: 500 }
    );
  }
}