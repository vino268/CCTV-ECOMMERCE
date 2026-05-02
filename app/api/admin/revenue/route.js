import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";

const IST_OFFSET = 5.5 * 60 * 60 * 1000;

function getDateRange(range) {
  const now = new Date();
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

function toISTKey(date) {
  const istDate = new Date(date.getTime() + IST_OFFSET);
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(istDate.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getExpectedDays(range) {
  if (range === "today") return 1;
  if (range === "30days") return 30;
  return 7;
}

function getDailySeries(range) {
  const now = new Date();
  const nowIST = new Date(now.getTime() + IST_OFFSET);
  nowIST.setUTCHours(0, 0, 0, 0);

  const totalDays = getExpectedDays(range);
  const days = [];

  for (let i = totalDays - 1; i >= 0; i -= 1) {
    const current = new Date(nowIST);
    current.setUTCDate(current.getUTCDate() - i);

    const key = toISTKey(new Date(current.getTime() - IST_OFFSET));
    const label =
      range === "today"
        ? "Today"
        : range === "30days"
        ? current.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
        : current.toLocaleDateString("en-IN", { weekday: "short" });

    days.push({ key, label, amount: 0 });
  }

  return days;
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
      $or: [
        { paymentStatus: 'Paid' },
        { status: 'Delivered' },
      ],
    };

    console.log("Revenue Filter:", filter);
    console.log("Matched Orders:", await Order.find(filter));

    // Aggregate revenue grouped by IST day
    const grouped = await Order.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" } },
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { _id: 1 } },
    ]).catch((err) => {
      console.error("Revenue: aggregate error:", err.message);
      return [];
    });

    const totalsByDay = new Map(
      Array.isArray(grouped)
        ? grouped.map((item) => [String(item._id), Number(item.totalRevenue || 0)])
        : []
    );

    const daily = getDailySeries(range).map((day) => ({
      label: day.label,
      amount: totalsByDay.get(day.key) || 0,
    }));

    const total = daily.reduce((sum, day) => sum + Number(day.amount || 0), 0);

    console.log("Revenue: Aggregation returned", grouped.length, "rows");

    return NextResponse.json({
      success: true,
      total,
      data: daily,
      daily,
      // keep compatibility for existing consumers
      totalRevenue: total,
      revenueData: daily.map((day) => ({
        date: day.label,
        amount: day.amount,
        revenue: day.amount,
      })),
    });
  } catch (error) {
    console.error("Revenue API error:", error?.message || error);
    return NextResponse.json(
      {
        success: true,
        total: 0,
        data: [],
        daily: [],
      },
      { status: 200 }
    );
  }
}
