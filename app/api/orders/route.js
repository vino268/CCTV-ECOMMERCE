import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import Notification from "@/models/Notification";
import User from "@/models/User";

function buildUniqueOrderId() {
  return `#TN-${Date.now()}-${Math.floor(100000 + Math.random() * 900000)}`;
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
    const body = await req.json();

    const user = {
      name: String(body?.user?.name || '').trim(),
      email: String(body?.user?.email || '').trim().toLowerCase(),
    };
    const product = {
      productId: String(body?.product?.productId || '').trim(),
      name: String(body?.product?.name || '').trim(),
      price: Number(body?.product?.price || 0),
      image: String(body?.product?.image || '').trim(),
    };
    const address = {
      fullName: String(body?.address?.fullName || '').trim(),
      phone: String(body?.address?.phone || '').trim(),
      email: String(body?.address?.email || user.email || '').trim(),
      address: String(body?.address?.address || '').trim(),
      city: String(body?.address?.city || '').trim(),
      state: String(body?.address?.state || '').trim(),
      pincode: String(body?.address?.pincode || '').trim(),
    };

    if (!user.email || !product.productId || !product.name || !address.fullName || !address.phone || !address.address) {
      return NextResponse.json({ success: false, message: 'user, product and address are required' }, { status: 400 });
    }

    const duplicateWindowStart = new Date(Date.now() - 2 * 60 * 1000);
    const existingOrder = await Order.findOne({
      isDeleted: false,
      createdAt: { $gte: duplicateWindowStart },
      email: user.email,
      productId: product.productId,
      'address.fullName': address.fullName,
      'address.phone': address.phone,
      'address.address': address.address,
    });

    if (existingOrder) {
      return NextResponse.json({ success: true, duplicate: true, order: existingOrder });
    }

    const orderCode = buildUniqueOrderId();
    const newOrder = await Order.create({
      orderId: orderCode,
      orderNumber: orderCode,
      user,
      product,
      address,
      status: 'Ordered',
      paymentStatus: 'Unpaid',

      // Compatibility fields
      userId: '',
      productId: product.productId,
      customerName: user.name || address.fullName,
      email: user.email,
      phone: address.phone,
      items: [
        {
          name: product.name,
          price: product.price,
          quantity: 1,
          image: product.image,
        },
      ],
      products: [
        {
          productId: product.productId,
          productName: product.name,
          productImage: product.image,
          productPrice: product.price,
          quantity: 1,
        },
      ],
      totalAmount: Number(product.price || 0),
      orderStatus: 'Ordered',
      trackingStatus: 'Ordered',
      deliveryInfo: {
        firstName: address.fullName,
        lastName: '',
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
      type: 'ORDER_CREATED',
      message: `New order placed: ${newOrder.orderId}`,
      orderId: newOrder.orderId,
    });

    return NextResponse.json({ success: true, order: newOrder });
  } catch (error) {
    console.error('POST /api/orders error:', error);
    return NextResponse.json({ success: false, message: 'Failed to create order' }, { status: 500 });
  }
}
