import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Notification from "@/models/Notification";

export async function POST(req) {
  try {
    const data = await req.json();
    console.log("Incoming request:", data);

    const name = String(data?.name || "").trim();
    const email = String(data?.email || "").trim().toLowerCase();
    const password = String(data?.password || "");

    if (!name || !email || !password) {
      return Response.json(
        { success: false, error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return Response.json(
        { success: false, error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    await connectDB();

    const existingUser = await User.findOne({ email, isDeleted: { $ne: true } });
    console.log("User found:", existingUser ? existingUser.email : null);

    if (existingUser) {
      return Response.json(
        { success: false, error: "Email already registered" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const createdUser = await User.create({
      name,
      email,
      password: hashedPassword,
      phone: String(data?.phone || "").trim(),
      dob: data?.dob || null,
      role: "user",
    });

    await Notification.create({
      title: "New User Registered",
      type: "user",
      message: `${name} created a new account`,
      userId: createdUser._id,
      isRead: false,
    });

    return Response.json(
      {
        success: true,
        message: "Account created successfully",
        user: {
          _id: createdUser._id,
          name: createdUser.name,
          email: createdUser.email,
          role: createdUser.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register API error:", error);
    return Response.json(
      { success: false, error: "Failed to create account" },
      { status: 500 }
    );
  }
}
