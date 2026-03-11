import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import SiteSettings from '@/models/SiteSettings';

// GET /api/settings/site — fetch site settings
export async function GET() {
  try {
    await connectDB();
    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = await SiteSettings.create({});
    }
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Get site settings error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch site settings' },
      { status: 500 }
    );
  }
}

// PUT /api/settings/site — update site settings
export async function PUT(req) {
  try {
    await connectDB();
    const body = await req.json();
    const { storeName, storeDescription, phone, email, address, socialLinks } = body;

    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = await SiteSettings.create({});
    }

    if (storeName !== undefined) settings.storeName = storeName;
    if (storeDescription !== undefined) settings.storeDescription = storeDescription;
    if (phone !== undefined) settings.phone = phone;
    if (email !== undefined) settings.email = email;
    if (address !== undefined) settings.address = address;
    if (socialLinks) {
      settings.socialLinks = {
        facebook: socialLinks.facebook ?? settings.socialLinks.facebook,
        instagram: socialLinks.instagram ?? settings.socialLinks.instagram,
        twitter: socialLinks.twitter ?? settings.socialLinks.twitter,
        linkedin: socialLinks.linkedin ?? settings.socialLinks.linkedin,
      };
    }

    await settings.save();
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Update site settings error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update site settings' },
      { status: 500 }
    );
  }
}
