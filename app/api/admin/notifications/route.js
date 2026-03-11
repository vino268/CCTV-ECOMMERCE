import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Notification from "@/models/Notification";

// GET /api/admin/notifications — list all notifications (newest first)
export async function GET() {
  try {
    await connectDB();
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .limit(50);
    const unreadCount = await Notification.countDocuments({ read: false });
    return NextResponse.json({ success: true, notifications, unreadCount });
  } catch (error) {
    console.error("Get notifications error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

// POST /api/admin/notifications — create a new notification
export async function POST(req) {
  try {
    await connectDB();
    const { title, message, type } = await req.json();

    if (!title || !message) {
      return NextResponse.json(
        { success: false, message: "Title and message are required" },
        { status: 400 }
      );
    }

    const notification = await Notification.create({ title, message, type });
    return NextResponse.json(
      { success: true, notification },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create notification error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create notification" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/notifications — delete all notifications
export async function DELETE() {
  try {
    await connectDB();
    await Notification.deleteMany({});
    return NextResponse.json({ success: true, message: "All notifications deleted" });
  } catch (error) {
    console.error("Delete all notifications error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete notifications" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/notifications — mark all notifications as read
export async function PATCH() {
  try {
    await connectDB();
    await Notification.updateMany({ read: false }, { $set: { read: true } });
    return NextResponse.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    console.error("Mark all read error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to mark notifications as read" },
      { status: 500 }
    );
  }
}
