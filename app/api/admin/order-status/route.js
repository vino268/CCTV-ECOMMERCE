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

    console.log("OrderStatus: Fetching order status distribution");

    const results = await Order.aggregate([
      {
        $group: {
          _id: "$orderStatus",
          count: { $sum: 1 },
        },
      },
    ]).catch((err) => {
      console.error("OrderStatus: aggregate error:", err.message);
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
