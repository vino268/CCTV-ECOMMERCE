import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import User from "@/models/User";
import AdminLog from "@/models/AdminLog";
import { adminAuthError, verifyAdmin } from "@/app/api/admin/_helpers";

export async function POST(req) {
  try {
    const auth = await verifyAdmin(req);
    if (!auth.ok) return adminAuthError(auth);

    await connectDB();

    const body = await req.json().catch(() => ({}));
    const ids = Array.isArray(body?.ids) ? body.ids : [];
    const tab = body?.tab === "customers" ? "customers" : "orders";

    if (ids.length === 0) {
      return NextResponse.json({ error: "No ids provided" }, { status: 400 });
    }

    const validIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
      return NextResponse.json({ error: "No valid ids provided" }, { status: 400 });
    }

    let result;
    if (tab === "customers") {
      result = await User.deleteMany({
        _id: { $in: validIds },
        role: "user",
        isDeleted: true,
      });
    } else {
      result = await Order.deleteMany({
        _id: { $in: validIds },
        isDeleted: true,
      });
    }

    await AdminLog.create({
      adminName: "Admin",
      action: `Bulk permanently deleted ${tab}`,
      details: `${result.deletedCount || 0} deleted`,
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount || 0,
    });
  } catch (error) {
    console.error("POST /api/admin/trash/delete-selected error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
