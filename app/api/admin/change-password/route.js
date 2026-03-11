import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Admin from "@/models/Admin";
import AdminLog from "@/models/AdminLog";
import bcrypt from "bcryptjs";

export async function PUT(req) {
  try {
    await connectDB();
    const { email, currentPassword, newPassword } = await req.json();

    if (!email || !currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: "New password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Admin not found" },
        { status: 404 }
      );
    }

    // Support both bcrypt-hashed and plain-text passwords
    const isBcryptHash =
      admin.password.startsWith("$2a$") || admin.password.startsWith("$2b$");
    let isMatch = false;

    if (isBcryptHash) {
      isMatch = await bcrypt.compare(currentPassword, admin.password);
    } else {
      // Plain-text fallback — auto-upgrade old password to hash
      isMatch = currentPassword === admin.password;
      if (isMatch) {
        const upgradedHash = await bcrypt.hash(admin.password, 10);
        await Admin.findByIdAndUpdate(admin._id, { $set: { password: upgradedHash } });
      }
    }

    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: "Current password is incorrect" },
        { status: 401 }
      );
    }

    // Hash the new password and update
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await Admin.findByIdAndUpdate(admin._id, {
      $set: { password: hashedPassword },
    });

    // Log the activity
    await AdminLog.create({
      adminName: admin.name || admin.email,
      action: "Changed password",
    });

    return NextResponse.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to change password" },
      { status: 500 }
    );
  }
}
