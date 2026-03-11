import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import SiteSettings from "@/models/SiteSettings";
import AdminLog from "@/models/AdminLog";

// GET /api/settings — return the single site-settings document (create default if missing)
export async function GET() {
  try {
    await connectDB();
    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = await SiteSettings.create({});
    }
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// POST /api/settings — upsert site settings
export async function POST(req) {
  try {
    await connectDB();
    const data = await req.json();

    // Only allow known fields
    const update = {
      storeName: data.storeName,
      description: data.description,
      contact: {
        phone: data.contact?.phone,
        email: data.contact?.email,
        address: data.contact?.address,
      },
      social: {
        facebook: data.social?.facebook,
        instagram: data.social?.instagram,
        twitter: data.social?.twitter,
        linkedin: data.social?.linkedin,
        youtube: data.social?.youtube,
      },
    };

    const settings = await SiteSettings.findOneAndUpdate({}, update, {
      new: true,
      upsert: true,
      runValidators: true,
    });

    await AdminLog.create({
      adminName: "Admin",
      action: "Updated settings",
      details: "Site settings updated",
    });

    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
