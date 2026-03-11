import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import StoreSettings from "@/models/StoreSettings";
import { googleMapsClient, requireGoogleMapsApiKey } from "@/lib/google-maps";

const roundTo2 = (value) => Math.round(value * 100) / 100;

export async function POST(req) {
  try {
    const { customerLat, customerLng } = await req.json();

    if (
      typeof customerLat !== "number" ||
      Number.isNaN(customerLat) ||
      typeof customerLng !== "number" ||
      Number.isNaN(customerLng)
    ) {
      return NextResponse.json(
        { error: "Valid customer coordinates are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const settings = await StoreSettings.findOneAndUpdate(
      { key: "default" },
      { $setOnInsert: { key: "default" } },
      { new: true, upsert: true }
    );

    const storeLat = Number(settings?.shippingSettings?.storeLat || 0);
    const storeLng = Number(settings?.shippingSettings?.storeLng || 0);
    const baseDeliveryCharge = Number(
      settings?.shippingSettings?.baseDeliveryCharge || 0
    );
    const perKmCharge = Number(settings?.shippingSettings?.perKmCharge || 0);
    const maxDistance = Number(
      settings?.shippingSettings?.maxDistance ||
        settings?.shippingSettings?.maximumDeliveryDistance ||
        0
    );

    if (!storeLat || !storeLng) {
      return NextResponse.json(
        { error: "Store coordinates are not configured" },
        { status: 400 }
      );
    }

    const key = requireGoogleMapsApiKey();

    const distanceRes = await googleMapsClient.distancematrix({
      params: {
        origins: [{ lat: storeLat, lng: storeLng }],
        destinations: [{ lat: customerLat, lng: customerLng }],
        mode: "driving",
        units: "metric",
        key,
      },
      timeout: 10000,
    });

    const element = distanceRes.data.rows?.[0]?.elements?.[0];

    if (!element || element.status !== "OK") {
      return NextResponse.json(
        { error: "Unable to calculate delivery distance" },
        { status: 400 }
      );
    }

    const distanceInKm = roundTo2((element.distance.value || 0) / 1000);

    if (maxDistance > 0 && distanceInKm > maxDistance) {
      return NextResponse.json(
        {
          distance: distanceInKm,
          maxDistance,
          available: false,
          message: "Delivery not available for this location",
        },
        { status: 200 }
      );
    }

    const deliveryCharge = roundTo2(baseDeliveryCharge + distanceInKm * perKmCharge);

    return NextResponse.json({
      distance: distanceInKm,
      deliveryCharge,
      available: true,
      maxDistance,
    });
  } catch (error) {
    console.error("Error calculating delivery:", error);
    return NextResponse.json(
      { error: "Failed to calculate delivery charge" },
      { status: 500 }
    );
  }
}
