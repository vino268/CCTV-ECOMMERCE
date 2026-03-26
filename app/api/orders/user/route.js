import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import User from "@/models/User";

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

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
