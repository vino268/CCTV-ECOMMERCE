import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Cart from "@/models/Cart";

function toCleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function toPositiveInteger(value, fallback = 1) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.floor(n));
}

function normalizeProductSnapshot(product) {
  if (!product || typeof product !== "object") return {};

  const normalized = {};

  const name = toCleanString(product.name);
  if (name) normalized.name = name;

  const priceNum = Number(product.price);
  if (Number.isFinite(priceNum)) normalized.price = priceNum;

  const image = toCleanString(product.image);
  if (image) normalized.image = image;

  const category = toCleanString(product.category);
  if (category) normalized.category = category;

  if (typeof product.inStock === "boolean") {
    normalized.inStock = product.inStock;
  }

  return normalized;
}

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

// POST /api/cart — add item if not exists (no duplicates)
export async function POST(req) {
  try {
    await connectDB();
    const payload = await req.json();
    const userId = toCleanString(payload?.userId);
    const productId = toCleanString(payload?.productId);
    const quantity = toPositiveInteger(payload?.quantity, 1);
    const product = normalizeProductSnapshot(payload?.product);

    if (!userId || !productId) {
      return NextResponse.json(
        { error: "userId and productId are required" },
        { status: 400 }
      );
    }

    // Prevent duplicates: if item exists, return it without creating a new row.
    const existing = await Cart.findOne({ userId, productId });

    if (existing) {
      if (Object.keys(product).length > 0) {
        existing.product = product;
        await existing.save();
      }
      return NextResponse.json(
        { success: true, message: "Already in cart", item: existing },
        { status: 200 }
      );
    }

    try {
      const item = await Cart.create({
        userId,
        productId,
        quantity,
        product,
      });

      return NextResponse.json(
        { success: true, message: "Added to cart", item },
        { status: 201 }
      );
    } catch (createError) {
      // Handle race condition where two requests try to insert same item.
      if (createError?.code === 11000) {
        const dup = await Cart.findOne({ userId, productId });
        return NextResponse.json(
          { success: true, message: "Already in cart", item: dup },
          { status: 200 }
        );
      }
      throw createError;
    }
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
