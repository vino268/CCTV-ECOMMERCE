import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import Notification from "@/models/Notification";
import AdminLog from "@/models/AdminLog";
import { verifyAdmin, adminAuthError } from "@/app/api/admin/_helpers";
import { getRazorpayClient } from "@/lib/razorpay";
import { canRequestCancellation, normalizeOrderStatus, normalizePaymentMethod, normalizePaymentStatus } from "@/lib/order-lifecycle";
import { buildOrderLookupQuery, resolveOrderLookupValue } from "@/lib/order-lookup";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function toPositivePaise(amount) {
  const rupees = Number(amount || 0);
  if (!Number.isFinite(rupees) || rupees <= 0) return 0;
  return Math.max(0, Math.round(rupees * 100));
}

function buildDisplayOrderId(order) {
  const identifier = String(order?.orderId || order?.orderNumber || order?._id || "").trim();
  if (!identifier) return "order";
  return identifier.startsWith("#") ? identifier : `#${identifier}`;
}

async function saveAdminLog(message, order) {
  await AdminLog.create({
    adminName: "Admin",
    action: "Order cancellation workflow",
    details: `${buildDisplayOrderId(order)} - ${message}`,
  });
}

async function sendNotification({ order, type, message }) {
  await Notification.create({
    type,
    message,
    orderId: order._id,
    userId: order.user || order.userId || null,
    isRead: false,
  });
}

async function restoreCancelledRequest(order, reason) {
  const restoreStatus = String(order.statusBeforeCancellation || order.orderStatus || order.trackingStatus || "Ordered").trim();
  const normalizedRestore = normalizeOrderStatus(restoreStatus === "Cancellation Requested" ? "Ordered" : restoreStatus);

  order.orderStatus = normalizedRestore;
  order.trackingStatus = normalizedRestore;
  order.status = normalizedRestore;
  order.cancelRequested = false;
  order.cancellationRequested = false;
  order.cancellationRejectedAt = new Date();
  order.cancellationRejectionReason = String(reason || "").trim();
  order.cancellationApprovedAt = null;
  order.cancelledAt = null;
  order.cancelledBy = null;
  order.refundStatus = normalizePaymentMethod(order.paymentMethod) === "Online" ? "Not Initiated" : "Not Applicable";
  order.paymentStatus = normalizePaymentStatus(order.paymentStatus, order.paymentMethod);

  await order.save();
  await saveAdminLog(`rejected cancellation for ${buildDisplayOrderId(order)}`, order);
  await sendNotification({
    order,
    type: "CANCELLATION_REJECTED",
    message: `Cancellation request rejected for ${buildDisplayOrderId(order)}`,
  });

  return order;
}

async function cancelCodOrder(order, reason) {
  const now = new Date();
  const lockedStatus = normalizeOrderStatus(order.statusBeforeCancellation || order.orderStatus || order.trackingStatus || "Ordered");

  order.orderStatus = "Cancelled";
  order.trackingStatus = "Cancelled";
  order.status = "Cancelled";
  order.cancelledBy = "ADMIN";
  order.cancelledAt = now;
  order.cancellationApprovedAt = now;
  order.cancellationRequested = false;
  order.cancelRequested = false;
  order.statusBeforeCancellation = lockedStatus;
  order.cancellationReason = String(order.cancellationReason || reason || "").trim();
  order.refundStatus = "Not Applicable";
  order.refundAmount = 0;
  order.refundInitiatedAt = null;
  order.refundedAt = null;
  order.razorpayRefundId = "";
  order.paymentStatus = normalizePaymentStatus(order.paymentStatus, order.paymentMethod);
  if (normalizePaymentMethod(order.paymentMethod) === "COD" && order.paymentStatus === "Paid") {
    order.paymentStatus = "Pending";
  }

  await order.save();
  await saveAdminLog(`cancelled COD order ${buildDisplayOrderId(order)}`, order);
  await sendNotification({
    order,
    type: "ORDER_CANCELLED",
    message: `Order ${buildDisplayOrderId(order)} cancelled by admin`,
  });

  return order;
}

async function initiateOnlineRefund(order) {
  const paymentId = String(order.razorpayPaymentId || "").trim();
  if (!paymentId) {
    const error = new Error("Original Razorpay payment ID not found. Automatic refund cannot be initiated.");
    error.code = "PAYMENT_ID_MISSING";
    throw error;
  }

  const refundAmountPaise = toPositivePaise(order.totalAmount || order.total || 0);
  if (refundAmountPaise <= 0) {
    throw new Error("Refund amount is invalid");
  }

  const refund = await getRazorpayClient().payments.refund(paymentId, {
    amount: refundAmountPaise,
    notes: {
      orderId: String(order.orderId || order.orderNumber || order._id || "").trim(),
      reason: String(order.cancellationReason || "").trim(),
    },
  });

  return refund;
}

async function approveCancellation(order, reason) {
  const now = new Date();
  const paymentMethod = normalizePaymentMethod(order.paymentMethod);
  const paymentStatus = normalizePaymentStatus(order.paymentStatus, paymentMethod);
  const currentStatus = normalizeOrderStatus(order.orderStatus || order.status || order.trackingStatus);

  if (!["Ordered", "Packed", "Cancellation Requested"].includes(currentStatus)) {
    throw new Error("Order cannot be cancelled after shipping");
  }

  const alreadyLocked = ["Processing", "Refunded"].includes(String(order.refundStatus || "").trim());
  if (alreadyLocked) {
    throw new Error("Refund already initiated");
  }

  order.statusBeforeCancellation = currentStatus === "Cancellation Requested" ? String(order.statusBeforeCancellation || "Ordered").trim() : currentStatus;
  order.cancellationApprovedAt = now;
  order.cancelledBy = "ADMIN";
  order.cancelledAt = now;
  order.cancellationRequested = false;
  order.cancelRequested = false;
  order.cancellationRejectedAt = null;
  order.cancellationRejectionReason = "";
  order.cancellationReason = String(order.cancellationReason || reason || "").trim();

  if (paymentMethod === "Online" && paymentStatus === "Paid") {
    const refund = await initiateOnlineRefund(order);
    const refundId = String(refund?.id || refund?.refund_id || refund?.refundId || "").trim();

    order.orderStatus = "Cancelled";
    order.trackingStatus = "Cancelled";
    order.status = "Cancelled";
    order.paymentStatus = "Refund Processing";
    order.refundStatus = "Processing";
    order.refundAmount = Number(order.totalAmount || order.total || 0);
    order.refundInitiatedAt = now;
    order.razorpayRefundId = refundId;
    await order.save();

    await Order.findByIdAndUpdate(order._id, {
      $set: {
        razorpayRefundId: refundId,
        refundAmount: Number(order.refundAmount || order.totalAmount || order.total || 0),
        refundInitiatedAt: now,
        orderStatus: "Cancelled",
        trackingStatus: "Cancelled",
        status: "Cancelled",
        paymentStatus: "Refund Processing",
        refundStatus: "Processing",
        cancelledBy: "ADMIN",
        cancelledAt: now,
        cancellationApprovedAt: now,
      },
    }, { new: true });

    await saveAdminLog(`approved refund for ${buildDisplayOrderId(order)}`, order);
    await sendNotification({
      order,
      type: "ORDER_REFUND_PROCESSING",
      message: `Refund initiated for ${buildDisplayOrderId(order)}`,
    });

    return { ...order.toObject(), razorpayRefundId: refundId, refundStatus: "Processing", paymentStatus: "Refund Processing" };
  }

  return cancelCodOrder(order, reason);
}

export async function POST(req, { params }) {
  return handleAction(req, params);
}

export async function PUT(req, { params }) {
  return handleAction(req, params);
}

export async function PATCH(req, { params }) {
  return handleAction(req, params);
}

async function handleAction(req, params) {
  try {
    const auth = await verifyAdmin(req);
    if (!auth.ok) return adminAuthError(auth);

    await connectDB();
    const { id } = await params;
    console.log("Cancel order identifier:", id);
    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || body?.mode || "approve").trim().toLowerCase();
    const reason = String(body?.reason || body?.rejectionReason || body?.cancellationReason || "").trim();
    const lookupValue = resolveOrderLookupValue({ id, body });

    const order = await Order.findOne(buildOrderLookupQuery(lookupValue));
    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    const wasRefundRequired = normalizePaymentMethod(order.paymentMethod) === "Online" && normalizePaymentStatus(order.paymentStatus, order.paymentMethod) === "Paid";

    if (action === "reject") {
      if (normalizeOrderStatus(order.orderStatus || order.status || order.trackingStatus) !== "Cancellation Requested") {
        return NextResponse.json({ success: false, message: "Cancellation request not found" }, { status: 400 });
      }

      const restored = await restoreCancelledRequest(order, reason);
      return NextResponse.json({ success: true, message: "Cancellation request rejected", order: restored });
    }

    const statusBefore = normalizeOrderStatus(order.orderStatus || order.status || order.trackingStatus);
    if (statusBefore === "Cancelled") {
      return NextResponse.json({ success: false, message: "Order already cancelled" }, { status: 400 });
    }

    if (!["Ordered", "Packed", "Cancellation Requested"].includes(statusBefore)) {
      return NextResponse.json({ success: false, message: "Order cannot be cancelled after shipping" }, { status: 400 });
    }

    if (statusBefore !== "Cancellation Requested") {
      order.statusBeforeCancellation = statusBefore;
      order.cancellationRequested = false;
      order.cancelRequested = false;
      order.cancellationRequestedAt = order.cancellationRequestedAt || new Date();
    }

    order.cancellationReason = String(order.cancellationReason || reason || "").trim();

    const approved = await approveCancellation(order, reason);
    return NextResponse.json({
      success: true,
      message: wasRefundRequired
        ? "Refund initiated"
        : "Order cancelled successfully",
      order: approved,
    });
  } catch (error) {
    console.error("Admin cancel error:", error);
    const statusCode = error?.code === "PAYMENT_ID_MISSING" ? 400 : 500;
    return NextResponse.json(
      {
        success: false,
        code: error?.code || "CANCEL_FAILED",
        message: error?.message || "Failed to process cancellation",
      },
      { status: statusCode }
    );
  }
}