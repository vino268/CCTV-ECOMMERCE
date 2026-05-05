import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import { verifyAdmin, adminAuthError } from "@/app/api/admin/_helpers";

export async function PATCH(req, { params }) {
  try {
    const auth = await verifyAdmin(req);
    if (!auth.ok) return adminAuthError(auth);

    await connectDB();

    const { id } = await params;

    // ✅ Only delete if NOT already deleted
    const order = await Order.findOneAndUpdate(
      {
        _id: id,
        isDeleted: false,
      },
      {
        isDeleted: true,
        deletedAt: new Date(),
      },
      { new: true }
    );

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order already deleted or not found" },
        { status: 400 }
      );
    }

    console.log(`[admin/order-delete] Order ${order.orderNumber || id} moved to trash.`);

    return NextResponse.json({
      success: true,
      message: "Order moved to trash",
    });
  } catch (error) {
    console.error("DELETE ORDER ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Delete failed" },
      { status: 500 }
    );
  }
}
