import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Wishlist from "@/models/Wishlist";
import { verifyWishlistUser } from "./_auth";

function normalizeProduct(product) {
  if (!product) return null;
  return {
    ...product,
    id: String(product._id),
    _id: String(product._id),
    specs: product.specs || {},
  };
}

// GET /api/wishlist
export async function GET(request) {
  try {
    await connectDB();

    const auth = await verifyWishlistUser(request);
    if (!auth.ok) {
      return NextResponse.json(
        { success: false, message: auth.message },
        { status: auth.status }
      );
    }

    const entries = await Wishlist.find({ userId: auth.userId })
      .sort({ createdAt: -1 })
      .populate({ path: "productId" })
      .lean();

    const wishlist = entries
      .map((entry) => ({
        _id: String(entry._id),
        userId: String(entry.userId),
        productId: normalizeProduct(entry.productId),
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      }))
      .filter((entry) => Boolean(entry.productId));

    return NextResponse.json({ success: true, wishlist });
  } catch (error) {
    console.error("Wishlist fetch error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch wishlist" },
      { status: 500 }
    );
  }
}
