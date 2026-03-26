import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Wishlist from "@/models/Wishlist";

// POST /api/wishlist/toggle
export async function POST(req) {
  try {
    const { userId, productId } = await req.json();

    if (!userId || !productId) {
      return NextResponse.json(
        { success: false, error: "userId and productId are required" },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json(
        { success: false, error: "Invalid userId or productId" },
        { status: 400 }
      );
    }

    await connectDB();

    const existing = await Wishlist.findOne({ userId, productId });

    if (existing) {
      await Wishlist.deleteOne({ _id: existing._id });
      return NextResponse.json({ success: true, added: false, removed: true });
    }

    try {
      await Wishlist.create({ userId, productId });
    } catch (error) {
      if (error?.code !== 11000) {
        throw error;
      }
    }

    return NextResponse.json({ success: true, added: true, removed: false });
  } catch (error) {
    console.error("Wishlist toggle error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to toggle wishlist" },
      { status: 500 }
    );
  }
}
