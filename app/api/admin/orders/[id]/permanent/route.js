import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import AdminLog from "@/models/AdminLog";
import { adminAuthError, verifyAdmin } from "@/app/api/admin/_helpers";

export async function DELETE(req, { params }) {
  try {
    const auth = await verifyAdmin(req);
    if (!auth.ok) return adminAuthError(auth);

    await connectDB();
    const { id } = await params;

    const order = await Order.findOneAndDelete({ _id: id, isDeleted: true });
    if (!order) {
      return NextResponse.json({ error: "Deleted order not found" }, { status: 404 });
    }

    await AdminLog.create({
      adminName: "Admin",
      action: "Permanently deleted order",
      details: order.orderNumber || String(order._id),
    });

    return NextResponse.json({ success: true, message: "Order permanently deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to permanently delete order" }, { status: 500 });
  }
}
