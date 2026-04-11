import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(req) {
  try {
    const token = req.cookies.get("token")?.value || req.cookies.get("userToken")?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("Auth me API error", new Error("JWT_SECRET is not configured"));
      return NextResponse.json({ success: false, message: "Server misconfiguration" }, { status: 500 });
    }

    const secret = new TextEncoder().encode(jwtSecret);
    const { payload } = await jwtVerify(token, secret);
    const userId = String(payload.id || payload.userId || "");

    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    if (user.isDeleted) {
      return NextResponse.json(
        {
          success: false,
          message: "Your account has been deleted",
          error: "Your account has been deleted",
        },
        { status: 403 }
      );
    }

    if (user.isBlocked) {
      return NextResponse.json(
        {
          success: false,
          message: "User blocked",
          error: "Your account has been blocked. Please contact support.",
        },
        { status: 403 }
      );
    }

    const userPayload = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      avatar: user.avatar || "",
      profileImage: user.avatar || "",
      role: user.role,
      createdAt: user.createdAt,
    };

    return NextResponse.json({
      success: true,
      user: userPayload,
    });
  } catch (error) {
    console.error("Auth me API error", error);
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
}
