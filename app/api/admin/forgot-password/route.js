import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Admin from "@/models/Admin";
import crypto from "crypto";

export async function POST(req) {
  try {
    await connectDB();
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      // Don't reveal whether the email exists
      return NextResponse.json({
        success: true,
        message: "If this email is registered, a reset token has been generated.",
      });
    }

    // Generate a reset token and expiry
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await Admin.findByIdAndUpdate(admin._id, {
      $set: { resetToken, resetTokenExpiry },
    });

    // In production, you would send this token via email.
    // For now, we return it in the response for development.
    console.log(`Reset token for ${email}: ${resetToken}`);

    return NextResponse.json({
      success: true,
      message: "If this email is registered, a reset token has been generated.",
      // Remove the token from response in production
      resetToken,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to process request" },
      { status: 500 }
    );
  }
}
