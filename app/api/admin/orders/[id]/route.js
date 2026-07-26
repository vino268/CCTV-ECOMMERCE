import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import { verifyAdmin, adminAuthError } from "@/app/api/admin/_helpers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req, { params }) {
  try {
    const auth = await verifyAdmin(req);
    if (!auth.ok) return adminAuthError(auth);

    await connectDB();
    const { id } = await params;

    const order = await Order.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error("GET /api/admin/orders/[id] error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch order" }, { status: 500 });
  }
}

async function deleteOrder(req, { params }) {
  try {
    const auth = await verifyAdmin(req);
    if (!auth.ok) return adminAuthError(auth);

    await connectDB();

    const { id } = await params;

    const order = await Order.findById(id);

    if (!order || order.isDeleted === true) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    console.log("Deleting order:", {
      _id: String(order._id),
      orderId: String(order.orderId || ""),
    });

    order.isDeleted = true;
    order.deletedAt = new Date();
    await order.save();

    console.log(`[admin/order-delete] Order ${order.orderNumber || id} moved to trash.`);

    return NextResponse.json({
      success: true,
      message: "Order moved to trash successfully",
    });
  } catch (error) {
    console.error("DELETE ORDER ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Delete failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(req, context) {
  return deleteOrder(req, context);
}

export async function PATCH(req, context) {
  return deleteOrder(req, context);
}
