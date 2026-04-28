import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";

export async function GET(req) {
  try {
    await connectDB();

    console.log("LatestOrders: Fetching latest 5 orders");

    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("orderId orderNumber customerName totalAmount orderStatus createdAt email")
      .catch((err) => {
        console.error("LatestOrders: find error:", err.message);
        return [];
      });

    console.log("LatestOrders: Found", orders.length, "orders");

    return NextResponse.json({
      success: true,
      orders: orders.map((order) => ({
        _id: order._id,
        orderId: order.orderId || order.orderNumber,
        orderNumber: order.orderNumber || order.orderId,
        customerName: order.customerName,
        email: order.email,
        totalAmount: order.totalAmount,
        orderStatus: order.orderStatus,
        createdAt: order.createdAt,
      })),
    });
  } catch (error) {
    console.error("LatestOrders API error:", error?.message || error);
    return NextResponse.json(
      {
        success: true,
        orders: [],
      },
      { status: 200 }
    );
  }
}
