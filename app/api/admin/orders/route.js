import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";

// GET /api/admin/orders — return all orders with optional search
export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";

    let query = {};

    if (search) {
      // Escape special regex characters to prevent ReDoS / injection
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { orderNumber:  { $regex: escaped, $options: "i" } },
        { customerName: { $regex: escaped, $options: "i" } },
        { email:        { $regex: escaped, $options: "i" } },
        { orderStatus:  { $regex: escaped, $options: "i" } },
      ];
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { message: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
