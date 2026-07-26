import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import Notification from "@/models/Notification";
import { canRequestCancellation, normalizeOrderStatus, normalizePaymentMethod, normalizePaymentStatus } from "@/lib/order-lifecycle";
import { verifyUser, authError } from "@/app/api/address/_helpers";
import { buildOrderLookupQuery, resolveOrderLookupValue } from "@/lib/order-lookup";

async function cancelById(req, params) {
  try {
    const normalizeOrderId = (value) => {
      const cleaned = String(value || '').trim();
      if (!cleaned) return '';
      const lower = cleaned.toLowerCase();
      if (lower === 'undefined' || lower === 'null') return '';
      return cleaned;
    };

    const resolvedParams = await params;
    let id = normalizeOrderId(resolvedParams?.id);
    let body = {};
    try {
      body = await req.json();
    } catch (e) {
      body = {};
    }

    if (!id) {
      id = normalizeOrderId(body?.orderId || body?.id || body?._id);
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

    const lookupValue = resolveOrderLookupValue({ id, body });
    if (!lookupValue) {
      console.warn('❌ Order ID is missing');
      return NextResponse.json({ success: false, message: 'Order ID is required' }, { status: 400 });
    }

    const order = await Order.findOne(buildOrderLookupQuery(lookupValue));
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

    const currentStatus = normalizeOrderStatus(order.status || order.orderStatus || order.trackingStatus);
    const paymentMethod = normalizePaymentMethod(order.paymentMethod);
    const paymentStatus = normalizePaymentStatus(order.paymentStatus, paymentMethod);
    console.log(`✏️  Current status: ${currentStatus} | Target: Cancellation Requested`);

    if (currentStatus === "Cancellation Requested") {
      return NextResponse.json({ success: false, message: "Cancellation already requested" }, { status: 400 });
    }

    if (!canRequestCancellation(currentStatus)) {
      console.warn(`⚠️  Cannot request cancellation for ${currentStatus} order`);
      return NextResponse.json({ success: false, message: "Order cannot be cancelled after shipping" }, { status: 400 });
    }

    const selectedReason = String(body?.reason || body?.cancellationReason || "").trim();
    const customReason = String(body?.customReason || body?.otherReason || "").trim();
    const cancellationReason = customReason || selectedReason || "Other";

    order.statusBeforeCancellation = currentStatus;
    order.orderStatus = "Cancellation Requested";
    order.trackingStatus = "Cancellation Requested";
    order.status = "Cancellation Requested";
    order.cancelledBy = "USER";
    order.cancelRequested = true;
    order.cancellationRequested = true;
    order.cancellationReason = cancellationReason;
    order.cancellationRequestedAt = new Date();
    order.cancellationApprovedAt = null;
    order.cancellationRejectedAt = null;
    order.cancellationRejectionReason = "";
    order.cancelledAt = null;
    order.refundStatus = paymentMethod === "Online" && paymentStatus === "Paid" ? "Not Initiated" : "Not Applicable";
    await order.save();

    console.log(`✅ Cancellation request saved by user`);

    const orderIdentifier = String(order.orderId || order.orderNumber || order._id || "").trim();
    const displayOrderIdentifier = orderIdentifier.startsWith("#")
      ? orderIdentifier
      : `#${orderIdentifier}`;

    await Notification.create({
      title: "Cancellation Requested",
      type: "ORDER_CANCELLATION_REQUESTED",
      message: `Cancellation requested for order ${displayOrderIdentifier}`,
      userId: auth.userId || null,
      orderId: order._id,
      isRead: false,
    });

    console.log(`📢 Notification created for order cancellation request`);

    return NextResponse.json({
      success: true,
      message: "Cancellation request submitted successfully",
      order,
    });
  } catch (error) {
    console.error("❌ PATCH /api/orders/[id]/cancel error:", error);
    return NextResponse.json({ success: false, message: error?.message || "Failed to cancel order" }, { status: 500 });
  }
}

export async function PATCH(req, context) {
  return cancelById(req, context?.params || {});
}

export async function PUT(req, context) {
  return cancelById(req, context?.params || {});
}
