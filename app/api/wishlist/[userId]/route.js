import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Wishlist from "@/models/Wishlist";
import { verifyWishlistUser } from "../_auth";

function normalizeProduct(product) {
  if (!product) return null;
  return {
    ...product,
    id: String(product._id),
    _id: String(product._id),
    specs: product.specs || {},
  };
}

// GET /api/wishlist/:userId
export async function GET(_req, { params }) {
  try {
    await params;
    await connectDB();

    const auth = await verifyWishlistUser(_req);
    if (!auth.ok) {
      return NextResponse.json(
        { success: false, message: auth.message },
        { status: auth.status }
      );
    }

    const userId = auth.userId;

    const entries = await Wishlist.find({ userId })
      .sort({ createdAt: -1 })
      .populate({ path: "productId" })
      .lean();

    const wishlist = entries.map((entry) => {
      const product = normalizeProduct(entry.productId);

      if (!product && process.env.NODE_ENV !== "production") {
        console.warn("[wishlist][GET] productId is null for entry:", String(entry?._id || ""));
      }

      return {
        _id: String(entry._id),
        userId: String(entry.userId),
        productId: product,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      };
    });

    return NextResponse.json({ success: true, wishlist });
  } catch (error) {
    console.error("Wishlist fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch wishlist" },
      { status: 500 }
    );
  }
}
