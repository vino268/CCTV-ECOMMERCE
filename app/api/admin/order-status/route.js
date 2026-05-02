import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";

function normalizeOrderStatus(status) {
  if (status === "Confirmed") return "Packed";
  if (status === "OutForDelivery") return "Out for Delivery";
  if (["Pending", "Ordered", "Packed", "Shipped", "Out for Delivery", "Delivered", "Cancelled"].includes(status)) return status;
  return "Ordered";
}

export async function GET(req) {
  try {
    await connectDB();

    console.log('OrderStatus: Fetching order status distribution');

    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || '7days';
    // IST-aware range function
    function getDateRange(range) {
      const now = new Date();
      const IST_OFFSET = 5.5 * 60 * 60 * 1000;
      const nowIST = new Date(now.getTime() + IST_OFFSET);

      let startDate = new Date(nowIST);
      if (range === 'today') {
        startDate.setHours(0, 0, 0, 0);
      } else if (range === '30days') {
        startDate.setDate(startDate.getDate() - 29);
        startDate.setHours(0, 0, 0, 0);
      } else {
        startDate.setDate(startDate.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
      }

      const startUTC = new Date(startDate.getTime() - IST_OFFSET);
      const endUTC = new Date(nowIST.getTime() - IST_OFFSET);
      return { startUTC, endUTC };
    }

    const { startUTC, endUTC } = getDateRange(range);

    const results = await Order.aggregate([
      { $match: { isDeleted: false, createdAt: { $gte: startUTC, $lte: endUTC } } },
      {
        $group: {
          _id: "$orderStatus",
          count: { $sum: 1 },
        },
      },
    ]).catch((err) => {
      console.error('OrderStatus: aggregate error:', err.message);
      return [];
    });

    console.log("OrderStatus: Aggregation returned", results.length, "statuses");

    // Initialize with all possible statuses
    const statusMap = {
      ordered: 0,
      packed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };

    // Accumulate counts from results
    results.forEach((row) => {
      const normalized = normalizeOrderStatus(row._id)?.toLowerCase();
      if (statusMap.hasOwnProperty(normalized)) {
        statusMap[normalized] += row.count;
      }
    });

    console.log("OrderStatus: Distribution:", statusMap);

    return NextResponse.json({
      success: true,
      ordered: statusMap.ordered,
      packed: statusMap.packed,
      shipped: statusMap.shipped,
      delivered: statusMap.delivered,
      cancelled: statusMap.cancelled,
    });
  } catch (error) {
    console.error("OrderStatus API error:", error?.message || error);
    return NextResponse.json(
      {
        success: true,
        ordered: 0,
        packed: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
      },
      { status: 200 }
    );
  }
}
