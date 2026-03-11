import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Notification from "@/models/Notification";

// DELETE /api/admin/notifications/[id] — delete a single notification
export async function DELETE(_req, { params }) {
  try {
    await connectDB();

    const id = params?.id;
    if (!id) {
      return NextResponse.json(
        { error: "Notification id is required" },
        { status: 400 }
      );
    }

    const deleted = await Notification.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Delete notification error:", error);
    return NextResponse.json(
      { error: "Failed to delete notification" },
      { status: 500 }
    );
  }
}
