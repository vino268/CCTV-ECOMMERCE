import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email")?.toLowerCase().trim();

    if (!email) {
      return NextResponse.json(
        { blocked: false, error: "Email is required" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email }).select("isBlocked");

    if (!user) {
      return NextResponse.json({ blocked: false, exists: false }, { status: 404 });
    }

    return NextResponse.json({ blocked: !!user.isBlocked, exists: true });
  } catch (error) {
    return NextResponse.json(
      { blocked: false, error: "Failed to verify user status" },
      { status: 500 }
    );
  }
}
