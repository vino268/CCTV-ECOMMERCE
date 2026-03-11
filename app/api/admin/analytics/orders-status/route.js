import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";

export async function GET() {
  try {
    await connectDB();

    const results = await Order.aggregate([
      {
        $group: {
          _id: "$orderStatus",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const data = results.map((r) => ({
      status: r._id,
      count: r.count,
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error("Orders status analytics error:", error);
    return NextResponse.json([], { status: 500 });
  }
}
