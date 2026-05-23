import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import AdminLog from "@/models/AdminLog";
import { adminAuthError, verifyAdmin } from "@/app/api/admin/_helpers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function DELETE(req, { params }) {
  try {
    const auth = await verifyAdmin(req);
    if (!auth.ok) return adminAuthError(auth);

    await connectDB();

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    await Order.findByIdAndDelete(id);

    await AdminLog.create({
      adminName: "Admin",
      action: "Permanently deleted order",
      details: order.orderNumber || String(order._id),
    });

    return NextResponse.json({ success: true, message: "Order permanently deleted" });
  } catch (error) {
    console.error("DELETE /api/admin/orders/permanent-delete/[id] error:", error);
    return NextResponse.json({ success: false, message: "Permanent delete failed" }, { status: 500 });
  }
}