export const runtime = "nodejs";

import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

export async function POST(req: Request) {
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
