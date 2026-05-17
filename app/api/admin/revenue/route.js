import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";

function toDateLabel(date) {
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

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

    const dataMap = {};
    const cursor = new Date(startDate);
    const endDate = new Date();
    
    while (cursor <= endDate) {
      const label = toDateLabel(cursor);
      dataMap[label] = 0;
      cursor.setDate(cursor.getDate() + 1);
    }

    deliveredOrders.forEach(order => {
      if(order.createdAt) {
        const orderDate = new Date(order.createdAt);
        const label = toDateLabel(orderDate);
        if (dataMap[label] !== undefined) {
           dataMap[label] += Number(order.totalAmount || 0);
        }
      }
    });

    const data = Object.keys(dataMap).map(label => ({
      label,
      amount: dataMap[label]
    }));

    const totalRevenue = deliveredOrders.reduce(
      (sum, order) => sum + Number(order.totalAmount || 0),
      0
    );

    return NextResponse.json({
      success: true,
      filter,
      total: totalRevenue,
      totalRevenue,
      data,
      daily: data,
      revenueData: data.map((item) => ({ date: item.label, revenue: item.amount })),
    });

  } catch (error) {
    console.error("Revenue analytics error:", error);
    return NextResponse.json(
      { success: false, totalRevenue: 0, data: [] },
      { status: 500 }
    );
  }
}
