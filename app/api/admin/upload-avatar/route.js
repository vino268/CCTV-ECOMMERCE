import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { jwtVerify } from "jose";
import { connectDB } from "@/lib/mongodb";
import Admin from "@/models/Admin";
import User from "@/models/User";

const MAX_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png"]);

function extensionFromType(type) {
  if (type === "image/png") return "png";
  return "jpg";
}

async function verifyAdmin(request) {
  const cookieToken = request.cookies.get("token")?.value || request.cookies.get("adminToken")?.value;
  const authHeader = request.headers.get("authorization") || "";
  const bearerToken = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : "";
  const token = cookieToken || bearerToken;
  if (!token) return { ok: false, status: 401, message: "Unauthorized" };

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "");
    const { payload } = await jwtVerify(token, secret);
    if (String(payload.role || "").toLowerCase() !== "admin") {
      return { ok: false, status: 403, message: "Forbidden" };
    }

    return { ok: true, adminId: String(payload.id || "") };
  } catch {
    return { ok: false, status: 401, message: "Unauthorized" };
  }
}

async function updateAdminImage(adminId, profileImage) {
  const updatedAdmin = await Admin.findByIdAndUpdate(
    adminId,
    { $set: { profileImage } },
    { new: true }
  ).select("_id name email phone role profileImage createdAt");

  if (updatedAdmin) {
    return {
      _id: updatedAdmin._id,
      name: updatedAdmin.name || "",
      email: updatedAdmin.email || "",
      phone: updatedAdmin.phone || "",
      role: updatedAdmin.role || "admin",
      profileImage: updatedAdmin.profileImage || "",
      createdAt: updatedAdmin.createdAt,
    };
  }

  const updatedUserAdmin = await User.findOneAndUpdate(
    { _id: adminId, role: "admin" },
    { $set: { avatar: profileImage } },
    { new: true }
  ).select("_id name email phone role avatar createdAt");

  if (!updatedUserAdmin) return null;

  return {
    _id: updatedUserAdmin._id,
    name: updatedUserAdmin.name || "",
    email: updatedUserAdmin.email || "",
    phone: updatedUserAdmin.phone || "",
    role: updatedUserAdmin.role || "admin",
    profileImage: updatedUserAdmin.avatar || "",
    createdAt: updatedUserAdmin.createdAt,
  };
}

// POST /api/admin/upload-avatar
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
    const file = formData.get("file");

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

    const ext = extensionFromType(file.type);
    const fileName = `admin-avatar-${auth.adminId}-${Date.now()}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");
    const filePath = path.join(uploadDir, fileName);

    await mkdir(uploadDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    const profileImage = `/uploads/avatars/${fileName}`;
    const admin = await updateAdminImage(auth.adminId, profileImage);

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Admin not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      profileImage,
      admin,
      message: "Profile image updated",
    });
  } catch (error) {
    console.error("Admin upload avatar error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to upload profile image" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/upload-avatar
export async function DELETE(req) {
  try {
    const auth = await verifyAdmin(req);
    if (!auth.ok) {
      return NextResponse.json(
        { success: false, message: auth.message },
        { status: auth.status }
      );
    }

    await connectDB();
    const admin = await updateAdminImage(auth.adminId, null);

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Admin not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      admin,
      message: "Profile image removed",
    });
  } catch (error) {
    console.error("Admin remove avatar error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to remove profile image" },
      { status: 500 }
    );
  }
}
