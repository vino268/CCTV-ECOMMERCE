import crypto from "crypto";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import Notification from "@/models/Notification";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function isValidSignature(rawBody, signature) {
  const secret = String(process.env.RAZORPAY_WEBHOOK_SECRET || "").trim();
  if (!secret || !signature) return false;

  const digest = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(String(signature).trim()));
  } catch {
    return false;
  }
}

function toPaise(amount) {
  const value = Number(amount || 0);
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.max(0, Math.round(value));
}

async function resolveOrderFromRefund(payload) {
  const refund = payload?.payload?.refund?.entity || payload?.payload?.refunds?.entity || null;
  const payment = payload?.payload?.payment?.entity || null;
  const refundId = String(refund?.id || refund?.refund_id || "").trim();
  const paymentId = String(refund?.payment_id || payment?.id || payload?.payload?.payment?.entity?.id || "").trim();

  const query = {
    isDeleted: { $ne: true },
    $or: [],
  };

  if (refundId) {
    query.$or.push({ razorpayRefundId: refundId });
  }
  if (paymentId) {
    query.$or.push({ razorpayPaymentId: paymentId });
  }

  if (query.$or.length === 0) {
    return { refundId, paymentId, order: null };
  }

  const order = await Order.findOne(query);
  return { refundId, paymentId, order };
}

export async function POST(req) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!isValidSignature(rawBody, signature)) {
      return NextResponse.json({ success: false, message: "Invalid webhook signature" }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    const event = String(payload?.event || "").trim().toLowerCase();

    if (!event.includes("refund")) {
      return NextResponse.json({ success: true, ignored: true });
    }

    await connectDB();
    const { refundId, paymentId, order } = await resolveOrderFromRefund(payload);

    if (!order) {
      return NextResponse.json({ success: true, message: "No matching order found" });
    }

    const refund = payload?.payload?.refund?.entity || payload?.payload?.refunds?.entity || {};
    const refundStatus = String(refund?.status || event || "").toLowerCase();
    const refundedAt = new Date();
    const refundAmount = toPaise(refund?.amount || order.refundAmount || order.totalAmount || order.total || 0) / 100;

    if (refundStatus === "processed" || refundStatus === "refunded" || refundStatus === "success") {
      order.orderStatus = "Cancelled";
      order.trackingStatus = "Cancelled";
      order.status = "Cancelled";
      order.paymentStatus = "Refunded";
      order.refundStatus = "Refunded";
      order.refundedAt = refundedAt;
      order.cancelledAt = order.cancelledAt || refundedAt;
      order.razorpayRefundId = refundId || order.razorpayRefundId;
      if (refundAmount > 0) {
        order.refundAmount = refundAmount;
      }

      await order.save();

      await Notification.create({
        type: "REFUND_SUCCESS",
        message: `Refund completed for order ${String(order.orderId || order.orderNumber || order._id || "").trim()}`,
        orderId: order._id,
        userId: order.user || order.userId || null,
        isRead: false,
      });

      return NextResponse.json({ success: true });
    }

    if (refundStatus === "failed") {
      order.orderStatus = "Cancelled";
      order.trackingStatus = "Cancelled";
      order.status = "Cancelled";
      order.paymentStatus = "Refund Failed";
      order.refundStatus = "Failed";
      order.refundFailureReason = String(refund?.failure_reason || refund?.error_description || refund?.error_reason || "Refund failed").trim();
      order.razorpayRefundId = refundId || order.razorpayRefundId;
      await order.save();

      await Notification.create({
        type: "REFUND_FAILED",
        message: `Refund failed for order ${String(order.orderId || order.orderNumber || order._id || "").trim()}`,
        orderId: order._id,
        userId: order.user || order.userId || null,
        isRead: false,
      });

      return NextResponse.json({ success: true });
    }

    if (refundStatus === "created" || refundStatus === "processed" || refundStatus === "pending") {
      order.razorpayRefundId = refundId || order.razorpayRefundId;
      order.paymentStatus = "Refund Processing";
      order.refundStatus = "Processing";
      order.refundInitiatedAt = order.refundInitiatedAt || new Date();
      order.orderStatus = "Cancelled";
      order.trackingStatus = "Cancelled";
      order.status = "Cancelled";
      await order.save();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Razorpay webhook error:", error);
    return NextResponse.json({ success: false, message: "Webhook processing failed" }, { status: 500 });
  }
}