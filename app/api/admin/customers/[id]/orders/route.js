import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Order from "@/models/Order";

export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    const user = await User.findOne({ _id: id, role: "user" }).select("email");
    if (!user) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const orders = await Order.find({
      isDeleted: false,
      $or: [{ userId: String(user._id) }, { email: user.email }],
    }).sort({ createdAt: -1 });

    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch customer orders" },
      { status: 500 }
    );
  }
}
