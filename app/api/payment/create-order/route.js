import { NextResponse } from "next/server";
import razorpay from "@/lib/razorpay";

export async function POST(req) {
  try {
    const body = await req.json();
    const amount = Number(body?.amount || 0);

    console.log("RAZORPAY KEY:", process.env.RAZORPAY_KEY_ID);
    console.log("RAZORPAY SECRET EXISTS:", !!process.env.RAZORPAY_KEY_SECRET);

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid amount is required",
        },
        { status: 400 }
      );
    }

    if (!String(process.env.RAZORPAY_KEY_ID || "").startsWith("rzp_test_")) {
      return NextResponse.json(
        {
          success: false,
          message: "Only Razorpay TEST mode is enabled",
        },
        { status: 400 }
      );
    }

    const options = {
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Create Razorpay order failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create order",
      },
      { status: 500 }
    );
  }
}
