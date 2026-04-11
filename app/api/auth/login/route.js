import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req) {
  try {
    const data = await req.json();

    const email = String(data?.email || "").trim().toLowerCase();
    const password = String(data?.password || "");

    if (!email || !password) {
      return Response.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing in environment variables");
      return Response.json(
        { success: false, error: "Server configuration error" },
        { status: 500 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email, isDeleted: { $ne: true } });

    if (!user) {
      return Response.json(
        { success: false, message: "User not found" },
        { status: 401 }
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return Response.json(
        { success: false, message: "Invalid password" },
        { status: 401 }
      );
    }

    if (user.isBlocked) {
      return Response.json(
        { success: false, error: "Your account has been blocked. Please contact support." },
        { status: 403 }
      );
    }

    const token = jwt.sign(
      {
        id: String(user._id),
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const response = Response.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        role: user.role,
      },
    });

    response.headers.append(
      "Set-Cookie",
      `token=${token}; Path=/; HttpOnly; SameSite=None; Max-Age=${60 * 60 * 24 * 7}; Secure`
    );

    response.headers.append(
      "Set-Cookie",
      `userToken=${token}; Path=/; HttpOnly; SameSite=None; Max-Age=${60 * 60 * 24 * 7}; Secure`
    );

    return response;
  } catch (error) {
    console.error("Login API error:", error);
    return Response.json(
      { success: false, error: "Login failed" },
      { status: 500 }
    );
  }
}
