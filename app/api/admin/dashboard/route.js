import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";
import Order from "@/models/Order";
import User from "@/models/User";

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || searchParams.get("range") || "today";
    const now = new Date();
    let startDate = new Date();

    if (filter === "today") {
      startDate.setHours(0,0,0,0);
    } else if (filter === "7days") {
      startDate.setDate(now.getDate() - 7);
    } else {
      startDate.setDate(now.getDate() - 30);
    }

    console.log("START DATE:", startDate);

    const allOrders = await Order.find({});
    console.log("ALL DATABASE ORDERS:", allOrders.length);

    const filteredOrders = allOrders.filter((order) => {
      if (!order.createdAt) return false;
      return new Date(order.createdAt) >= startDate;
    });

    console.log("FILTERED ORDERS:", filteredOrders.length);

    const deliveredOrders = filteredOrders.filter(
      order => order.status === "Delivered" || order.orderStatus === "Delivered" || order.trackingStatus === "Delivered"
    );

    const totalRevenue = deliveredOrders.reduce(
      (sum, order) => sum + Number(order.totalAmount || 0),
      0
    );

    const pendingCount = filteredOrders.filter(o => o.status === "Pending" || o.orderStatus === "Pending" || o.trackingStatus === "Pending").length;
    const shippedCount = filteredOrders.filter(o => o.status === "Shipped" || o.orderStatus === "Shipped" || o.trackingStatus === "Shipped").length;
    const cancelledCount = filteredOrders.filter(o => o.status === "Cancelled" || o.orderStatus === "Cancelled" || o.trackingStatus === "Cancelled").length;

    return NextResponse.json({
      success: true,
      totalProducts: await Product.countDocuments(),
      totalCustomers: await User.countDocuments(),
      totalOrders: filteredOrders.length,
      totalRevenue,
      orderStatus: {
        pending: pendingCount,
        shipped: shippedCount,
        delivered: deliveredOrders.length,
        cancelled: cancelledCount
      }
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
