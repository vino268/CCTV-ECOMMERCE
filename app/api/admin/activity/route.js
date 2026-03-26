import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import AdminLog from "@/models/AdminLog";

const MAX_LOG_RETENTION = 200;

async function pruneOldLogs() {
  const total = await AdminLog.countDocuments();
  if (total <= MAX_LOG_RETENTION) return;

  const oldLogs = await AdminLog.find()
    .sort({ createdAt: -1 })
    .skip(MAX_LOG_RETENTION)
    .select("_id")
    .lean();

  if (oldLogs.length > 0) {
    await AdminLog.deleteMany({ _id: { $in: oldLogs.map((log) => log._id) } });
  }
}

// GET /api/admin/activity?page=1&limit=10 — paginated logs, newest first
export async function GET(req) {
  try {
    await connectDB();
    await pruneOldLogs();

    const { searchParams } = new URL(req.url);
    const pageParam = Number(searchParams.get("page") || 1);
    const limitParam = Number(searchParams.get("limit") || 10);

    const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1;
    const limit =
      Number.isFinite(limitParam) && limitParam > 0
        ? Math.min(20, Math.max(10, Math.floor(limitParam)))
        : 10;

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AdminLog.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      AdminLog.countDocuments(),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return NextResponse.json({
      success: true,
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
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
    await pruneOldLogs();
    return NextResponse.json({ success: true, log });
  } catch (error) {
    console.error("Create admin log error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create log" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/activity — clear all logs
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
    console.error("Clear admin logs error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to clear logs" },
      { status: 500 }
    );
  }
}
