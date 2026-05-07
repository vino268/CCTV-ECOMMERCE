import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const fileStr = body.image;

    if (!fileStr) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    console.log("Uploading image...");

    const uploadedResponse = await cloudinary.uploader.upload(fileStr, {
      folder: "tnautomation",
    });

    console.log("Upload success");

    return NextResponse.json({
      url: uploadedResponse.secure_url,
    });
  } catch (error: any) {
    console.error("UPLOAD API ERROR:", error);

    return NextResponse.json(
      {
        error: error.message || "Upload failed",
      },
      {
        status: 500,
      }
    );
  }
}
