import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import AdminLog from "@/models/AdminLog";
import Notification from "@/models/Notification";
import { adminAuthError, verifyAdmin } from "@/app/api/admin/_helpers";

const ADMIN_ALLOWED_STATUSES = [
  "Pending",
  "Packed",
  "Ordered",
  "Confirmed",
  "Shipped",
  "Out for Delivery",
  "OutForDelivery",
  "Delivered",
  "Cancelled",
];

function normalizeIncomingStatus(status) {
  if (!status) return status;
  const value = String(status).trim();
  const map = {
    pending: "Pending",
    packed: "Packed",
    ordered: "Ordered",
    confirmed: "Confirmed",
    shipped: "Shipped",
    outfordelivery: "OutForDelivery",
    "out for delivery": "OutForDelivery",
    out_for_delivery: "OutForDelivery",
    "out-for-delivery": "OutForDelivery",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };
  return map[value.toLowerCase()] || value;
}

function mapWorkflowStatus(status) {
  switch (status) {
    case "Pending":
    case "Ordered":
      return "Pending";
    case "Packed":
    case "Confirmed":
      return "Packed";
    case "Shipped":
      return "Shipped";
    case "OutForDelivery":
    case "Out for Delivery":
      return "Out for Delivery";
    case "Delivered":
      return "Delivered";
    case "Cancelled":
      return "Cancelled";
    default:
      return "Pending";
  }
}

// GET /api/orders/[id] — return single order
export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const order = await Order.findOne({ _id: id, isDeleted: false });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}

// PUT /api/orders/[id]
// Admin status/payment update  → body: { orderStatus } or { paymentStatus }
// User delivery edit           → body: { deliveryInfo, phone } — 12-hour window enforced
export async function PUT(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const order = await Order.findOne({ _id: id, isDeleted: false });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // ── Admin: status / payment updates (no time restriction) ──────────────
    if (body.orderStatus !== undefined) {
      const nextStatus = normalizeIncomingStatus(body.orderStatus);

      if (!ADMIN_ALLOWED_STATUSES.includes(nextStatus)) {
        return NextResponse.json(
          { error: "Invalid order status" },
          { status: 400 }
        );
      }

      order.orderStatus = nextStatus;
      order.trackingStatus = nextStatus;
      order.status = mapWorkflowStatus(nextStatus);

      // Set timestamp for the status change
      const now = new Date();
      switch (nextStatus) {
        case "Ordered":
        case "Pending":
          order.confirmedAt = null;
          order.shippedAt = null;
          order.outForDeliveryAt = null;
          order.deliveredAt = null;
          order.cancelledAt = null;
          break;
        case "Confirmed":
        case "Packed":
          order.confirmedAt = now;
          order.shippedAt = null;
          order.outForDeliveryAt = null;
          order.deliveredAt = null;
          order.cancelledAt = null;
          break;
        case "Shipped":
          if (!order.confirmedAt) order.confirmedAt = now;
          order.shippedAt = now;
          break;
        case "OutForDelivery":
        case "Out for Delivery":
          if (!order.confirmedAt) order.confirmedAt = now;
          if (!order.shippedAt) order.shippedAt = now;
          order.outForDeliveryAt = now;
          order.cancelledAt = null;
          break;
        case "Delivered":
          if (!order.confirmedAt) order.confirmedAt = now;
          if (!order.shippedAt) order.shippedAt = now;
          order.outForDeliveryAt = order.outForDeliveryAt || now;
          order.deliveredAt = now;
          break;
        case "Cancelled":
          order.cancelledAt = now;
          break;
      }

      await order.save();

      await AdminLog.create({
        adminName: "Admin",
        action: "Changed order status",
        details: `${order.orderNumber || order._id} → ${nextStatus}`,
      });

      if (nextStatus === "Cancelled") {
        await Notification.create({
          type: "cancel",
          message: `Order ${order.orderNumber || order._id} was cancelled`,
          orderId: order.orderNumber || "",
        });
      }

      if (nextStatus === "Delivered") {
        await Notification.create({
          type: "delivery",
          message: `Order ${order.orderNumber || order._id} was delivered`,
          orderId: order.orderNumber || "",
        });
      }

      return NextResponse.json({ success: true, order });
    }

    if (body.paymentStatus !== undefined) {
      order.paymentStatus = body.paymentStatus;
      await order.save();
      return NextResponse.json({ success: true, order });
    }

    // ── User: delivery info edit (only when Ordered or Confirmed) ─────────
    const editableStatuses = ["Ordered", "Confirmed"];
    if (!editableStatuses.includes(order.orderStatus)) {
      return NextResponse.json(
        { error: "Order can only be edited before shipping" },
        { status: 403 }
      );
    }

    if (body.deliveryInfo) {
      const existing = order.deliveryInfo?.toObject
        ? order.deliveryInfo.toObject()
        : { ...(order.deliveryInfo || {}) };
      order.deliveryInfo = { ...existing, ...body.deliveryInfo };
    }

    if (body.phone !== undefined) {
      order.phone = body.phone;
    }

    await order.save();
    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const auth = await verifyAdmin(req);
    if (!auth.ok) return adminAuthError(auth);

    await connectDB();
    const { id } = await params;

    const order = await Order.findByIdAndUpdate(
      id,
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      },
      { new: true }
    );
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    await AdminLog.create({
      adminName: "Admin",
      action: "Soft deleted order",
      details: order.orderNumber || String(order._id),
    });

    return NextResponse.json({ message: "Order moved to trash successfully", order });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete order" }, { status: 500 });
  }
}
