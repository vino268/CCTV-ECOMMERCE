import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(req) {
  try {
    const token = req.cookies.get("userToken")?.value;
    if (!token) {
      return NextResponse.json({ authenticated: false, message: "Unauthorized" }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "");
    const { payload } = await jwtVerify(token, secret);
    const email = String(payload.email || "").toLowerCase();

    if (!email) {
      return NextResponse.json({ authenticated: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const user = await User.findOne({ email }).select("-password");

    if (!user) {
      return NextResponse.json({ authenticated: false, message: "Unauthorized" }, { status: 401 });
    }

    if (user.isBlocked) {
      return NextResponse.json(
        {
          authenticated: false,
          message: "User blocked",
          error: "Your account has been blocked. Please contact support.",
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user,
    });
  } catch {
    return NextResponse.json({ authenticated: false, message: "Unauthorized" }, { status: 401 });
  }
}
