import { Client } from "@googlemaps/google-maps-services-js";

const apiKey = process.env.GOOGLE_MAPS_API_KEY;

export const googleMapsClient = new Client({});

export function requireGoogleMapsApiKey() {
  if (!apiKey) {
    throw new Error("GOOGLE_MAPS_API_KEY is missing");
  }
  return apiKey;
}
