import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import Notification from "@/models/Notification";

// PATCH /api/orders/cancel — user cancels their own order
export async function PATCH(req) {
  try {
    await connectDB();
    const { orderId, reason, comment } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: "Order ID is required" },
        { status: 400 }
      );
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    const cancellableStatuses = ["Ordered", "Confirmed"];
    if (!cancellableStatuses.includes(order.orderStatus)) {
      // If shipped or beyond, user must request cancellation via support
      if (["Shipped", "OutForDelivery", "Delivered"].includes(order.orderStatus)) {
        return NextResponse.json(
          { success: false, message: "Order already shipped. Contact support for cancellation." },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { success: false, message: "Order cannot be cancelled in its current status" },
        { status: 400 }
      );
    }

    order.orderStatus = "Cancelled";
    order.trackingStatus = "Cancelled";
    order.cancelledAt = new Date();
    order.cancelReason = reason || '';
    order.cancelComment = comment || '';
    await order.save();

    await Notification.create({
      type: "cancel",
      message: `Order ${order.orderNumber || order._id} was cancelled by customer`,
      orderId: order.orderNumber || "",
    });

    return NextResponse.json({
      success: true,
      message: "Order cancelled successfully",
      order,
    });
  } catch (error) {
    console.error("Cancel order error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to cancel order" },
      { status: 500 }
    );
  }
}
