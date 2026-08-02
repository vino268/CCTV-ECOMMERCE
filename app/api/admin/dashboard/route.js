import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";
import Order from "@/models/Order";
import User from "@/models/User";

const IST_OFFSET_MINUTES = 330;
const IST_OFFSET_MS = IST_OFFSET_MINUTES * 60 * 1000;

function getRangeBounds(filter) {
  const now = new Date();
  const nowIST = new Date(now.getTime() + IST_OFFSET_MS);

  if (filter === "today") {
    const startIST = new Date(nowIST);
    const endIST = new Date(nowIST);
    startIST.setHours(0, 0, 0, 0);
    endIST.setHours(23, 59, 59, 999);
    return {
      startDate: new Date(startIST.getTime() - IST_OFFSET_MS),
      endDate: new Date(endIST.getTime() - IST_OFFSET_MS),
    };
  }

  const startIST = new Date(nowIST);
  const endIST = new Date(nowIST);
  if (filter === "7days") {
    startIST.setDate(startIST.getDate() - 6);
  } else {
    startIST.setDate(startIST.getDate() - 29);
  }
  startIST.setHours(0, 0, 0, 0);
  endIST.setHours(23, 59, 59, 999);

  return {
    startDate: new Date(startIST.getTime() - IST_OFFSET_MS),
    endDate: new Date(endIST.getTime() - IST_OFFSET_MS),
  };
}

function normalizeStatus(order) {
  const value = String(order?.status || order?.orderStatus || order?.trackingStatus || "").trim().toLowerCase();

  if (value === "packed" || value === "processing" || value === "confirmed") return "Processing";
  if (value === "ordered" || value === "pending") return "Ordered";
  if (value === "shipped") return "Shipped";
  if (value === "delivered") return "Delivered";
  if (value === "cancelled") return "Cancelled";
  return "Ordered";
}

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || searchParams.get("range") || "today";

    const { startDate, endDate } = getRangeBounds(filter);
    const dateQuery = {
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
    };

    const activeOrderQuery = {
      ...dateQuery,
      isDeleted: { $ne: true },
    };

    const [allOrders, paidOrders] = await Promise.all([
      Order.find(activeOrderQuery),
      Order.find({
        ...activeOrderQuery,
        paymentStatus: "Paid",
      }),
    ]);

    const totalRevenue = paidOrders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);

    const statusCounts = allOrders.reduce(
      (acc, order) => {
        const normalized = normalizeStatus(order);
        if (normalized === "Ordered") acc.ordered += 1;
        if (normalized === "Processing") acc.processing += 1;
        if (normalized === "Shipped") acc.shipped += 1;
        if (normalized === "Delivered") acc.delivered += 1;
        if (normalized === "Cancelled") acc.cancelled += 1;
        return acc;
      },
      { ordered: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 }
    );

    return NextResponse.json({
      success: true,
      totalProducts: await Product.countDocuments(),
      totalCustomers: await User.countDocuments(),
      totalOrders: allOrders.length,
      totalRevenue,
      orderStatus: {
        ordered: statusCounts.ordered,
        processing: statusCounts.processing,
        shipped: statusCounts.shipped,
        delivered: statusCounts.delivered,
        cancelled: statusCounts.cancelled,
        pending: statusCounts.ordered,
      },
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      {
        success: false,
        totalProducts: 0,
        totalOrders: 0,
        totalCustomers: 0,
        totalRevenue: 0,
        orderStatus: {
          pending: 0,
          shipped: 0,
          delivered: 0,
          cancelled: 0,
        },
      },
      { status: 500 }
    );
  }
}
