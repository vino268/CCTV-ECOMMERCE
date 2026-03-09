import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Cart from "@/models/Cart";

// DELETE /api/cart/[id] — remove a specific cart item by its _id
export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const { id } = params;

    const deleted = await Cart.findByIdAndDelete(id);
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
