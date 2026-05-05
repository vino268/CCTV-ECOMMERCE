import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

export async function POST(req) {
  try {
    const body = await req.json();

    if (!body.image) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    const uploadRes = await cloudinary.uploader.upload(body.image, {
      folder: "tn_automation/products",
    });

    return NextResponse.json({
      url: uploadRes.secure_url,
    });

  } catch (error) {
    console.error("UPLOAD ERROR:", error);

    return NextResponse.json(
      { error: "Image upload failed" },
      { status: 500 }
    );
  }
}
