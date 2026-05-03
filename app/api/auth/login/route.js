import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import {
  createAuthSession,
  getSessionCookieName,
  getSessionCookieOptions,
} from "@/lib/auth-session";

export async function POST(req) {
  try {
    const data = await req.json();

    const email = String(data?.email || "").trim().toLowerCase();
    const password = String(data?.password || "");

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email, isDeleted: { $ne: true } });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 401 }
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: "Invalid password" },
        { status: 401 }
      );
    }

    if (user.isBlocked) {
      return NextResponse.json(
        { success: false, error: "Your account has been blocked. Please contact support." },
        { status: 403 }
      );
    }

    const { token } = await createAuthSession({
      userId: user._id,
      role: "user",
      email: user.email,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        role: user.role,
      },
    });

    const cookieStore = await cookies();
    cookieStore.set(getSessionCookieName("user"), token, getSessionCookieOptions());

    return response;
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { success: false, error: "Login failed" },
      { status: 500 }
    );
  }
}
