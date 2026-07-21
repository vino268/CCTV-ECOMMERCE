import dotenv from "dotenv";
import { NextResponse } from "next/server";

dotenv.config();

export async function POST(req) {
  try {
    console.log("========== RAZORPAY DEBUG ==========");
    console.log("KEY ID:", process.env.RAZORPAY_KEY_ID);
    console.log("KEY SECRET:", process.env.RAZORPAY_KEY_SECRET ? "Loaded" : "Missing");
    console.log("====================================");

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        {
          success: false,
          message: "Razorpay environment variables are missing",
        },
        { status: 500 }
      );
    }

    const { default: razorpay } = await import("../../../../lib/razorpay");

    const body = await req.json();

    const amount = Number(body?.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid amount is required",
        },
        { status: 400 }
      );
    }

    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json(order);
  } catch (error) {
    console.log("RAZORPAY ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to create order",
      },
      { status: 500 }
    );
  }
}
