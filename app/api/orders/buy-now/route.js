import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";
import BuyNowOrder from "@/models/BuyNowOrder";
import { verifyUser, authError } from "@/app/api/address/_helpers";

export async function POST(req) {
  try {
    await connectDB();

    const auth = await verifyUser(req);
    if (!auth.ok) return authError(auth);

    const body = await req.json();
    const productId = String(body?.productId || "").trim();
    const quantity = Math.max(1, Number(body?.quantity || 1));

    if (!productId) {
      return NextResponse.json({ message: "productId is required" }, { status: 400 });
    }

    const product = await Product.findById(productId).lean();
    if (!product || !product.inStock) {
      return NextResponse.json({ message: "Product is unavailable" }, { status: 400 });
    }

    await BuyNowOrder.deleteMany({
      userId: auth.userId,
      expiresAt: { $lt: new Date() },
    });

    const buyNowOrder = await BuyNowOrder.create({
      userId: auth.userId,
      productId,
      quantity,
      product: {
        name: product.name || "",
        image: product.image || "",
        price: Number(product.price || 0),
        inStock: Boolean(product.inStock),
      },
      expiresAt: new Date(Date.now() + 1000 * 60 * 30),
    });

    return NextResponse.json({
      success: true,
      orderId: String(buyNowOrder._id),
    });
  } catch (error) {
    console.error("Buy now create error:", error);
    return NextResponse.json({ message: "Failed to proceed" }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    await connectDB();

    const auth = await verifyUser(req);
    if (!auth.ok) return authError(auth);

    const { searchParams } = new URL(req.url);
    const orderId = String(searchParams.get("orderId") || "").trim();

    if (!orderId) {
      return NextResponse.json({ message: "orderId is required" }, { status: 400 });
    }

    const buyNowOrder = await BuyNowOrder.findOne({
      _id: orderId,
      userId: auth.userId,
      expiresAt: { $gt: new Date() },
    }).lean();

    if (!buyNowOrder) {
      return NextResponse.json({ message: "Buy now session not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      order: buyNowOrder,
    });
  } catch (error) {
    console.error("Buy now fetch error:", error);
    return NextResponse.json({ message: "Failed to load buy now order" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    await connectDB();

    const auth = await verifyUser(req);
    if (!auth.ok) return authError(auth);

    const { searchParams } = new URL(req.url);
    const orderId = String(searchParams.get("orderId") || "").trim();

    if (!orderId) {
      return NextResponse.json({ message: "orderId is required" }, { status: 400 });
    }

    await BuyNowOrder.deleteOne({ _id: orderId, userId: auth.userId });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Buy now delete error:", error);
    return NextResponse.json({ message: "Failed to clean up buy now order" }, { status: 500 });
  }
}
