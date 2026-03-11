import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import Notification from "@/models/Notification";

// PUT /api/orders/[id]/cancel
// Soft-cancels an order by setting orderStatus to "Cancelled".
// Allowed only when status is Pending or Shipped.
export async function PUT(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const status = order.orderStatus?.toLowerCase();

    if (status === "cancelled") {
      return NextResponse.json(
        { error: "Order is already cancelled" },
        { status: 400 }
      );
    }

    if (status === "confirmed" || status === "delivered") {
      return NextResponse.json(
        { error: "Order cannot be cancelled once it is Confirmed or Delivered" },
        { status: 400 }
      );
    }

    order.orderStatus = "Cancelled";
    await order.save();

    // Create admin notification
    try {
      await Notification.create({
        type: "order_cancelled",
        message: `Order #${order.orderNumber} cancelled by ${order.customerName}`,
        orderId: String(order._id),
      });
    } catch (_) {
      // Notification failure must not break cancellation
    }

    return NextResponse.json({ success: true, message: "Order cancelled" });
  } catch (error) {
    console.error("Error cancelling order:", error);
    return NextResponse.json(
      { error: "Failed to cancel order" },
      { status: 500 }
    );
  }
}
