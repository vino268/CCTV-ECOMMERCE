import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import Notification from "@/models/Notification";
import Settings from "@/models/Settings";

const DEFAULT_PAYMENT_SETTINGS = {
  cashOnDelivery: true,
  upi: true,
  onlinePayment: true,
};

function normalizePaymentMethod(value = "") {
  const normalized = String(value).trim().toLowerCase();

  if (normalized === "cod" || normalized === "cash on delivery") return "cod";
  if (normalized === "upi") return "upi";
  if (normalized === "online" || normalized === "online payment") return "online";

  return "";
}

// GET /api/orders — return all orders
export async function GET() {
  try {
    await connectDB();
    const orders = await Order.find().sort({ createdAt: -1 });
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

    const paymentSettings =
      (await Settings.findOne({}, { cashOnDelivery: 1, upi: 1, onlinePayment: 1 })) ||
      DEFAULT_PAYMENT_SETTINGS;

    const requestedPaymentMethod = normalizePaymentMethod(data?.paymentMethod);

    if (!requestedPaymentMethod) {
      return NextResponse.json(
        { error: "Invalid payment method" },
        { status: 400 }
      );
    }

    if (requestedPaymentMethod === "cod" && !paymentSettings.cashOnDelivery) {
      return NextResponse.json(
        { error: "Cash on Delivery is disabled" },
        { status: 400 }
      );
    }

    if (requestedPaymentMethod === "upi" && !paymentSettings.upi) {
      return NextResponse.json(
        { error: "UPI payment is disabled" },
        { status: 400 }
      );
    }

    if (requestedPaymentMethod === "online" && !paymentSettings.onlinePayment) {
      return NextResponse.json(
        { error: "Online payment is disabled" },
        { status: 400 }
      );
    }

    const canonicalPaymentMethod =
      requestedPaymentMethod === "cod"
        ? "COD"
        : requestedPaymentMethod === "upi"
          ? "UPI"
          : "Online";

    if (data?.deliveryAvailable === false) {
      return NextResponse.json(
        { error: "Delivery not available for this location" },
        { status: 400 }
      );
    }

    const payload = {
      ...data,
      distance: Number(data?.distance || 0),
      deliveryCharge: Number(data?.deliveryCharge || 0),
      paymentMethod: canonicalPaymentMethod,
    };

    delete payload.deliveryAvailable;

    const order = await Order.create(payload);

    // Create admin notification
    try {
      await Notification.create({
        type: "new_order",
        message: `New order placed by ${order.customerName} — #${order.orderNumber}`,
        orderId: String(order._id),
      });
    } catch (_) {
      // Notification failure must not break order creation
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
