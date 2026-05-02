import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import Notification from "@/models/Notification";
import { verifyUser, authError } from "@/app/api/address/_helpers";

function normalizeStatus(status) {
  const value = String(status || "").trim().toLowerCase();
  if (value === "pending" || value === "ordered") return "Ordered";
  if (value === "confirmed" || value === "packed") return "Packed";
  if (value === "shipped") return "Shipped";
  if (value === "outfordelivery" || value === "out for delivery" || value === "out_for_delivery") return "Out for Delivery";
  if (value === "delivered") return "Delivered";
  if (value === "cancelled") return "Cancelled";
  return "Ordered";
}

async function cancelById(req, params) {
  try {
    const normalizeOrderId = (value) => {
      const cleaned = String(value || '').trim();
      if (!cleaned) return '';
      const lower = cleaned.toLowerCase();
      if (lower === 'undefined' || lower === 'null') return '';
      return cleaned;
    };

    let id = normalizeOrderId(params?.id);
    // Fallback: allow clients to PATCH without path param and send { orderId }
    if (!id) {
      try {
        const body = await req.json();
        id = normalizeOrderId(body?.orderId || body?.id || body?._id);
      } catch (e) {
        // ignore JSON parse errors
      }
    }
    console.log('🔍 User cancel order - OrderID:', id);

    await connectDB();

    const auth = await verifyUser(req);
    if (!auth.ok) {
      console.warn("⚠️  User authentication failed");
      return authError(auth);
    }

    if (!id) {
      console.warn('❌ Order ID is missing');
      return NextResponse.json({ success: false, message: 'Order ID is required' }, { status: 400 });
    }

    const isValidObjectId = (value) => /^[0-9a-fA-F]{24}$/.test(value);
    if (!isValidObjectId(id)) {
      console.warn('❌ Invalid order ID format:', id);
      return NextResponse.json({ success: false, message: 'Order ID is invalid' }, { status: 400 });
    }

    const order = await Order.findOne({ _id: id, isDeleted: false });
    if (!order) {
      console.warn("⚠️  Order not found or deleted:", id);
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    const ownerId = String(order.userId || "").trim();
    const ownerEmail = String(order.email || order?.user?.email || "").trim().toLowerCase();
    const requesterId = String(auth.userId || "").trim();
    const requesterEmail = String(auth.email || "").trim().toLowerCase();

    const isOwner =
      (Boolean(ownerId) && ownerId === requesterId) ||
      (Boolean(ownerEmail) && ownerEmail === requesterEmail);

    console.log(`👤 Requester: ${requesterEmail || requesterId} | Order Owner: ${ownerEmail || ownerId}`);

    if (!isOwner) {
      console.warn(`❌ Unauthorized cancellation attempt`);
      return NextResponse.json({ success: false, message: "Not your order" }, { status: 403 });
    }

    const currentStatus = normalizeStatus(order.status || order.orderStatus || order.trackingStatus);
    console.log(`✏️  Current status: ${currentStatus} | Target: Cancelled`);

    if (["Shipped", "Delivered"].includes(currentStatus)) {
      console.warn(`⚠️  Cannot cancel ${currentStatus} order`);
      return NextResponse.json({ success: false, message: "Cannot cancel shipped or delivered order" }, { status: 400 });
    }

    if (currentStatus === "Cancelled") {
      console.log(`ℹ️  Order already cancelled, skipping update`);
      return NextResponse.json({ success: false, message: "Order is already cancelled" }, { status: 400 });
    }

    order.status = "Cancelled";
    order.orderStatus = "Cancelled";
    order.trackingStatus = "Cancelled";
    order.cancelledBy = "USER";
    order.cancelRequested = false;
    order.cancelledAt = new Date();
    await order.save();

    console.log(`✅ Order cancelled successfully by user`);

    const orderIdentifier = String(order.orderId || order.orderNumber || order._id || "").trim();
    const displayOrderIdentifier = orderIdentifier.startsWith("#")
      ? orderIdentifier
      : `#${orderIdentifier}`;

    await Notification.create({
      title: "Order Cancelled",
      type: "ORDER_CANCELLED",
      message: `Order ${displayOrderIdentifier} cancelled by user`,
      userId: auth.userId || null,
      orderId: order._id,
      isRead: false,
    });

    console.log(`📢 Notification created for order cancellation`);

    return NextResponse.json({
      success: true,
      message: "Order cancelled successfully",
      order,
    });
  } catch (error) {
    console.error("❌ PATCH /api/orders/[id]/cancel error:", error);
    return NextResponse.json({ success: false, message: "Failed to cancel order" }, { status: 500 });
  }
}

export async function PATCH(req, context) {
  return cancelById(req, context?.params || {});
}

export async function PUT(req, context) {
  return cancelById(req, context?.params || {});
}
