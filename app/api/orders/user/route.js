import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import User from "@/models/User";

function normalizePaymentMethod(value) {
  const method = String(value || "COD").trim();
  const normalized = method.toLowerCase();
  if (/cod|cash[\s-\-]?on[\s-\-]?delivery/i.test(normalized)) return "COD";
  if (/online|razorpay|upi|card|netbanking/i.test(normalized)) return "Online";
  return method || "COD";
}

// GET /api/orders/user?email=xxx
export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("isBlocked");
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

    const orders = await Order.find({
      isDeleted: false,
      email: { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") },
    }).sort({ createdAt: -1 });

    return NextResponse.json(orders.map((order) => ({
      ...order.toObject(),
      paymentMethod: normalizePaymentMethod(order.paymentMethod),
    })));
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
