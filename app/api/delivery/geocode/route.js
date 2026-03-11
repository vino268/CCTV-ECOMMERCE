import { NextResponse } from "next/server";
import { googleMapsClient, requireGoogleMapsApiKey } from "@/lib/google-maps";

export async function POST(req) {
  try {
    const { address } = await req.json();

    if (!address || typeof address !== "string") {
      return NextResponse.json(
        { error: "Address is required" },
        { status: 400 }
      );
    }

    const key = requireGoogleMapsApiKey();

    const response = await googleMapsClient.geocode({
      params: {
        address,
        key,
      },
      timeout: 10000,
    });

    const result = response.data.results?.[0];

    if (!result) {
      return NextResponse.json(
        { error: "Unable to geocode address" },
        { status: 404 }
      );
    }

    const location = result.geometry?.location;

    return NextResponse.json({
      lat: location?.lat,
      lng: location?.lng,
      formattedAddress: result.formatted_address,
    });
  } catch (error) {
    console.error("Error geocoding address:", error);
    return NextResponse.json(
      { error: "Failed to geocode address" },
      { status: 500 }
    );
  }
}
