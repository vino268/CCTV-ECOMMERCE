import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Admin from "@/models/Admin";
import bcrypt from "bcryptjs";

// GET /api/admin/seed — create default admin (call once)
export async function GET() {
  try {
    await connectDB();

    const existing = await Admin.findOne({ email: "admin@gmail.com" });
    if (existing) {
      return NextResponse.json({ message: "Admin already exists" });
    }

    const hashedPassword = await bcrypt.hash("admin123", 10);

    await Admin.create({
      email: "admin@gmail.com",
      password: hashedPassword,
    });

    return NextResponse.json(
      { message: "Default admin created (admin@gmail.com / admin123)" },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to seed admin" },
      { status: 500 }
    );
  }
}
