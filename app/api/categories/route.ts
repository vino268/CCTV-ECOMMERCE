import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Category from "@/models/Category";

export async function GET() {
  try {
    await connectDB();
    const categories = await Category.find().sort({ createdAt: -1 });
    return NextResponse.json(categories);
  } catch {
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const { name } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name required" }, { status: 400 });
    }

    const normalizedName = name.trim();
    const existing = await Category.findOne({
      name: { $regex: new RegExp(`^${normalizedName}$`, "i") },
    });

    if (existing) {
      return NextResponse.json({ error: "Category already exists" }, { status: 400 });
    }

    const category = await Category.create({ name: normalizedName });
    return NextResponse.json(category);
  } catch {
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
