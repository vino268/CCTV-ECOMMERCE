import dotenv from "dotenv";
import { NextResponse } from "next/server";
import getRazorpayClient from "../../../../lib/razorpay";

dotenv.config();

export async function POST(req) {
  try {
    console.log("RAZORPAY_KEY_ID:", process.env.RAZORPAY_KEY_ID ? "FOUND" : "MISSING");
    console.log("RAZORPAY_KEY_SECRET:", process.env.RAZORPAY_KEY_SECRET ? "FOUND" : "MISSING");

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        {
          success: false,
          message: "Razorpay environment variables are missing.",
        },
        { status: 500 }
      );
    }

    const razorpay = getRazorpayClient();

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
