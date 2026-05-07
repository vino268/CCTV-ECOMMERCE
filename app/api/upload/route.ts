export const runtime = "nodejs";

import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

export async function POST(req: Request) {
  console.log({
    cloud: process.env.CLOUDINARY_CLOUD_NAME,
    key: process.env.CLOUDINARY_API_KEY,
    secret: process.env.CLOUDINARY_API_SECRET ? "YES" : "NO",
  });

  try {
    const body = await req.json();

    if (!body.image) {
      return NextResponse.json({ error: "No image" }, { status: 400 });
    }

    const result = await cloudinary.uploader.upload(body.image, {
      folder: "tn_automation/products",
    });

    return NextResponse.json({ url: result.secure_url });

  } catch (error) {
    console.error("UPLOAD ERROR:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
