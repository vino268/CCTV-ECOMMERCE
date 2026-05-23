import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import AdminLog from "@/models/AdminLog";
import Notification from "@/models/Notification";
import mongoose from "mongoose";

const ALLOWED_TRANSITIONS = {
  Pending: ["Ordered", "Cancelled"],
  Ordered: ["Packed", "Cancelled"],
  Packed: ["Shipped", "Cancelled"],
  Shipped: ["Out for Delivery"],
  "Out for Delivery": ["Delivered"],
  Delivered: [],
  Cancelled: [],
};

function normalizeIncomingStatus(status) {
  const value = String(status || '').trim().toLowerCase();
  const map = {
    pending: 'Pending',
    ordered: 'Ordered',
    packed: 'Packed',
    shipped: 'Shipped',
    outfordelivery: 'Out for Delivery',
    'out for delivery': 'Out for Delivery',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };

  return map[value] || String(status || '').trim();
}

// PATCH /api/admin/orders/[id]/status
export async function PATCH(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const { status, trackingNumber, estimatedDelivery } = await req.json();
    const normalizedStatus = normalizeIncomingStatus(status);

    if (!normalizedStatus) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    const order = await Order.findById(id);
    if (!order || order.isDeleted) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    const currentStatus = order.trackingStatus || order.orderStatus;
    const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];

    if (!allowed.includes(normalizedStatus)) {
      return NextResponse.json(
        {
          error: `Cannot change status from ${currentStatus} to ${normalizedStatus}. Allowed: ${allowed.join(", ") || "none"}`,
        },
        { status: 400 }
      );
    }

    // Update status fields
    order.status = normalizedStatus;
    order.orderStatus = normalizedStatus;
    order.trackingStatus = normalizedStatus;

    if (normalizedStatus === "Delivered" && String(order.paymentMethod || '').trim().toLowerCase() === 'cod') {
      order.paymentStatus = "Paid";
    }

    // Set timestamp for the new status
    const now = new Date();
    switch (normalizedStatus) {
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
      details: `${order.orderNumber || order._id} → ${normalizedStatus}`,
    });

    const normalizedUserId =
      order.user && mongoose.Types.ObjectId.isValid(order.user)
        ? order.user
        : order.userId && mongoose.Types.ObjectId.isValid(order.userId)
        ? order.userId
        : null;

    console.log("Saving notification for:", order._id);

    await Notification.create({
      type: normalizedStatus === "Cancelled" ? "CANCELLED" : "STATUS_UPDATED",
      message:
        normalizedStatus === "Cancelled"
          ? `Order ${order.orderId} cancelled`
          : `Order ${order.orderId} updated to ${normalizedStatus}`,
      orderId: order._id,
      userId: normalizedUserId,
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
