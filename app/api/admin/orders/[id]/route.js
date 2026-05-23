import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import { verifyAdmin, adminAuthError } from "@/app/api/admin/_helpers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function deleteOrder(req, { params }) {
  try {
    const auth = await verifyAdmin(req);
    if (!auth.ok) return adminAuthError(auth);

    await connectDB();

    const { id } = await params;

    const deletedOrder = await Order.findOneAndUpdate(
      { _id: id, isDeleted: false },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!deletedOrder) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    console.log(`[admin/order-delete] Order ${deletedOrder.orderNumber || id} moved to trash.`);

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
