import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";
import Order from "@/models/Order";
import User from "@/models/User";

function getDateRange(range) {
  const now = new Date();
  const end = new Date(now);
  const start = new Date(now);

  if (range === "today") {
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }

  const days = range === "30days" ? 30 : 7;
  start.setDate(now.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);

  return { start, end };
}

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "7days";
    const { start, end } = getDateRange(range);

    console.log("Dashboard: Fetching overview data for range:", range);

    const [totalProducts, totalOrders, totalCustomers, revenueAgg] = await Promise.all([
      Product.countDocuments().catch((err) => {
        console.error("Dashboard: countDocuments(Product) error:", err.message);
        return 0;
      }),
      Order.countDocuments().catch((err) => {
        console.error("Dashboard: countDocuments(Order) error:", err.message);
        return 0;
      }),
      User.countDocuments({ role: "user" }).catch((err) => {
        console.error("Dashboard: countDocuments(User) error:", err.message);
        return 0;
      }),
      Order.aggregate([
        { $match: { orderStatus: { $ne: "Cancelled" } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]).catch((err) => {
        console.error("Dashboard: revenue aggregate error:", err.message);
        return [{ total: 0 }];
      }),
    ]);

    const totalRevenue = revenueAgg?.[0]?.total || 0;

    console.log("Dashboard: Data retrieved -", {
      totalProducts,
      totalOrders,
      totalCustomers,
      totalRevenue,
    });

    return NextResponse.json({
      success: true,
      data: {
        totalProducts,
        totalOrders,
        totalCustomers,
        totalRevenue,
      },
    });
  } catch (error) {
    console.error("Dashboard API error:", error?.message || error);
    return NextResponse.json(
      {
        success: true,
        data: {
          totalProducts: 0,
          totalOrders: 0,
          totalCustomers: 0,
          totalRevenue: 0,
        },
      },
      { status: 200 }
    );
  }
}
