import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import SiteSettings from "@/models/SiteSettings";
import AdminLog from "@/models/AdminLog";

// GET /api/settings — return the single site-settings document (create default if missing)
export async function GET() {
  try {
    await connectDB();
    let settingsDoc = await SiteSettings.findOne().sort({ updatedAt: -1, createdAt: -1 });
    if (!settingsDoc) {
      settingsDoc = await SiteSettings.create({ taxPercentage: 0 });
    }

    const settings = settingsDoc.toObject();
    const parsedTaxPercentage = Number(settings.taxPercentage ?? 0);

    return NextResponse.json({
      ...settings,
      taxPercentage: Number.isFinite(parsedTaxPercentage)
        ? parsedTaxPercentage
        : 0,
    });
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
    const parsedTax = Number(data.taxPercentage);
    const taxPercentage = Number.isFinite(parsedTax) ? parsedTax : 0;

    // Only allow known fields
    const update = {
      storeName: data.storeName,
      description: data.description,
      taxPercentage,
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

    let settings;

    if (data._id) {
      settings = await SiteSettings.findByIdAndUpdate(data._id, update, {
        new: true,
        runValidators: true,
      });
    }

    if (!settings) {
      settings = await SiteSettings.findOneAndUpdate({}, update, {
        new: true,
        upsert: true,
        runValidators: true,
        sort: { updatedAt: -1, createdAt: -1 },
      });
    }

    const settingsObject = settings.toObject();
    const parsedTaxPercentage = Number(settingsObject.taxPercentage ?? 0);

    await AdminLog.create({
      adminName: "Admin",
      action: "Updated settings",
      details: "Site settings updated",
    });

    return NextResponse.json({
      ...settingsObject,
      taxPercentage: Number.isFinite(parsedTaxPercentage)
        ? parsedTaxPercentage
        : 0,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
