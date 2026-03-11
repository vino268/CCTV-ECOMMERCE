import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import StoreSettings from "@/models/StoreSettings";

const DEFAULT_SETTINGS = {
  key: "default",
  storeInformation: {
    storeName: "",
    phoneNumber: "",
    email: "",
    businessAddress: "",
  },
  shippingSettings: {
    freeShippingThreshold: 0,
    standardShippingCost: 0,
  },
  paymentSettings: {
    cashOnDelivery: true,
    upi: true,
    onlinePayment: true,
  },
  footer: {
    description: "",
    facebook: "",
    twitter: "",
    instagram: "",
    linkedin: "",
    address: "",
    phone: "",
    email: "",
  },
  maintenanceMode: {
    enabled: false,
  },
};

const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

async function getOrCreateSettings() {
  return StoreSettings.findOneAndUpdate(
    { key: "default" },
    { $setOnInsert: DEFAULT_SETTINGS },
    { new: true, upsert: true }
  );
}

export async function GET(req) {
  try {
    await connectDB();
    const settings = await getOrCreateSettings();

    const { searchParams } = new URL(req.url);
    const scope = searchParams.get("scope");

    if (scope === "public") {
      return NextResponse.json({
        maintenanceMode: { enabled: Boolean(settings.maintenanceMode?.enabled) },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    await connectDB();
    const payload = await req.json();

    const update = {
      storeInformation: {
        storeName: payload?.storeInformation?.storeName ?? "",
        phoneNumber: payload?.storeInformation?.phoneNumber ?? "",
        email: payload?.storeInformation?.email ?? "",
        businessAddress: payload?.storeInformation?.businessAddress ?? "",
      },
      shippingSettings: {
        freeShippingThreshold: toNumber(
          payload?.shippingSettings?.freeShippingThreshold,
          0
        ),
        standardShippingCost: toNumber(
          payload?.shippingSettings?.standardShippingCost,
          0
        ),
      },
      paymentSettings: {
        cashOnDelivery: Boolean(payload?.paymentSettings?.cashOnDelivery),
        upi: Boolean(payload?.paymentSettings?.upi),
        onlinePayment: Boolean(payload?.paymentSettings?.onlinePayment),
      },
      footer: {
        description: payload?.footer?.description ?? "",
        facebook: payload?.footer?.facebook ?? "",
        twitter: payload?.footer?.twitter ?? "",
        instagram: payload?.footer?.instagram ?? "",
        linkedin: payload?.footer?.linkedin ?? "",
        address: payload?.footer?.address ?? "",
        phone: payload?.footer?.phone ?? "",
        email: payload?.footer?.email ?? "",
      },
      maintenanceMode: {
        enabled: Boolean(payload?.maintenanceMode?.enabled),
      },
    };

    const settings = await StoreSettings.findOneAndUpdate(
      { key: "default" },
      { $set: update, $setOnInsert: { key: "default" } },
      { new: true, upsert: true }
    );

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error saving settings:", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}
