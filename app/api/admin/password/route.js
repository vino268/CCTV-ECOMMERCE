import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Admin from "@/models/Admin";
import AdminLog from "@/models/AdminLog";
import bcrypt from "bcryptjs";
import { jwtVerify } from "jose";

async function verifyAdmin(request) {
  const token = request.cookies.get("token")?.value || request.cookies.get("adminToken")?.value;
  if (!token) {
    return { ok: false, status: 401, message: "Unauthorized" };
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    if (payload.role !== "admin") {
      return { ok: false, status: 403, message: "Forbidden" };
    }

    return { ok: true, adminId: String(payload.id || "") };
  } catch {
    return { ok: false, status: 401, message: "Unauthorized" };
  }
}

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
    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    if (String(newPassword).length < 6) {
      return NextResponse.json(
        { success: false, message: "New password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const admin = await Admin.findById(auth.adminId);
    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Admin not found" },
        { status: 404 }
      );
    }

    const isBcryptHash =
      admin.password.startsWith("$2a$") || admin.password.startsWith("$2b$");
    let isMatch = false;

    if (isBcryptHash) {
      isMatch = await bcrypt.compare(currentPassword, admin.password);
    } else {
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

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await Admin.findByIdAndUpdate(admin._id, {
      $set: { password: hashedPassword },
    });

    await AdminLog.create({
      adminName: admin.name || admin.email,
      action: "Changed password",
    });

    return NextResponse.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Admin password update error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to change password" },
      { status: 500 }
    );
  }
}
