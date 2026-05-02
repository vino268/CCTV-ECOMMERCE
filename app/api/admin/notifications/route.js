import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Notification from "@/models/Notification";
import { verifyAdmin, adminAuthError } from "@/app/api/admin/_helpers";

// GET /api/admin/notifications — return latest 10 notifications
export async function GET(req) {
  try {
    const auth = await verifyAdmin(req);
    if (!auth.ok) return adminAuthError(auth);

    await connectDB();
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    return NextResponse.json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error("GET /api/admin/notifications error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/notifications — mark all as read
export async function PUT(req) {
  try {
    const auth = await verifyAdmin(req);
    if (!auth.ok) return adminAuthError(auth);

    await connectDB();
    const result = await Notification.updateMany({ isRead: false }, { $set: { isRead: true } });
    return NextResponse.json({
      success: true,
      message: "All notifications marked as read",
      updated: result.modifiedCount,
    });
  } catch (error) {
    console.error("PUT /api/admin/notifications error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to mark notifications as read" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/notifications — clear all notifications
export async function DELETE(req) {
  try {
    const auth = await verifyAdmin(req);
    if (!auth.ok) return adminAuthError(auth);

    await connectDB();
    const result = await Notification.deleteMany({});
    return NextResponse.json({
      success: true,
      message: "All notifications cleared",
      deleted: result.deletedCount,
    });
  } catch (error) {
    console.error("DELETE /api/admin/notifications error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to clear notifications" },
      { status: 500 }
    );
  }
}
