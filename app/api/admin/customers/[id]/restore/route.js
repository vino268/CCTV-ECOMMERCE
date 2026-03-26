import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import AdminLog from "@/models/AdminLog";
import { adminAuthError, verifyAdmin } from "@/app/api/admin/_helpers";

export async function PATCH(req, { params }) {
  try {
    const auth = await verifyAdmin(req);
    if (!auth.ok) return adminAuthError(auth);

    await connectDB();
    const { id } = await params;

    const customer = await User.findOneAndUpdate(
      { _id: id, role: "user", isDeleted: true },
      {
        $set: {
          isDeleted: false,
          deletedAt: null,
        },
      },
      { new: true }
    ).select("-password");

    if (!customer) {
      return NextResponse.json({ error: "Deleted customer not found" }, { status: 404 });
    }

    await AdminLog.create({
      adminName: "Admin",
      action: "Restored customer",
      details: customer.email || String(customer._id),
    });

    return NextResponse.json({ success: true, message: "Customer restored successfully", customer });
  } catch (error) {
    return NextResponse.json({ error: "Failed to restore customer" }, { status: 500 });
  }
}
