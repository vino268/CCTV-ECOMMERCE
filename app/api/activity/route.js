import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import AdminLog from "@/models/AdminLog";

// DELETE /api/activity — clear all logs
export async function DELETE() {
  try {
    await connectDB();
    const result = await AdminLog.deleteMany({});

    return NextResponse.json({
      success: true,
      message: "All logs cleared",
      deletedCount: result.deletedCount || 0,
    });
  } catch (error) {
    console.error("Clear activity logs error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to clear logs" },
      { status: 500 }
    );
  }
}
