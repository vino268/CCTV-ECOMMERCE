import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
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

    const customer = await User.findOneAndDelete({ _id: id, role: "user", isDeleted: true });
    if (!customer) {
      return NextResponse.json({ error: "Deleted customer not found" }, { status: 404 });
    }

    await AdminLog.create({
      adminName: "Admin",
      action: "Permanently deleted customer",
      details: customer.email || String(customer._id),
    });

    return NextResponse.json({ success: true, message: "Customer permanently deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to permanently delete customer" }, { status: 500 });
  }
}
