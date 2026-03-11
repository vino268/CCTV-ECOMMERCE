import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Notification from "@/models/Notification";

// DELETE /api/admin/notifications/[id] — delete a single notification
export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const { id } = params;

    const deleted = await Notification.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Notification not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Notification deleted" });
  } catch (error) {
    console.error("Delete notification error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete notification" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/notifications/[id] — mark a single notification as read
export async function PATCH(req, { params }) {
  try {
    await connectDB();
    const { id } = params;

    const updated = await Notification.findByIdAndUpdate(
      id,
      { $set: { read: true } },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Notification not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, notification: updated });
  } catch (error) {
    console.error("Mark notification read error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update notification" },
      { status: 500 }
    );
  }
}
