import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Notification from "@/models/Notification";
import { verifyAdmin, adminAuthError } from "@/app/api/admin/_helpers";

// DELETE /api/notifications/:id
export async function DELETE(req, { params }) {
  try {
    const auth = await verifyAdmin(req);
    if (!auth.ok) return adminAuthError(auth);

    await connectDB();

    const id = String(params?.id || "").trim();
    if (!id) {
      return NextResponse.json({ success: false, message: "Notification ID is required" }, { status: 400 });
    }

    const deleted = await Notification.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ success: false, message: "Notification not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Notification deleted permanently" });
  } catch (error) {
    console.error("DELETE /api/notifications/[id] error:", error);
    return NextResponse.json({ success: false, message: "Failed to delete notification" }, { status: 500 });
  }
}