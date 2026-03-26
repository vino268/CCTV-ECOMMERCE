import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import AdminLog from "@/models/AdminLog";
import { adminAuthError, verifyAdmin } from "@/app/api/admin/_helpers";

export async function PATCH(req, { params }) {
  try {
    const auth = await verifyAdmin(req);
    if (!auth.ok) return adminAuthError(auth);

    await connectDB();
    const { id } = await params;

    const order = await Order.findOneAndUpdate(
      { _id: id, isDeleted: true },
      {
        $set: {
          isDeleted: false,
          deletedAt: null,
        },
      },
      { new: true }
    );

    if (!order) {
      return NextResponse.json({ error: "Deleted order not found" }, { status: 404 });
    }

    await AdminLog.create({
      adminName: "Admin",
      action: "Restored order",
      details: order.orderNumber || String(order._id),
    });

    return NextResponse.json({ success: true, message: "Order restored successfully", order });
  } catch (error) {
    return NextResponse.json({ error: "Failed to restore order" }, { status: 500 });
  }
}
