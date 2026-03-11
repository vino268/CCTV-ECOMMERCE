import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";

const LOCKED_STATUSES = ["cancelled", "delivered"];

// PUT /api/admin/orders/[id] — update order status (admin only)
// Rejects if the order is already Cancelled or Delivered.
export async function PUT(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (LOCKED_STATUSES.includes(order.orderStatus?.toLowerCase())) {
      return NextResponse.json(
        { error: "This order status is locked and cannot be changed" },
        { status: 400 }
      );
    }

    if (!body.orderStatus) {
      return NextResponse.json(
        { error: "orderStatus is required" },
        { status: 400 }
      );
    }

    order.orderStatus = body.orderStatus;
    await order.save();

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error("Error updating order status:", error);
    return NextResponse.json(
      { error: "Failed to update order status" },
      { status: 500 }
    );
  }
}
