import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { connectDB } from "@/lib/mongodb";
import Admin from "@/models/Admin";
import User from "@/models/User";
import { verifyAdmin } from "@/app/api/admin/_helpers";

function normalizeStoredPath(value) {
  return String(value || "")
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .trim();
}

async function findAdminById(adminId) {
  const adminFromAdminModel = await Admin.findById(adminId).select(
    "_id name email phone role profileImage avatar createdAt"
  );

  if (adminFromAdminModel) return adminFromAdminModel;

  return User.findOne({ _id: adminId, role: "admin" }).select(
    "_id name email phone role profileImage avatar createdAt"
  );
}

async function clearAdminAvatar(adminId) {
  const updatedAdmin = await Admin.findByIdAndUpdate(
    adminId,
    { $set: { avatar: "", profileImage: "" } },
    { new: true }
  ).select("_id name email phone role profileImage avatar createdAt");

  if (updatedAdmin) return updatedAdmin;

  return User.findOneAndUpdate(
    { _id: adminId, role: "admin" },
    { $set: { avatar: "", profileImage: "" } },
    { new: true }
  ).select("_id name email phone role profileImage avatar createdAt");
}

// DELETE /api/admin/profile/avatar
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

    const current = await findAdminById(auth.adminId);
    if (!current) {
      return NextResponse.json(
        { success: false, message: "Admin not found" },
        { status: 404 }
      );
    }

    const currentAvatar = String(current.avatar || current.profileImage || "").trim();
    if (currentAvatar) {
      const normalized = normalizeStoredPath(currentAvatar);
      const publicRelative = normalized.startsWith("public/")
        ? normalized.slice("public/".length)
        : normalized;

      const candidatePublicFile = path.join(process.cwd(), "public", publicRelative);
      const candidateRootFile = path.join(process.cwd(), normalized);

      // Best-effort deletion (works in local/server deployments; serverless may ignore)
      for (const filePath of [candidatePublicFile, candidateRootFile]) {
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            break;
          }
        } catch {
          // ignore
        }
      }
    }

    const admin = await clearAdminAvatar(auth.adminId);

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Admin not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Avatar removed successfully",
      admin: {
        _id: admin._id,
        name: admin.name || "",
        email: admin.email || "",
        phone: admin.phone || "",
        role: admin.role || "admin",
        profileImage: "",
        avatar: "",
        createdAt: admin.createdAt,
      },
    });
  } catch (error) {
    console.error("DELETE /api/admin/profile/avatar error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to remove profile image" },
      { status: 500 }
    );
  }
}
