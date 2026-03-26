import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import AdminLog from "@/models/AdminLog";

// DELETE /api/activity/:id — delete one log
export async function DELETE(_req, { params }) {
  try {
    await connectDB();

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Log ID is required" },
        { status: 400 }
      );
    }

    const deletedLog = await AdminLog.findByIdAndDelete(id);

    if (!deletedLog) {
      return NextResponse.json(
        { success: false, message: "Log not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Log deleted successfully",
    });
  } catch (error) {
    console.error("Delete activity log error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete log" },
      { status: 500 }
    );
  }
}
