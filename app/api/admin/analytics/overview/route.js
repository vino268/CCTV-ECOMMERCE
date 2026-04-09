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
    return { start, end, previousStart: new Date(start.getTime() - 24 * 60 * 60 * 1000), previousEnd: new Date(start) };
  }

  const days = range === "30d" ? 30 : 7;
  start.setDate(now.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);

  const previousStart = new Date(start);
  previousStart.setDate(previousStart.getDate() - days);

  return {
    start,
    end,
    previousStart,
    previousEnd: new Date(start),
  };
}

function growthPercent(current, previous) {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }
  return ((current - previous) / previous) * 100;
}

function normalizeOrderStatus(status) {
  if (status === "Confirmed") return "Packed";
  if (status === "OutForDelivery") return "Out for Delivery";
  if (["Pending", "Ordered", "Packed", "Shipped", "Out for Delivery", "Delivered", "Cancelled"].includes(status)) return status;
  return "Ordered";
}

function toDateLabel(date) {
  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "7d";
    const { start, end, previousStart, previousEnd } = getDateRange(range);

    const [totalProducts, totalOrders, totalCustomers, totalRevenueAggregate] = await Promise.all([
      Product.countDocuments(),
      Order.countDocuments(),
      User.countDocuments({ role: "user" }),
      Order.aggregate([
        { $match: { orderStatus: { $ne: "Cancelled" } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
    ]);

    const [productCurrent, productPrevious, orderCurrent, orderPrevious, customerCurrent, customerPrevious, revenueCurrentAgg, revenuePreviousAgg] = await Promise.all([
      Product.countDocuments({ createdAt: { $gte: start, $lte: end } }),
      Product.countDocuments({ createdAt: { $gte: previousStart, $lt: previousEnd } }),
      Order.countDocuments({ createdAt: { $gte: start, $lte: end } }),
      Order.countDocuments({ createdAt: { $gte: previousStart, $lt: previousEnd } }),
      User.countDocuments({ role: "user", createdAt: { $gte: start, $lte: end } }),
      User.countDocuments({ role: "user", createdAt: { $gte: previousStart, $lt: previousEnd } }),
      Order.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end }, orderStatus: { $ne: "Cancelled" } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: previousStart, $lt: previousEnd }, orderStatus: { $ne: "Cancelled" } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
    ]);

    const revenueCurrent = revenueCurrentAgg[0]?.total || 0;
    const revenuePrevious = revenuePreviousAgg[0]?.total || 0;

    const dailyRevenueAgg = await Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end }, orderStatus: { $ne: "Cancelled" } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const revenueByDateMap = new Map(dailyRevenueAgg.map((row) => [row._id, row.revenue]));
    const revenueSeries = [];

    const cursor = new Date(start);
    while (cursor <= end) {
      const key = cursor.toISOString().slice(0, 10);
      revenueSeries.push({
        date: toDateLabel(cursor),
        revenue: revenueByDateMap.get(key) || 0,
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    const statusAgg = await Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: "$orderStatus", count: { $sum: 1 } } },
    ]);

    const statusAccumulator = {
      Ordered: 0,
      Shipped: 0,
      Delivered: 0,
      Cancelled: 0,
    };

    statusAgg.forEach((row) => {
      const normalized = normalizeOrderStatus(row._id);
      statusAccumulator[normalized] = (statusAccumulator[normalized] || 0) + row.count;
    });

    const ordersStatus = Object.entries(statusAccumulator).map(([status, count]) => ({ status, count }));

    const [latestOrders, latestCustomers] = await Promise.all([
      Order.find().sort({ createdAt: -1 }).limit(5).select("orderNumber customerName totalAmount orderStatus createdAt email"),
      User.find({ role: "user" }).sort({ createdAt: -1 }).limit(5).select("name email createdAt"),
    ]);

    return NextResponse.json({
      range,
      kpis: {
        totalProducts,
        totalOrders,
        totalCustomers,
        totalRevenue: totalRevenueAggregate[0]?.total || 0,
      },
      growth: {
        products: growthPercent(productCurrent, productPrevious),
        orders: growthPercent(orderCurrent, orderPrevious),
        customers: growthPercent(customerCurrent, customerPrevious),
        revenue: growthPercent(revenueCurrent, revenuePrevious),
      },
      charts: {
        revenue: revenueSeries,
        ordersStatus,
      },
      recent: {
        orders: latestOrders,
        customers: latestCustomers,
      },
    });
  } catch (error) {
    console.error("Admin analytics overview error:", error);
    return NextResponse.json(
      {
        range: "7d",
        kpis: {
          totalProducts: 0,
          totalOrders: 0,
          totalCustomers: 0,
          totalRevenue: 0,
        },
        growth: {
          products: 0,
          orders: 0,
          customers: 0,
          revenue: 0,
        },
        charts: {
          revenue: [],
          ordersStatus: [],
        },
        recent: {
          orders: [],
          customers: [],
        },
      },
      { status: 500 }
    );
  }
}
