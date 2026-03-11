import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Settings from "@/models/Settings";

const DEFAULT_PAYMENT_SETTINGS = {
  cashOnDelivery: true,
  upi: true,
  onlinePayment: true,
};

function normalizePaymentSettings(payload = {}) {
  return {
    cashOnDelivery: Boolean(payload.cashOnDelivery),
    upi: Boolean(payload.upi),
    onlinePayment: Boolean(payload.onlinePayment),
  };
}

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const update = normalizePaymentSettings(body);

    const settings = await Settings.findOneAndUpdate(
      {},
      { $set: update },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error saving payment settings:", error);
    return NextResponse.json(
      { error: "Failed to save payment settings" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectDB();
    const settings = await Settings.findOne();

    if (!settings) {
      return NextResponse.json(DEFAULT_PAYMENT_SETTINGS);
    }

    return NextResponse.json(normalizePaymentSettings(settings));
  } catch (error) {
    console.error("Error fetching admin payment settings:", error);
    return NextResponse.json(DEFAULT_PAYMENT_SETTINGS);
  }
}
