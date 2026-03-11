import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import AdminLog from "@/models/AdminLog";
import Notification from "@/models/Notification";

// GET /api/orders/[id] — return single order
export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const order = await Order.findById(id);

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

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // ── Admin: status / payment updates (no time restriction) ──────────────
    if (body.orderStatus !== undefined) {
      // Enforce allowed status transitions
      const allowedTransitions = {
        Ordered: ["Confirmed", "Cancelled"],
        Confirmed: ["Shipped", "Cancelled"],
        Shipped: ["OutForDelivery"],
        OutForDelivery: ["Delivered"],
        Delivered: [],
        Cancelled: [],
      };

      const currentStatus = order.trackingStatus || order.orderStatus;
      const allowed = allowedTransitions[currentStatus] || [];
      if (!allowed.includes(body.orderStatus)) {
        return NextResponse.json(
          { error: `Cannot change status from ${currentStatus} to ${body.orderStatus}` },
          { status: 400 }
        );
      }

      order.orderStatus = body.orderStatus;
      order.trackingStatus = body.orderStatus;

      // Set timestamp for the status change
      const now = new Date();
      switch (body.orderStatus) {
        case "Confirmed": order.confirmedAt = now; break;
        case "Shipped": order.shippedAt = now; break;
        case "OutForDelivery": order.outForDeliveryAt = now; break;
        case "Delivered": order.deliveredAt = now; break;
        case "Cancelled": order.cancelledAt = now; break;
      }

      await order.save();

      await AdminLog.create({
        adminName: "Admin",
        action: "Changed order status",
        details: `${order.orderNumber || order._id} → ${body.orderStatus}`,
      });

      if (body.orderStatus === "Cancelled") {
        await Notification.create({
          type: "cancel",
          message: `Order ${order.orderNumber || order._id} was cancelled`,
          orderId: order.orderNumber || "",
        });
      }

      if (body.orderStatus === "Delivered") {
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
