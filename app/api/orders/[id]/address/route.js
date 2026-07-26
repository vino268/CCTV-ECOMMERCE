import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import Notification from "@/models/Notification";
import { verifyUser, authError, validateAddressPayload } from "@/app/api/address/_helpers";

function normalizeStatus(status) {
  const value = String(status || "").trim().toLowerCase();
  if (!value) return "Ordered";
  if (value === "outfordelivery" || value === "out_for_delivery") return "Out for Delivery";
  if (value === "ordered" || value === "pending") return "Ordered";
  if (value === "packed") return "Packed";
  if (value === "shipped") return "Shipped";
  if (value === "delivered") return "Delivered";
  if (value === "cancelled") return "Cancelled";
  return "Ordered";
}

// PUT /api/orders/[id]/address
export async function PUT(req, { params }) {
  try {
    await connectDB();

    const auth = await verifyUser(req);
    if (!auth.ok) return authError(auth);

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const addressPayload = body?.address && typeof body.address === "object" ? body.address : {};

    const validated = validateAddressPayload(addressPayload);
    if (!validated.ok) {
      return NextResponse.json({ success: false, message: validated.message }, { status: 400 });
    }

    const email = String(addressPayload.email || "").trim();
    const normalizedAddress = {
      ...validated.data,
      email,
    };

    const order = await Order.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    const isOwner =
      String(order.userId || order.user || "") === String(auth.userId || "") ||
      (email && String(order.email || "").toLowerCase() === email.toLowerCase());

    if (!isOwner) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const currentStatus = normalizeStatus(order.status || order.orderStatus || order.trackingStatus);
    if (currentStatus !== "Ordered") {
      return NextResponse.json(
        { success: false, message: "Address cannot be changed after shipping" },
        { status: 400 }
      );
    }

    order.address = normalizedAddress;
    order.deliveryDetails = {
      name: normalizedAddress.fullName,
      phone: normalizedAddress.phone,
      email: normalizedAddress.email,
      address: normalizedAddress.address,
      city: normalizedAddress.city,
      state: normalizedAddress.state,
      pincode: normalizedAddress.pincode,
    };
    order.deliveryInfo = {
      firstName: normalizedAddress.fullName,
      lastName: "",
      email: normalizedAddress.email,
      phone: normalizedAddress.phone,
      street: normalizedAddress.address,
      city: normalizedAddress.city,
      state: normalizedAddress.state,
      zip: normalizedAddress.pincode,
    };

    await order.save();

    await Notification.create({
      type: "ADDRESS_UPDATED",
      message: `Address updated for order ${order.orderId || order.orderNumber || order._id}`,
      orderId: order.orderId || order.orderNumber || "",
    });

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error("PUT /api/orders/[id]/address error:", error);
    return NextResponse.json({ success: false, message: "Failed to update address" }, { status: 500 });
  }
}
