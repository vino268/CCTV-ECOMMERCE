import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import StoreSettings from "@/models/StoreSettings";

const DEFAULT_FOOTER = {
  description: "",
  facebook: "",
  twitter: "",
  instagram: "",
  linkedin: "",
  address: "",
  phone: "",
  email: "",
};

function normalizeFooter(payload = {}) {
  return {
    description: payload?.description ?? "",
    facebook: payload?.facebook ?? "",
    twitter: payload?.twitter ?? "",
    instagram: payload?.instagram ?? "",
    linkedin: payload?.linkedin ?? "",
    address: payload?.address ?? "",
    phone: payload?.phone ?? "",
    email: payload?.email ?? "",
  };
}

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    const settings = await StoreSettings.findOneAndUpdate(
      { key: "default" },
      {
        $set: { footer: normalizeFooter(body) },
        $setOnInsert: { key: "default" },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({
      ...DEFAULT_FOOTER,
      ...(settings?.footer || {}),
    });
  } catch (error) {
    console.error("Error saving footer settings:", error);
    return NextResponse.json(
      { error: "Failed to save footer settings" },
      { status: 500 }
    );
  }
}
