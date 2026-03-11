import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import StoreSettings from "@/models/StoreSettings";

const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export async function POST(req) {
  try {
    await connectDB();
    const payload = await req.json();

    const zone = {
      name: String(payload?.name || "").trim(),
      minDistance: toNumber(payload?.minDistance, 0),
      maxDistance: toNumber(payload?.maxDistance, 0),
      charge: toNumber(payload?.charge, 0),
    };

    if (!zone.name) {
      return NextResponse.json({ error: "Zone name is required" }, { status: 400 });
    }

    if (zone.maxDistance < zone.minDistance) {
      return NextResponse.json(
        { error: "Max distance must be greater than or equal to min distance" },
        { status: 400 }
      );
    }

    const settings = await StoreSettings.findOneAndUpdate(
      { key: "default" },
      {
        $setOnInsert: { key: "default" },
        $push: { deliveryZones: zone },
      },
      { new: true, upsert: true }
    );

    return NextResponse.json(settings.deliveryZones, { status: 201 });
  } catch (error) {
    console.error("Error adding delivery zone:", error);
    return NextResponse.json(
      { error: "Failed to add delivery zone" },
      { status: 500 }
    );
  }
}
