import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import Notification from "@/models/Notification";
import SiteSettings from "@/models/SiteSettings";

// GET /api/orders — return all orders
export async function GET() {
  try {
    await connectDB();
    const orders = await Order.find().sort({ createdAt: -1 });
    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

// POST /api/orders — create new order
export async function POST(req) {
  try {
    await connectDB();
    const data = await req.json();

    const products = Array.isArray(data.products) ? data.products : [];
    const subtotal = products.reduce(
      (sum, item) =>
        sum + (Number(item.productPrice) || 0) * (Number(item.quantity) || 0),
      0
    );
    const shippingCost = subtotal > 100 ? 0 : 9.99;

    const settings = await SiteSettings.findOne().select("taxPercentage");
    const parsedTaxRate = Number(settings?.taxPercentage);
    const taxRate = Number.isFinite(parsedTaxRate) ? parsedTaxRate : 0;
    const tax = (subtotal * taxRate) / 100;
    const totalAmount = parseFloat((subtotal + shippingCost + tax).toFixed(2));

    const order = await Order.create({
      ...data,
      totalAmount,
    });

    // Create admin notification for the new order
    await Notification.create({
      type: "order",
      message: `New order placed by ${order.customerName}`,
      orderId: order.orderNumber,
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
