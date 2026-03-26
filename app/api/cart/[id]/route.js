import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Cart from "@/models/Cart";

// DELETE /api/cart/[id] — remove a specific cart item by productId (requires userId)
export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const userId = String(searchParams.get("userId") || "").trim();

    if (!id) {
      return NextResponse.json(
        { error: "productId is required" },
        { status: 400 }
      );
    }

    let deleted = null;

    if (userId) {
      deleted = await Cart.findOneAndDelete({ userId, productId: id });
    }

    // Backward compatibility for callers that still send cart item _id.
    if (!deleted) {
      deleted = await Cart.findByIdAndDelete(id);
    }

    if (!deleted) {
      return NextResponse.json(
        { error: "Cart item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Item removed" });
  } catch (error) {
    console.error("Delete cart item error:", error);
    return NextResponse.json(
      { error: "Failed to delete cart item" },
      { status: 500 }
    );
  }
}
