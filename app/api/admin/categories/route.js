import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Category from "@/models/Category";
import { verifyAuthSession } from "@/lib/auth-session";

export async function POST(req) {
  try {
    const auth = await verifyAuthSession(req, "admin");
    if (!auth.ok) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { name } = await req.json();

    if (!name || name.trim() === "") {
      return NextResponse.json({ message: "Name required" }, { status: 400 });
    }

    const normalizedName = name.trim();
    const exists = await Category.findOne({ 
      name: { $regex: new RegExp(`^${normalizedName}$`, "i") } 
    });
    
    if (exists) {
      return NextResponse.json({ message: "Category already exists" }, { status: 400 });
    }

    const category = await Category.create({ name: normalizedName });

    return NextResponse.json({ success: true, category });
  } catch (error) {
    console.error("POST /api/admin/categories error:", error);
    return NextResponse.json({ message: "Failed to create category" }, { status: 500 });
  }
}
