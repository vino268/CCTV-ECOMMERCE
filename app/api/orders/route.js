import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import Notification from "@/models/Notification";
import User from "@/models/User";

// GET /api/orders — return all orders
export async function GET() {
  try {
    await connectDB();
    const orders = await Order.find({ isDeleted: false }).sort({ createdAt: -1 });
    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

// POST /api/orders — create new order
export async function POST(req) {
  try {
    await connectDB();
    const data = await req.json();

    const safeItems = Array.isArray(data?.items) ? data.items : [];
    const safeProducts = Array.isArray(data?.products) ? data.products : [];

    const normalizedProducts = safeProducts.length
      ? safeProducts
      : safeItems.map((item) => ({
          productId: item.productId || "",
          productName: item.productName || item.name || "",
          productImage: item.productImage || item.image || "",
          productPrice: Number(item.productPrice ?? item.price ?? 0),
          quantity: Number(item.quantity ?? 1),
        }));

    const normalizedAddress = data?.address || {};

    const normalizedOrderData = {
      ...data,
      userId: data?.userId || "",
      products: normalizedProducts,
      totalAmount: Number(data?.totalAmount ?? 0),
      paymentMethod: data?.paymentMethod || "COD",
      deliveryInfo: data?.deliveryInfo || {
        firstName: normalizedAddress.fullName || data?.customerName || "",
        lastName: normalizedAddress.lastName || "",
        email: normalizedAddress.email || data?.email || "",
        phone: normalizedAddress.phone || data?.phone || "",
        street: normalizedAddress.street || normalizedAddress.address || "",
        city: normalizedAddress.city || "",
        state: normalizedAddress.state || "",
        zip: normalizedAddress.pincode || normalizedAddress.zip || "",
      },
    };

    if (normalizedOrderData?.email) {
      const user = await User.findOne({ email: String(normalizedOrderData.email).toLowerCase() }).select("isBlocked");
      if (user?.isBlocked) {
        return NextResponse.json(
          {
            success: false,
            message: "User blocked",
            error: "Your account has been blocked. Please contact support.",
          },
          { status: 403 }
        );
      }
    }

    const order = await Order.create(normalizedOrderData);

    // Create admin notification for the new order
    await Notification.create({
      type: "order",
      message: `New order placed by ${order.customerName}`,
      orderId: order.orderNumber,
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
