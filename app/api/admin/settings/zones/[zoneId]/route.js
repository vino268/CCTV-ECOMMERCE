import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import StoreSettings from "@/models/StoreSettings";

const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export async function PUT(req, { params }) {
  try {
    await connectDB();
    const { zoneId } = params;
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
      { key: "default", "deliveryZones._id": zoneId },
      {
        $set: {
          "deliveryZones.$.name": zone.name,
          "deliveryZones.$.minDistance": zone.minDistance,
          "deliveryZones.$.maxDistance": zone.maxDistance,
          "deliveryZones.$.charge": zone.charge,
        },
      },
      { new: true }
    );

    if (!settings) {
      return NextResponse.json({ error: "Delivery zone not found" }, { status: 404 });
    }

    return NextResponse.json(settings.deliveryZones);
  } catch (error) {
    console.error("Error updating delivery zone:", error);
    return NextResponse.json(
      { error: "Failed to update delivery zone" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req, { params }) {
  try {
    await connectDB();
    const { zoneId } = params;

    const settings = await StoreSettings.findOneAndUpdate(
      { key: "default" },
      { $pull: { deliveryZones: { _id: zoneId } } },
      { new: true }
    );

    if (!settings) {
      return NextResponse.json({ error: "Settings not found" }, { status: 404 });
    }

    return NextResponse.json(settings.deliveryZones);
  } catch (error) {
    console.error("Error deleting delivery zone:", error);
    return NextResponse.json(
      { error: "Failed to delete delivery zone" },
      { status: 500 }
    );
  }
}
