import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";

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
// User delivery edit           → body: { deliveryInfo, phone } — allowed only when Pending or Shipped
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
      order.orderStatus = body.orderStatus;
      await order.save();
      return NextResponse.json({ success: true, order });
    }

    if (body.paymentStatus !== undefined) {
      order.paymentStatus = body.paymentStatus;
      await order.save();
      return NextResponse.json({ success: true, order });
    }

    // ── User: delivery info edit (status-based restriction) ──────────────────
    const editableStatus = order.orderStatus?.toLowerCase();
    if (
      editableStatus !== "pending" &&
      editableStatus !== "shipped"
    ) {
      return NextResponse.json(
        { error: "Order can only be edited when status is Pending or Shipped" },
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

// DELETE /api/orders/[id] — soft-cancel: sets orderStatus to "Cancelled"
// Order is kept in the database for history tracking.
export async function DELETE(req, { params }) {
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

    if (status !== "pending" && status !== "shipped") {
      return NextResponse.json(
        { error: "Order cannot be cancelled once it is Confirmed or Delivered" },
        { status: 403 }
      );
    }

    order.orderStatus = "Cancelled";
    await order.save();

    return NextResponse.json({ success: true, message: "Order cancelled" });
  } catch (error) {
    console.error("Error cancelling order:", error);
    return NextResponse.json({ error: "Failed to cancel order" }, { status: 500 });
  }
}
