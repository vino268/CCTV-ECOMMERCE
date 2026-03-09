import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

// GET /api/users — get all users (admin use)
export async function GET() {
  try {
    await connectDB();
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });
    return NextResponse.json(users);
  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
