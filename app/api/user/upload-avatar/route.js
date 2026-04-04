import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { jwtVerify } from "jose";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

const MAX_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png"]);

function extensionFromType(type) {
  if (type === "image/png") return "png";
  return "jpg";
}

// POST /api/user/upload-avatar
export async function POST(req) {
  try {
    await connectDB();

    const formData = await req.formData();
    const file = formData.get("file");
    const email = String(formData.get("email") || "").toLowerCase().trim();

    if (!email) {
      return NextResponse.json({ success: false, message: "Email is required" }, { status: 400 });
    }

    if (!file || typeof file === "string") {
      return NextResponse.json({ success: false, message: "Image file is required" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { success: false, message: "Only JPG and PNG images are allowed" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, message: "Image size must be 2MB or less" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email }).select("_id");
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const ext = extensionFromType(file.type);
    const fileName = `avatar-${user._id}-${Date.now()}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");
    const filePath = path.join(uploadDir, fileName);

    await mkdir(uploadDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    const avatarUrl = `/uploads/avatars/${fileName}`;

    await User.findByIdAndUpdate(user._id, { $set: { avatar: avatarUrl } });

    return NextResponse.json({
      success: true,
      avatarUrl,
      message: "Profile image updated",
    });
  } catch (error) {
    console.error("Upload avatar error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to upload profile image" },
      { status: 500 }
    );
  }
}

// DELETE /api/user/upload-avatar
export async function DELETE(req) {
  try {
    const token = req.cookies.get("userToken")?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "");
    const { payload } = await jwtVerify(token, secret);
    const userId = String(payload.userId || payload.id || "");

    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

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
