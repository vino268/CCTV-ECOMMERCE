import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/mongodb";
import Admin from "@/models/Admin";
import bcrypt from "bcryptjs";
import {
  createAuthSession,
  getSessionCookieName,
  getSessionCookieOptions,
} from "@/lib/auth-session";

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
    const admin = await Admin.findOne({ email: normalizedEmail }).lean();

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: "Invalid password" },
        { status: 401 }
      );
    }

    const adminData = {
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role || "admin",
    };

    const { token } = await createAuthSession({
      userId: admin._id,
      role: "admin",
      email: admin.email,
    });

    const response = NextResponse.json({
      success: true,
      role: "admin",
      admin: adminData,
    });
    
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    const cookieStore = await cookies();
    cookieStore.set(getSessionCookieName("admin"), token, getSessionCookieOptions("admin"));

    return response;
  } catch (error) {
    console.error("ADMIN LOGIN ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Login failed" },
      { status: 500 }
    );
  }
}
