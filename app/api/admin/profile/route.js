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

export async function GET() {
  try {
    const auth = await verifyAdmin();
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
      data: admin
    });
  } catch (error) {
    console.error("Get admin profile error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch profile" }, { status: 500 });
  }
}

// PUT /api/admin/profile — update name/email
export async function PUT(req) {
  try {
    const auth = await verifyAdmin();
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
