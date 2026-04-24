import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Notification from "@/models/Notification";
import { verifyAdmin, adminAuthError } from "@/app/api/admin/_helpers";

// GET /api/notifications
export async function GET(req) {
  try {
    const auth = await verifyAdmin(req);
    if (!auth.ok) return adminAuthError(auth);

    await connectDB();
    const data = await Notification.find().sort({ createdAt: -1 }).limit(10);
    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/notifications error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch notifications" }, { status: 500 });
  }
}

// DELETE /api/notifications — clear all notifications
export async function DELETE(req) {
  try {
    const auth = await verifyAdmin(req);
    if (!auth.ok) return adminAuthError(auth);

    await connectDB();
    await Notification.deleteMany({});

    return NextResponse.json({ success: true, message: "Notifications cleared permanently" });
  } catch (error) {
    console.error("DELETE /api/notifications error:", error);
    return NextResponse.json({ success: false, message: "Failed to clear notifications" }, { status: 500 });
  }
}
