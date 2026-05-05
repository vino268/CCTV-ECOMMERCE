import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { verifyAuthSession } from "@/lib/auth-session";

export async function GET(req) {
  try {
    const auth = await verifyAuthSession(req, "user");
    if (!auth.ok) {
      return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
    }

    const userId = String(auth.payload?.id || auth.payload?.userId || "");
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

    if (String(user.role || "").toLowerCase() !== "user") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const userPayload = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      profileImage: user.profileImage || user.avatar || "",
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
