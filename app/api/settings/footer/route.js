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

export async function GET() {
  try {
    await connectDB();
    const settings = await StoreSettings.findOneAndUpdate(
      { key: "default" },
      { $setOnInsert: { key: "default", footer: DEFAULT_FOOTER } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({
      ...DEFAULT_FOOTER,
      ...(settings?.footer || {}),
    });
  } catch (error) {
    console.error("Error fetching footer settings:", error);
    return NextResponse.json(DEFAULT_FOOTER);
  }
}
