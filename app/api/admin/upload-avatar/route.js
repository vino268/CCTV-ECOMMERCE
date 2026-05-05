import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { connectDB } from "@/lib/mongodb";
import Admin from "@/models/Admin";
import User from "@/models/User";
import { verifyAdmin } from "@/app/api/admin/_helpers";

const MAX_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png"]);

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

// POST /api/admin/upload-avatar (DEPRECATED)
export async function POST(req) {
  return NextResponse.json(
    { success: false, message: "This endpoint is deprecated. Use direct unsigned upload to Cloudinary from the frontend." },
    { status: 410 }
  );
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
