export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";
import { adminAuthError, verifyAdmin } from "@/app/api/admin/_helpers";

export async function GET(req) {
  try {
    const auth = await verifyAdmin(req);
    if (!auth.ok) return adminAuthError(auth);

    await connectDB();

    const { searchParams } = new URL(req.url);
    const pageParam = Number.parseInt(searchParams.get("page") || "1", 10);
    const limitParam = Number.parseInt(searchParams.get("limit") || "10", 10);
    const search = (searchParams.get("search") || "").trim();
    const category = (searchParams.get("category") || "").trim();
    const exclude = (searchParams.get("exclude") || "").trim();
    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 50) : 12;
    const skip = (page - 1) * limit;

    const query = { isDeleted: { $ne: true } };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (category && category !== "All Categories") {
      query.category = { $regex: `^${category}$`, $options: "i" };
    }

    if (exclude) {
      query._id = { $ne: exclude };
    }

    const total = await Product.countDocuments(query);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("name sku slug price description image images features category inStock createdAt updatedAt")
      .lean();

    return NextResponse.json(
      {
        success: true,
        products,
        page,
        totalPages,
        total,
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/admin/products error:", error);
    return NextResponse.json(
      {
        success: false,
        products: [],
        total: 0,
        page: 1,
        totalPages: 1,
        error: error instanceof Error ? error.message : "Products are temporarily unavailable",
      },
      { status: 500 }
    );
  }
}