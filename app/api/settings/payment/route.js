import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Settings from "@/models/Settings";

const DEFAULT_PAYMENT_SETTINGS = {
  cashOnDelivery: true,
  upi: true,
  onlinePayment: true,
};

async function getPaymentSettings() {
  try {
    await connectDB();

    const settings = await Settings.findOneAndUpdate(
      {},
      { $setOnInsert: DEFAULT_PAYMENT_SETTINGS },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return {
      cashOnDelivery: Boolean(settings?.cashOnDelivery),
      upi: Boolean(settings?.upi),
      onlinePayment: Boolean(settings?.onlinePayment),
    };
  } catch (error) {
    console.error("Error fetching payment settings:", error);
    return DEFAULT_PAYMENT_SETTINGS;
  }
}

export async function GET() {
  try {
    const paymentSettings = await getPaymentSettings();
    return NextResponse.json(paymentSettings);
  } catch (error) {
    console.error("Error in payment settings API:", error);
    return NextResponse.json(
      DEFAULT_PAYMENT_SETTINGS,
      { status: 200 } // Return defaults even on error
    );
  }
}
