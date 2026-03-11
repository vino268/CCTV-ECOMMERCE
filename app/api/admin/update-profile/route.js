import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Admin from "@/models/Admin";

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();

    if (!body.email) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }

    const updated = await Admin.findOneAndUpdate(
      { email: body.email },
      {
        name: body.name,
        phone: body.phone,
      },
      { new: true }
    ).select("-password -resetToken -resetTokenExpiry");

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Admin not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, admin: updated });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update profile" },
      { status: 500 }
    );
  }
}
