import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";

    const query = { role: "user" };

    if (search) {
      // Escape special regex characters to prevent injection
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { name:    { $regex: escaped, $options: "i" } },
        { email:   { $regex: escaped, $options: "i" } },
        { phone:   { $regex: escaped, $options: "i" } },
        { address: { $regex: escaped, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .select("-password");

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { message: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}
