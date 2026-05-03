import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { connectDB } from "@/lib/mongodb";
import Admin from "@/models/Admin";
import User from "@/models/User";
import { verifyAdmin } from "@/app/api/admin/_helpers";

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png"]);

function extensionFromType(type) {
  if (type === "image/png") return "png";
  return "jpg";
}

async function updateAdminAvatar(adminId, avatarPath) {
  const updatedAdmin = await Admin.findByIdAndUpdate(
    adminId,
    { $set: { avatar: avatarPath, profileImage: avatarPath } },
    { new: true }
  ).select("_id name email phone role profileImage avatar createdAt");

  if (updatedAdmin) return updatedAdmin;

  return User.findOneAndUpdate(
    { _id: adminId, role: "admin" },
    { $set: { avatar: avatarPath, profileImage: avatarPath } },
    { new: true }
  ).select("_id name email phone role profileImage avatar createdAt");
}

// POST /api/admin/profile/image
export async function POST(req) {
  try {
    const auth = await verifyAdmin(req);
    if (!auth.ok) {
      return NextResponse.json(
        { success: false, message: auth.message },
        { status: auth.status }
      );
    }

    await connectDB();

    const formData = await req.formData();
    const file = formData.get("avatar");

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { success: false, message: "Image file is required" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { success: false, message: "Only JPG and PNG images are allowed" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, message: "Image size must be 10MB or less" },
        { status: 400 }
      );
    }

    const ext = extensionFromType(file.type);
    const fileName = `admin-avatar-${auth.adminId}-${Date.now()}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");
    const filePath = path.join(uploadDir, fileName);

    await mkdir(uploadDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    const avatar = `/uploads/avatars/${fileName}`;
    const admin = await updateAdminAvatar(auth.adminId, avatar);

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Admin not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Upload success",
      avatar,
      admin: {
        _id: admin._id,
        name: admin.name || "",
        email: admin.email || "",
        phone: admin.phone || "",
        role: admin.role || "admin",
        profileImage: admin.profileImage || admin.avatar || "",
        avatar: admin.avatar || admin.profileImage || "",
        createdAt: admin.createdAt,
      },
    });
  } catch (error) {
    console.error("POST /api/admin/profile/image error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to upload profile image" },
      { status: 500 }
    );
  }
}
