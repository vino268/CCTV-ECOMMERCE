import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Notification from "@/models/Notification";

// GET /api/admin/notifications — return latest 10 notifications
export async function GET() {
  try {
    await connectDB();
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .limit(10);
    return NextResponse.json(notifications);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/notifications — mark all as read
export async function PUT() {
  try {
    await connectDB();
    await Notification.updateMany({ isRead: false }, { $set: { isRead: true } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to mark notifications as read" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/notifications — clear all notifications
export async function DELETE() {
  try {
    await connectDB();
    await Notification.deleteMany({});
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to clear notifications" },
      { status: 500 }
    );
  }
}
