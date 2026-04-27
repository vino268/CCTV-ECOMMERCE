import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Admin from "@/models/Admin";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(req) {
  try {
    await connectDB();
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase();

    // Support admin accounts in User collection while enforcing role-based access.
    const userAccount = await User.findOne({ email: normalizedEmail });
    if (userAccount && String(userAccount.role || "").toLowerCase() !== "admin") {
      return NextResponse.json(
        { success: false, message: "Access denied. Admin only" },
        { status: 403 }
      );
    }

    const admin =
      userAccount && String(userAccount.role || "").toLowerCase() === "admin"
        ? userAccount
        : await Admin.findOne({ email: normalizedEmail });

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Access denied. Admin only" },
        { status: 403 }
      );
    }

    // Support both bcrypt-hashed and plain-text passwords for legacy admin accounts.
    const isBcryptHash = admin.password.startsWith("$2a$") || admin.password.startsWith("$2b$");
    let isMatch = false;

    if (isBcryptHash) {
      isMatch = await bcrypt.compare(password, admin.password);
    } else {
      isMatch = password === admin.password;
    }

    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: "Invalid password" },
        { status: 401 }
      );
    }

    // Auto-upgrade plain-text password to bcrypt hash on successful login
    if (!isBcryptHash) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await Admin.findByIdAndUpdate(admin._id, { $set: { password: hashedPassword } });
    }

    const adminData = {
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      profileImage: admin.profileImage || admin.avatar || "",
      role: admin.role,
    };

    const token = jwt.sign(
      { id: String(admin._id), role: admin.role || "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const response = NextResponse.json({
      success: true,
      token,
      role: "admin",
      admin: adminData,
    });
    const isProduction = process.env.NODE_ENV === "production";

    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });
    response.cookies.set("adminToken", "", {
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });
    response.cookies.set("userToken", "", {
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });
    return response;
  } catch (error) {
    console.error("ADMIN LOGIN ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Login failed",
        error: String(error),
        stack: process.env.NODE_ENV !== "production" ? error?.stack : undefined,
      },
      { status: 500 }
    );
  }
}
