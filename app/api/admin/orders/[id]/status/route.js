import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import AdminLog from "@/models/AdminLog";
import Notification from "@/models/Notification";

const ALLOWED_TRANSITIONS = {
  Pending: ["Ordered", "Cancelled"],
  Ordered: ["Packed", "Cancelled"],
  Packed: ["Shipped", "Cancelled"],
  Shipped: ["Out for Delivery"],
  "Out for Delivery": ["Delivered"],
  Delivered: [],
  Cancelled: [],
};

// PATCH /api/admin/orders/[id]/status
export async function PATCH(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const { status, trackingNumber, estimatedDelivery } = await req.json();

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    const currentStatus = order.trackingStatus || order.orderStatus;
    const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];

    if (!allowed.includes(status)) {
      return NextResponse.json(
        {
          error: `Cannot change status from ${currentStatus} to ${status}. Allowed: ${allowed.join(", ") || "none"}`,
        },
        { status: 400 }
      );
    }

    // Update status fields
    order.orderStatus = status;
    order.trackingStatus = status;

    // Set timestamp for the new status
    const now = new Date();
    switch (status) {
      case "Packed":
        order.confirmedAt = now;
        break;
      case "Shipped":
        order.shippedAt = now;
        if (trackingNumber) order.trackingNumber = trackingNumber;
        if (estimatedDelivery) order.estimatedDelivery = new Date(estimatedDelivery);
        break;
      case "Out for Delivery":
        order.outForDeliveryAt = now;
        break;
      case "Delivered":
        order.deliveredAt = now;
        break;
      case "Cancelled":
        order.cancelledAt = now;
        break;
    }

    await order.save();

    // Log the action
    await AdminLog.create({
      adminName: "Admin",
      action: "Updated order tracking status",
      details: `${order.orderNumber || order._id} → ${status}`,
    });

    // Create notification
    const notifMessages = {
      Packed: `Order ${order.orderNumber} has been packed`,
      Shipped: `Order ${order.orderNumber} has been shipped`,
      "Out for Delivery": `Order ${order.orderNumber} is out for delivery`,
      Delivered: `Order ${order.orderNumber} has been delivered`,
      Cancelled: `Order ${order.orderNumber} has been cancelled`,
    };

    await Notification.create({
      type: status === "Cancelled" ? "cancel" : "order",
      message: notifMessages[status] || `Order ${order.orderNumber} status updated to ${status}`,
      orderId: order.orderNumber || "",
    });

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error("Admin status update error:", error);
    return NextResponse.json(
      { error: "Failed to update order status" },
      { status: 500 }
    );
  }
}
