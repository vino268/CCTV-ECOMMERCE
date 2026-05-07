import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Admin from "@/models/Admin";
import User from "@/models/User";
import { verifyAdmin } from "@/app/api/admin/_helpers";
import cloudinary from "@/lib/cloudinary";

export const runtime = "nodejs";
export const maxDuration = 60;

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function GET(req) {
  try {
    const auth = await verifyAdmin(req);
    if (!auth.ok) {
      return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
    }

    await connectDB();
    const admin = await Admin.findById(auth.adminId).select("-password").lean();

    if (!admin) {
      return NextResponse.json({ success: false, message: "Admin not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        profileImage: admin.profileImage || admin.avatar || ""
      }
    });
  } catch (error) {
    console.error("Get admin profile error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch profile" }, { status: 500 });
  }
}

// PUT /api/admin/profile — update name/email/image
export async function PUT(req) {
  try {
    const auth = await verifyAdmin(req);
    if (!auth.ok) {
      return NextResponse.json(
        { success: false, message: auth.message },
        { status: auth.status }
      );
    }

    const formData = await req.formData();
    const name = formData.get("name");
    const email = formData.get("email");
    const phone = formData.get("phone");
    const file = formData.get("image");

    const normalizedName = normalizeString(name);
    const normalizedEmail = normalizeString(email).toLowerCase();
    const normalizedPhone = normalizeString(phone);

    if (normalizedEmail && !isValidEmail(normalizedEmail)) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    if (normalizedPhone && !/^\d+$/.test(normalizedPhone)) {
      return NextResponse.json(
        { success: false, message: "Phone number must be numeric" },
        { status: 400 }
      );
    }

    let imageUrl = "";
    if (file && file instanceof File && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64 = buffer.toString("base64");
      const dataURI = `data:${file.type};base64,${base64}`;

      const uploadResult = await cloudinary.uploader.upload(dataURI, {
        folder: "admin_profiles",
      });

      imageUrl = uploadResult.secure_url;
    }

    await connectDB();

    const updateData = {};
    if (name !== null && name !== undefined) updateData.name = normalizedName;
    if (email !== null && email !== undefined) updateData.email = normalizedEmail;
    if (phone !== null && phone !== undefined) updateData.phone = normalizedPhone;
    if (imageUrl) {
      updateData.profileImage = imageUrl;
      updateData.avatar = imageUrl;
    }

    if (normalizedEmail) {
      const existing = await Admin.findOne({
        email: normalizedEmail,
        _id: { $ne: auth.adminId },
      }).select("_id");

      if (existing) {
        return NextResponse.json(
          { success: false, message: "Email already in use" },
          { status: 409 }
        );
      }
    }

    const updated = await Admin.findByIdAndUpdate(auth.adminId, { $set: updateData }, {
      new: true,
      runValidators: true,
    }).select("-password -resetToken -resetTokenExpiry");

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Admin not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, admin: updated });
  } catch (error) {
    console.error("Admin profile upload error:", error);
    console.error("Update admin profile error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update profile" },
      { status: 500 }
    );
  }
}
