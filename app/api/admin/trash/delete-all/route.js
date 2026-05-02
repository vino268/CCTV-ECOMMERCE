import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import User from "@/models/User";
import AdminLog from "@/models/AdminLog";
import { adminAuthError, verifyAdmin } from "@/app/api/admin/_helpers";

export async function DELETE(req) {
  try {
    const auth = await verifyAdmin(req);
    if (!auth.ok) return adminAuthError(auth);

    await connectDB();

    const { searchParams } = new URL(req.url);
    const tab = searchParams.get("tab");

    if (tab !== "orders" && tab !== "customers") {
      return NextResponse.json({ error: "Invalid tab" }, { status: 400 });
    }

    let result;
    if (tab === "customers") {
      result = await User.deleteMany({ role: "user", isDeleted: true });
    } else {
      result = await Order.deleteMany({ isDeleted: true });
    }

    await AdminLog.create({
      adminName: "Admin",
      action: `Bulk permanently deleted all ${tab}`,
      details: `${result.deletedCount || 0} deleted`,
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount || 0,
    });
  } catch (error) {
    console.error("DELETE /api/admin/trash/delete-all error:", error);
    return NextResponse.json({ error: "Delete all failed" }, { status: 500 });
  }
}
