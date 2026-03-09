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

const EDIT_WINDOW_MS = 12 * 60 * 60 * 1000; // 12 hours

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
      order.orderStatus = body.orderStatus;
      await order.save();
      return NextResponse.json({ success: true, order });
    }

    if (body.paymentStatus !== undefined) {
      order.paymentStatus = body.paymentStatus;
      await order.save();
      return NextResponse.json({ success: true, order });
    }

    // ── User: delivery info edit (12-hour restriction) ─────────────────────
    const diff = Date.now() - new Date(order.createdAt).getTime();
    if (diff > EDIT_WINDOW_MS) {
      return NextResponse.json(
        { error: "Order editing time has expired (12-hour limit)" },
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
