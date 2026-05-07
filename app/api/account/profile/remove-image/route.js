import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { verifyAuthSession } from "@/lib/auth-session";

export async function DELETE(req) {
  try {
    const auth = await verifyAuthSession(req, "user");
    if (!auth.ok) {
      return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
    }

    await connectDB();

    const user = await User.findByIdAndUpdate(
      auth.payload.id,
      {
        $set: {
          profileImage: null,
          avatar: null,
        },
      },
      { new: true }
    ).select("_id profileImage avatar");

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Profile image removed",
    });
  } catch (error) {
    console.error("Remove profile image error:", error);
    return NextResponse.json({ success: false, message: "Failed to remove profile image" }, { status: 500 });
  }
}