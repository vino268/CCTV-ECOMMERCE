import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Admin from "@/models/Admin";
import User from "@/models/User";
import { verifyAdmin } from "@/app/api/admin/_helpers";

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// GET /api/admin/profile
export async function GET(req) {
  try {
    const auth = await verifyAdmin(req);
    if (!auth.ok) {
      return NextResponse.json(
        { success: false, message: auth.message },
        { status: auth.status }
      );
    }

    await connectDB();
    const adminFromAdminModel = await Admin.findById(auth.adminId).select(
      "-password -resetToken -resetTokenExpiry"
    );

    const adminFromUserModel =
      adminFromAdminModel ||
      (await User.findOne({ _id: auth.adminId, role: "admin" }).select("-password"));

    const admin = adminFromUserModel;

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Admin not found" },
        { status: 404 }
      );
    }

    const adminPayload = {
      _id: admin._id,
      name: admin.name || "",
      email: admin.email || "",
      phone: admin.phone || "",
      role: admin.role || "admin",
      profileImage: admin.profileImage || admin.avatar || "",
      createdAt: admin.createdAt,
    };
    const response = NextResponse.json({ success: true, admin: adminPayload });
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    return response;
  } catch (error) {
    console.error("Get admin profile error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/profile — update name/email
export async function PUT(req) {
  try {
    const auth = await verifyAdmin(req);
    if (!auth.ok) {
      return NextResponse.json(
        { success: false, message: auth.message },
        { status: auth.status }
      );
    }

    await connectDB();
    const { name, email, phone } = await req.json();

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

    const updateData = {};
    if (name !== undefined) updateData.name = normalizedName;
    if (email !== undefined) updateData.email = normalizedEmail;
    if (phone !== undefined) updateData.phone = normalizedPhone;

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
    console.error("Update admin profile error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update profile" },
      { status: 500 }
    );
  }
}
