import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";
import Order from "@/models/Order";
import User from "@/models/User";

function getDateRange(range) {
  const now = new Date();

  // IST offset in milliseconds (+5:30)
  const IST_OFFSET = 5.5 * 60 * 60 * 1000;
  const nowIST = new Date(now.getTime() + IST_OFFSET);

  let startDate = new Date(nowIST);

  if (range === 'today') {
    startDate.setHours(0, 0, 0, 0);
  } else if (range === '30days') {
    startDate.setDate(startDate.getDate() - 29);
    startDate.setHours(0, 0, 0, 0);
  } else {
    // default last 7 days (6 days back + today)
    startDate.setDate(startDate.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);
  }

  // Convert back to UTC for MongoDB comparisons
  const startUTC = new Date(startDate.getTime() - IST_OFFSET);
  const endUTC = new Date(nowIST.getTime() - IST_OFFSET);

  return { startUTC, endUTC };
}

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || '7days';
    const { startUTC, endUTC } = getDateRange(range);

    const filter = {
      isDeleted: false,
      createdAt: { $gte: startUTC, $lte: endUTC },
    };

    console.log("Dashboard: Fetching overview data for range:", range);
    console.log("Dashboard: Filter:", filter);

    const orders = await Order.find(filter).select("status paymentStatus totalAmount createdAt orderStatus trackingStatus");
    const totalOrders = orders.length;
    const deliveredOrders = orders.filter(
      (o) =>
        String(o.status || o.orderStatus || o.trackingStatus || "").toLowerCase() === "delivered"
    ).length;
    const totalRevenue = orders
      .filter(
        (o) =>
          String(o.paymentStatus || "").toLowerCase() === "paid" ||
          String(o.status || o.orderStatus || o.trackingStatus || "").toLowerCase() === "delivered"
      )
      .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

    console.log("Dashboard: Filtered Orders:", orders.map((o) => ({
      id: o._id,
      totalAmount: o.totalAmount,
      status: o.status,
      orderStatus: o.orderStatus,
      trackingStatus: o.trackingStatus,
      paymentStatus: o.paymentStatus,
      createdAt: o.createdAt,
    })));
    console.log("Dashboard: Total Orders:", totalOrders);
    console.log("Dashboard: Delivered Orders:", deliveredOrders);
    console.log("Dashboard: Total Revenue:", totalRevenue);

    const [totalProducts, totalCustomers] = await Promise.all([
      Product.countDocuments({ createdAt: { $gte: startUTC, $lte: endUTC } }).catch((err) => {
        console.error("Dashboard: countDocuments(Product) error:", err.message);
        return 0;
      }),
      User.countDocuments({ role: "user" }).catch((err) => {
        console.error("Dashboard: countDocuments(User) error:", err.message);
        return 0;
      }),
    ]);

    console.log("Dashboard: Data retrieved -", {
      totalProducts,
      totalOrders,
      totalCustomers,
      totalRevenue,
      deliveredOrders,
    });

    return NextResponse.json({
      success: true,
      data: {
        totalProducts,
        totalOrders,
        totalCustomers,
        totalRevenue,
        deliveredOrders,
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
