import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Admin from "@/models/Admin";
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

    const admin = await Admin.findOne({ email: email.toLowerCase() });
    console.log("Admin found:", admin ? admin.email : "NOT FOUND");

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Admin not found" },
        { status: 401 }
      );
    }

    // Support both bcrypt-hashed and plain-text passwords
    const isBcryptHash = admin.password.startsWith("$2a$") || admin.password.startsWith("$2b$");
    let isMatch = false;

    if (isBcryptHash) {
      isMatch = await bcrypt.compare(password, admin.password);
    } else {
      isMatch = password === admin.password;
    }

    console.log("Password match:", isMatch);

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
      role: admin.role,
    };

    const token = jwt.sign(
      { id: String(admin._id), role: admin.role || "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const response = NextResponse.json({ success: true, token, admin: adminData });
    response.cookies.set("adminToken", token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });
    return response;
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { success: false, message: "Login failed" },
      { status: 500 }
    );
  }
}
