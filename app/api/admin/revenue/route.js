import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";

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

function toDateLabel(date) {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function toDayKey(date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || searchParams.get("range") || "today";

    const { startDate, endDate } = getRangeBounds(filter);
    const query = {
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
      isDeleted: { $ne: true },
      paymentStatus: "Paid",
    };

    const paidOrders = await Order.find(query);

    const dataMap = {};
    const cursor = new Date(startDate);
    
    while (cursor <= endDate) {
      const label = toDateLabel(cursor);
      dataMap[toDayKey(cursor)] = { label, amount: 0 };
      cursor.setDate(cursor.getDate() + 1);
    }

    paidOrders.forEach(order => {
      if(order.createdAt) {
        const orderDate = new Date(order.createdAt);
        const key = toDayKey(orderDate);
        if (dataMap[key] !== undefined) {
           dataMap[key].amount += Number(order.totalAmount || 0);
        }
      }
    });

    const data = Object.values(dataMap);

    const totalRevenue = paidOrders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);

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
