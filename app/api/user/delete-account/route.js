import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { verifyUser, authError } from "@/app/api/address/_helpers";

export async function DELETE(req) {
  try {
    const auth = await verifyUser(req);
    if (!auth.ok) {
      return authError(auth);
    }

    await connectDB();

    const body = await req.json().catch(() => ({}));
    const password = String(body?.password || "").trim();

    if (!password) {
      return NextResponse.json(
        { success: false, error: "Password is required" },
        { status: 400 }
      );
    }

    const user = await User.findById(auth.userId).select("_id email password role isDeleted");
    if (!user || String(user.role || "").toLowerCase() !== "user") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (user.isDeleted) {
      const alreadyDeletedResponse = NextResponse.json(
        { success: true, message: "Your account has been successfully deleted" },
        { status: 200 }
      );

      alreadyDeletedResponse.cookies.set("userToken", "", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 0,
        expires: new Date(0),
      });

      return alreadyDeletedResponse;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password || "");
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: "Incorrect password" },
        { status: 401 }
      );
    }

    await User.findByIdAndUpdate(String(user._id), {
      $set: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    const response = NextResponse.json({
      success: true,
      message: "Your account has been successfully deleted",
    });

    response.cookies.set("userToken", "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });

    return response;
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
