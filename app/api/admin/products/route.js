import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";

// GET /api/admin/products — return all products with optional search
export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";

    let query = {};

    if (search) {
      // Escape special regex characters to prevent ReDoS / injection
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { name:     { $regex: escaped, $options: "i" } },
        { category: { $regex: escaped, $options: "i" } },
      ];
    }

    const products = await Product.find(query).sort({ createdAt: -1 });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { message: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
