import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { verifyAuthSession } from "@/lib/auth-session";

const MAX_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png"]);

// POST /api/user/upload-avatar (DEPRECATED)
export async function POST(req) {
  return NextResponse.json(
    { success: false, message: "This endpoint is deprecated. Use direct unsigned upload to Cloudinary from the frontend." },
    { status: 410 }
  );
}

// DELETE /api/user/upload-avatar
export async function DELETE(req) {
  try {
    const auth = await verifyAuthSession(req, "user");
    if (!auth.ok) {
      return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
    }

    const userId = String(auth.payload?.userId || auth.payload?.id || "");

    await connectDB();
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { avatar: null } },
      { new: true }
    ).select("_id avatar");

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Profile image removed" });
  } catch (error) {
    console.error("Remove avatar error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to remove profile image" },
      { status: 500 }
    );
  }
}
