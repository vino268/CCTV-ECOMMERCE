import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";

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

    const orderStatus = {
      pending: filteredOrders.filter(o => o.status === "Pending" || o.orderStatus === "Pending" || o.trackingStatus === "Pending").length,
      shipped: filteredOrders.filter(o => o.status === "Shipped" || o.orderStatus === "Shipped" || o.trackingStatus === "Shipped").length,
      delivered: filteredOrders.filter(o => o.status === "Delivered" || o.orderStatus === "Delivered" || o.trackingStatus === "Delivered").length,
      cancelled: filteredOrders.filter(o => o.status === "Cancelled" || o.orderStatus === "Cancelled" || o.trackingStatus === "Cancelled").length
    };

    return NextResponse.json({
      success: true,
      pending: orderStatus.pending,
      shipped: orderStatus.shipped,
      delivered: orderStatus.delivered,
      cancelled: orderStatus.cancelled,
      orderStatus
    });

  } catch (error) {
    console.error("OrderStatus API error:", error);
    return NextResponse.json(
      { success: false, orderStatus: { pending: 0, shipped: 0, delivered: 0, cancelled: 0 } },
      { status: 500 }
    );
  }
}
