import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import Notification from "@/models/Notification";
import User from "@/models/User";
import Product from "@/models/Product";
import { authError, verifyUser } from "@/app/api/address/_helpers";

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
  return method || "COD";
}

function normalizePaymentStatus(value, paymentMethod = "COD") {
  const raw = toTrimmed(value);
  const validStatuses = ["Paid", "Unpaid", "Pending", "Refunded"];
  const matched = validStatuses.find((status) => status.toLowerCase() === raw.toLowerCase());
  if (matched) {
    return matched;
  }
  return paymentMethod === "COD" ? "Pending" : "Paid";
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

    const query = { isDeleted: false };

    if (userId) {
      query.userId = userId;
    } else if (email) {
      query.email = { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") };
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });
    console.log("Orders:", orders.length);

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
        paymentStatus: order.paymentStatus || "Unpaid",
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

    const productId = toTrimmed(body?.productId || body?.product?.productId);
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

    const product = {
      productId,
      name: toTrimmed(body?.product?.name || productDoc?.name || "Product"),
      price: toPositiveNumber(body?.product?.price, toPositiveNumber(productDoc?.price, 0)),
      image: toTrimmed(body?.product?.image || productDoc?.image),
    };

    const duplicateWindowStart = new Date(Date.now() - 2 * 60 * 1000);
    const existingOrder = await Order.findOne({
      isDeleted: false,
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

    const orderCode = buildUniqueOrderId();
    const newOrder = await Order.create({
      orderId: orderCode,
      orderNumber: orderCode,
      address,
      status: "Ordered",
      paymentMethod,
      paymentStatus,

      // Compatibility fields
      userId: toTrimmed(auth.userId),
      productId: product.productId,
      quantity,
      total: Number((product.price * quantity).toFixed(2)),
      customerName: user.name || address.fullName,
      email: user.email,
      phone: address.phone,
      items: [
        {
          name: product.name,
          price: product.price,
          quantity,
          image: product.image,
        },
      ],
      products: [
        {
          productId: product.productId,
          productName: product.name,
          productImage: product.image,
          productPrice: product.price,
          quantity,
        },
      ],
      totalAmount: Number(totalAmountFromBody.toFixed(2)),
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

    return NextResponse.json(
      {
        success: true,
        message: "Order created successfully",
        order: newOrder,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("ORDER ERROR:", error?.message || error);
    return NextResponse.json({ success: false, message: error?.message || "Server error" }, { status: 500 });
  }
}
