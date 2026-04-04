import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Order from "@/models/Order";

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const status = (searchParams.get("status") || "all").toLowerCase();

    const query = { role: "user" };

    if (status === "active") {
      query.isDeleted = false;
    } else if (status === "deleted") {
      query.isDeleted = true;
    }

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

    const usersByEmail = new Map();
    users.forEach((user) => {
      usersByEmail.set(String(user.email || "").toLowerCase(), user);
    });

    const emails = [...usersByEmail.keys()].filter(Boolean);
    let statsByEmail = new Map();

    if (emails.length > 0) {
      const orderStats = await Order.aggregate([
        {
          $match: {
            isDeleted: false,
            email: { $in: emails },
          },
        },
        {
          $group: {
            _id: "$email",
            totalOrders: { $sum: 1 },
            totalSpent: { $sum: "$totalAmount" },
          },
        },
      ]);

      statsByEmail = new Map(
        orderStats.map((item) => [String(item._id || "").toLowerCase(), item])
      );
    }

    const enrichedUsers = users.map((user) => {
      const key = String(user.email || "").toLowerCase();
      const stats = statsByEmail.get(key);

      return {
        ...user.toObject(),
        totalOrders: stats?.totalOrders || 0,
        totalSpent: stats?.totalSpent || 0,
      };
    });

    return NextResponse.json(enrichedUsers);
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { message: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}
