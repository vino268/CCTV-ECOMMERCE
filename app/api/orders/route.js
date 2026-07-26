import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import Notification from "@/models/Notification";
import User from "@/models/User";
import Product from "@/models/Product";
import { authError, verifyUser } from "@/app/api/address/_helpers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function buildUniqueOrderId() {
  return `#TN-${Date.now()}-${Math.floor(100000 + Math.random() * 900000)}`;
}

function toTrimmed(value) {
  return String(value || "").trim();
}

function normalizePaymentMethod(value) {
  const method = toTrimmed(value || "COD");
  const normalized = method.toLowerCase();
  if (/cod|cash[\s-\-]?on[\s-\-]?delivery/i.test(normalized)) {
    return "COD";
  }
  if (/online|razorpay|upi|card|netbanking/i.test(normalized)) {
    return "Online";
  }
  return method || "COD";
}

function normalizePaymentStatus(value, paymentMethod = "COD") {
  const raw = toTrimmed(value);
  const validStatuses = ["Paid", "Unpaid", "Pending", "Refunded", "Failed"];
  const matched = validStatuses.find((status) => status.toLowerCase() === raw.toLowerCase());
  if (matched) {
    return matched;
  }
  return paymentMethod === "COD" ? "Pending" : "Paid";
}

function verifyRazorpaySignature({ orderId, paymentId, signature }) {
  const keySecret = String(process.env.RAZORPAY_KEY_SECRET || "").trim();
  if (!keySecret) {
    return false;
  }

  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

function toPositiveNumber(value, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, parsed);
}

function toPositiveInteger(value, fallback = 1) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, Math.floor(parsed));
}

// GET /api/orders — return all orders or user-specific orders
export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const userId = String(searchParams.get("userId") || "").trim();
    const email = String(searchParams.get("email") || "").trim().toLowerCase();

    const query = { isDeleted: { $ne: true } };

    if (userId) {
      query.userId = userId;
    } else if (email) {
      query.email = { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") };
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });

    const normalizedOrders = orders.map((orderDoc) => {
      const order = orderDoc?.toObject ? orderDoc.toObject() : orderDoc;
      const delivery = order?.deliveryInfo || {};
      const fullAddress = [
        delivery.street,
        delivery.city,
        delivery.state,
        delivery.zip,
      ]
        .filter((value) => String(value || "").trim())
        .join(", ");

      return {
        ...order,
        orderId: order.orderId || order.orderNumber || String(order._id || ""),
        paymentMethod: normalizePaymentMethod(order.paymentMethod),
        customerName:
          order.customerName ||
          [delivery.firstName, delivery.lastName]
            .filter((value) => String(value || "").trim())
            .join(" ") ||
          "Customer",
        email: order.email || delivery.email || "",
        phone: order.phone || delivery.phone || "",
        address: order.address || fullAddress || "",
        status: order.status || order.trackingStatus || order.orderStatus || "Ordered",
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt || new Date(),
      };
    });

    return NextResponse.json(normalizedOrders);
  } catch (error) {
    console.error("GET /api/orders error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

// POST /api/orders
export async function POST(req) {
  try {
    await connectDB();
    const auth = await verifyUser(req);
    if (!auth.ok) return authError(auth);

    const body = await req.json();

    const payloadProducts = Array.isArray(body?.products) ? body.products.filter(Boolean) : [];
    const payloadItems = Array.isArray(body?.items) ? body.items.filter(Boolean) : [];
    const productId = toTrimmed(body?.productId || body?.product?.productId || payloadProducts[0]?.productId);
    const quantity = toPositiveInteger(body?.quantity, 1);
    const totalAmountFromBody = toPositiveNumber(body?.totalAmount, toPositiveNumber(body?.total, 0));

    const payloadAddress = body?.address && typeof body.address === "object" ? body.address : null;
    if (!productId || !payloadAddress || totalAmountFromBody <= 0) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const address = {
      fullName: toTrimmed(payloadAddress?.fullName || payloadAddress?.name),
      phone: toTrimmed(payloadAddress?.phone),
      email: toTrimmed(payloadAddress?.email || auth.email),
      address: toTrimmed(payloadAddress?.address),
      city: toTrimmed(payloadAddress?.city),
      state: toTrimmed(payloadAddress?.state),
      pincode: toTrimmed(payloadAddress?.pincode),
    };

    if (!address.fullName || !address.phone || !address.address) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const productDoc = await Product.findById(productId).lean().catch(() => null);
    if (!productDoc) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    const userDoc = await User.findById(auth.userId).select("name email").lean();
    const user = {
      name: toTrimmed(body?.user?.name || userDoc?.name || address.fullName || "Customer"),
      email: toTrimmed(body?.user?.email || userDoc?.email || auth.email).toLowerCase(),
    };

    const paymentMethod = normalizePaymentMethod(body?.paymentMethod || body?.payment?.method || body?.payment?.paymentMethod);
    const paymentStatus = normalizePaymentStatus(body?.paymentStatus || body?.payment?.status, paymentMethod);
    const razorpayOrderId = toTrimmed(body?.razorpayOrderId || body?.razorpay_order_id);
    const razorpayPaymentId = toTrimmed(body?.razorpayPaymentId || body?.razorpay_payment_id);
    const razorpaySignature = toTrimmed(body?.razorpaySignature || body?.razorpay_signature);

    if (paymentMethod === "Online" && paymentStatus === "Paid") {
      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        return NextResponse.json(
          {
            success: false,
            message: "Missing Razorpay payment verification details",
          },
          { status: 400 }
        );
      }

      const signatureValid = verifyRazorpaySignature({
        orderId: razorpayOrderId,
        paymentId: razorpayPaymentId,
        signature: razorpaySignature,
      });

      if (!signatureValid) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid Razorpay payment signature",
          },
          { status: 400 }
        );
      }
    }

    const normalizedProducts = payloadProducts.length
      ? payloadProducts.map((item) => ({
          productId: toTrimmed(item?.productId || productId),
          productName: toTrimmed(item?.productName || item?.name || productDoc?.name || "Product"),
          productImage: toTrimmed(item?.productImage || item?.image || productDoc?.image),
          productPrice: toPositiveNumber(item?.productPrice, toPositiveNumber(item?.price, toPositiveNumber(productDoc?.price, 0))),
          quantity: toPositiveInteger(item?.quantity, 1),
        }))
      : [
          {
            productId,
            productName: toTrimmed(body?.product?.name || productDoc?.name || "Product"),
            productImage: toTrimmed(body?.product?.image || productDoc?.image),
            productPrice: toPositiveNumber(body?.product?.price, toPositiveNumber(productDoc?.price, 0)),
            quantity,
          },
        ];

    const normalizedItems = payloadItems.length
      ? payloadItems.map((item) => ({
          name: toTrimmed(item?.name || item?.productName || productDoc?.name || "Product"),
          price: toPositiveNumber(item?.price, toPositiveNumber(item?.productPrice, toPositiveNumber(productDoc?.price, 0))),
          quantity: toPositiveInteger(item?.quantity, quantity),
          image: toTrimmed(item?.image || item?.productImage || productDoc?.image),
        }))
      : normalizedProducts.map((item) => ({
          name: item.productName,
          price: item.productPrice,
          quantity: item.quantity,
          image: item.productImage,
        }));

    const primaryProduct = normalizedProducts[0];
    const product = {
      productId: primaryProduct.productId,
      name: primaryProduct.productName,
      price: primaryProduct.productPrice,
      image: primaryProduct.productImage,
    };

    if (paymentMethod === "COD") {
      const duplicateWindowStart = new Date(Date.now() - 2 * 60 * 1000);
      const existingOrder = await Order.findOne({
        isDeleted: { $ne: true },
        createdAt: { $gte: duplicateWindowStart },
        email: user.email,
        userId: toTrimmed(auth.userId),
        productId: product.productId,
        "address.fullName": address.fullName,
        "address.phone": address.phone,
        "address.address": address.address,
      });

      if (existingOrder) {
        return NextResponse.json({
          success: true,
          message: "Order created successfully",
          duplicate: true,
          order: existingOrder,
        }, { status: 201 });
      }
    }

    const orderCode = buildUniqueOrderId();
    const newOrder = await Order.create({
      orderId: orderCode,
      orderNumber: orderCode,
      address,
      status: "Ordered",
      paymentMethod,
      paymentStatus,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,

      // Compatibility fields
      userId: toTrimmed(auth.userId),
      productId: product.productId,
      quantity,
      total: product.price * quantity,
      customerName: user.name || address.fullName,
      email: user.email,
      phone: address.phone,
      items: normalizedItems,
      products: normalizedProducts,
      totalAmount: totalAmountFromBody,
      orderStatus: "Ordered",
      trackingStatus: "Ordered",
      deliveryInfo: {
        firstName: address.fullName,
        lastName: "",
        email: address.email,
        phone: address.phone,
        street: address.address,
        city: address.city,
        state: address.state,
        zip: address.pincode,
      },
      deliveryDetails: {
        name: address.fullName,
        phone: address.phone,
        email: address.email,
        address: address.address,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
      },
    });

    await Notification.create({
      type: "ORDER_CREATED",
      message: `New order placed: ${newOrder.orderId}`,
      title: "New Order",
    });

    const isFailedOnlinePayment = paymentMethod === "Online" && paymentStatus !== "Paid";

    return NextResponse.json(
      {
        success: !isFailedOnlinePayment,
        message: isFailedOnlinePayment ? "Payment not completed" : "Order created successfully",
        order: newOrder,
      },
      { status: isFailedOnlinePayment ? 400 : 201 }
    );
  } catch (error) {
    console.error("Razorpay Error:", error);
    return NextResponse.json({ success: false, message: error?.message || "Server error" }, { status: 500 });
  }
}
