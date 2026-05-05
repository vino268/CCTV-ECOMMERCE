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

    // Permanent delete: remove completely from DB
    const order = await Order.findByIdAndDelete(id);

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    // Log the permanent deletion
    await AdminLog.create({
      adminName: "Admin",
      action: "Permanently deleted order",
      details: order.orderNumber || String(order._id),
    });

    console.log(`[admin/order-permanent] Order ${order.orderNumber || id} deleted forever.`);

    return NextResponse.json({
      success: true,
      message: "Order permanently deleted"
    });
  } catch (error) {
    console.error("PERMANENT DELETE ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Permanent delete failed" },
      { status: 500 }
    );
  }
}
