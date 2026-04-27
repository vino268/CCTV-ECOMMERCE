import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Order from "@/models/Order";
import { adminAuthError, verifyAdmin } from "@/app/api/admin/_helpers";

export async function GET(req) {
  try {
    console.log("[admin/customers] route hit");

    const auth = await verifyAdmin(req);
    if (!auth.ok) return adminAuthError(auth);

    await connectDB();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const status = (searchParams.get("status") || "all").toLowerCase();

    const roleFilter = {
      $or: [
        { role: "user" },
        { role: { $exists: false } },
        { role: null },
        { role: "" },
      ],
    };
    const query = {
      $and: [roleFilter],
    };

    if (status === "active") {
      query.$and.push({ isDeleted: false });
    } else if (status === "deleted") {
      query.$and.push({ isDeleted: true });
    }

    if (search) {
      // Escape special regex characters to prevent injection
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$and.push({
        $or: [
          { name:    { $regex: escaped, $options: "i" } },
          { email:   { $regex: escaped, $options: "i" } },
          { phone:   { $regex: escaped, $options: "i" } },
          { address: { $regex: escaped, $options: "i" } },
        ],
      });
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
      const statusValue =
        typeof user.status === "string" && user.status.trim()
          ? user.status
          : user.isDeleted
            ? "deleted"
            : user.isBlocked
              ? "blocked"
              : "active";

      return {
        _id: String(user._id),
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        createdAt: user.createdAt,
        status: statusValue,
        isBlocked: !!user.isBlocked,
        isDeleted: !!user.isDeleted,
        deletedAt: user.deletedAt || null,
        address: user.address || "",
        totalOrders: stats?.totalOrders || 0,
        totalSpent: stats?.totalSpent || 0,
      };
    });

    console.log(`[admin/customers] fetched count: ${enrichedUsers.length}`);

    return NextResponse.json({
      success: true,
      customers: enrichedUsers,
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}
