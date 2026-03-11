import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import AdminLog from "@/models/AdminLog";

// GET /api/admin/activity — return latest 50 admin logs
export async function GET() {
  try {
    await connectDB();
    const logs = await AdminLog.find().sort({ createdAt: -1 }).limit(50);
    return NextResponse.json({ success: true, logs });
  } catch (error) {
    console.error("Fetch admin logs error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch logs" },
      { status: 500 }
    );
  }
}

// POST /api/admin/activity — create a new log entry
export async function POST(req) {
  try {
    await connectDB();
    const { action, adminName, details } = await req.json();

    if (!action || !adminName) {
      return NextResponse.json(
        { success: false, message: "action and adminName are required" },
        { status: 400 }
      );
    }

    const log = await AdminLog.create({ action, adminName, details });
    return NextResponse.json({ success: true, log });
  } catch (error) {
    console.error("Create admin log error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create log" },
      { status: 500 }
    );
  }
}
