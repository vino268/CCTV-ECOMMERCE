import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

// GET /api/auth/profile?email=...
export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "-password"
    );

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
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

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// PUT /api/auth/profile — update user profile
export async function PUT(req) {
  try {
    await connectDB();
    const { email, ...updateData } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Never allow password or role updates through this endpoint
    delete updateData.password;
    delete updateData.role;

    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
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

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
