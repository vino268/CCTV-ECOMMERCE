import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";
import { adminAuthError, verifyAdmin } from "@/app/api/admin/_helpers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req) {
  try {
    const auth = await verifyAdmin(req);
    if (!auth.ok) return adminAuthError(auth);

    await connectDB();
    const products = await Product.find({ isDeleted: true })
      .sort({ deletedAt: -1, updatedAt: -1 })
      .select("name sku price image deletedAt createdAt");

    return NextResponse.json(products);
  } catch (error) {
    console.error("GET /api/admin/products/deleted error:", error);
    return NextResponse.json({ error: "Failed to fetch deleted products" }, { status: 500 });
  }
}
