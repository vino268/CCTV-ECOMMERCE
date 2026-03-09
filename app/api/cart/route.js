import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Cart from "@/models/Cart";

// GET /api/cart?userId=xxx — get all cart items for a user
export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const items = await Cart.find({ userId }).sort({ addedAt: -1 });
    return NextResponse.json(items);
  } catch (error) {
    console.error("Get cart error:", error);
    return NextResponse.json(
      { error: "Failed to fetch cart" },
      { status: 500 }
    );
  }
}

// POST /api/cart — add or update a cart item
export async function POST(req) {
  try {
    await connectDB();
    const { userId, productId, quantity, product } = await req.json();

    if (!userId || !productId) {
      return NextResponse.json(
        { error: "userId and productId are required" },
        { status: 400 }
      );
    }

    // Upsert: if item exists, increment quantity; otherwise create
    const existing = await Cart.findOne({ userId, productId });

    if (existing) {
      existing.quantity = (existing.quantity || 0) + (quantity || 1);
      if (product) {
        existing.product = product;
      }
      await existing.save();
      return NextResponse.json(existing);
    }

    const item = await Cart.create({
      userId,
      productId,
      quantity: quantity || 1,
      product: product || {},
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Add to cart error:", error);
    return NextResponse.json(
      { error: "Failed to add to cart" },
      { status: 500 }
    );
  }
}

// DELETE /api/cart?userId=xxx — clear entire cart for a user
export async function DELETE(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    await Cart.deleteMany({ userId });
    return NextResponse.json({ success: true, message: "Cart cleared" });
  } catch (error) {
    console.error("Clear cart error:", error);
    return NextResponse.json(
      { error: "Failed to clear cart" },
      { status: 500 }
    );
  }
}

// PUT /api/cart — update quantity of a specific item
export async function PUT(req) {
  try {
    await connectDB();
    const { userId, productId, quantity } = await req.json();

    if (!userId || !productId) {
      return NextResponse.json(
        { error: "userId and productId are required" },
        { status: 400 }
      );
    }

    if (quantity <= 0) {
      await Cart.findOneAndDelete({ userId, productId });
      return NextResponse.json({ success: true, message: "Item removed" });
    }

    const item = await Cart.findOneAndUpdate(
      { userId, productId },
      { $set: { quantity } },
      { new: true }
    );

    if (!item) {
      return NextResponse.json(
        { error: "Cart item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error("Update cart error:", error);
    return NextResponse.json(
      { error: "Failed to update cart" },
      { status: 500 }
    );
  }
}
