import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(req) {
  try {
    await connectDB();

    console.log("LatestCustomers: Fetching latest 5 customers");

    const customers = await User.find({ role: "user" })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name email createdAt")
      .catch((err) => {
        console.error("LatestCustomers: find error:", err.message);
        return [];
      });

    console.log("LatestCustomers: Found", customers.length, "customers");

    return NextResponse.json({
      success: true,
      users: customers.map((user) => ({
        _id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      })),
    });
  } catch (error) {
    console.error("LatestCustomers API error:", error?.message || error);
    return NextResponse.json(
      {
        success: true,
        users: [],
      },
      { status: 200 }
    );
  }
}
