import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";

function getDateRange(range) {
  const now = new Date();
  const end = new Date(now);
  const start = new Date(now);

  if (range === "today") {
    start.setHours(0, 0, 0, 0);
    return { start, end, days: 0 };
  }

  const days = range === "30days" ? 30 : 7;
  start.setDate(now.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);

  return { start, end, days };
}

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "7days";
    const { start, end, days } = getDateRange(range);

    console.log("Revenue: Fetching revenue data for range:", range);

    const results = await Order.aggregate([
      {
        $match: {
          orderStatus: "Delivered",
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          revenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { _id: 1 } },
    ]).catch((err) => {
      console.error("Revenue: aggregate error:", err.message);
      return [];
    });

    console.log("Revenue: Aggregation returned", results.length, "rows");

    // Build array for date range, filling zeros for missing days
    const data = [];
    let currentDate = new Date(start);

    while (currentDate <= end) {
      const key = currentDate.toISOString().slice(0, 10);
      const label = currentDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      const found = results.find((r) => r._id === key);
      data.push({ date: label, revenue: found ? found.revenue : 0 });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    const total = data.reduce((sum, row) => sum + row.revenue, 0);

    console.log("Revenue: Returning data with total:", total);

    return NextResponse.json({
      success: true,
      total,
      data,
    });
  } catch (error) {
    console.error("Revenue API error:", error?.message || error);
    return NextResponse.json(
      {
        success: true,
        total: 0,
        data: [],
      },
      { status: 200 }
    );
  }
}
