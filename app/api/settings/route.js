import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import SiteSettings from "@/models/SiteSettings";
import AdminLog from "@/models/AdminLog";
import { jwtVerify } from "jose";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function jsonWithCors(body, init = {}) {
  const response = NextResponse.json(body, init);
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidHttpsUrl(value) {
  if (!value) return true;
  if (!value.startsWith("https://")) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

async function verifyAdmin(request) {
  const token = request.cookies.get("adminToken")?.value;
  if (!token) {
    return { ok: false, status: 401, message: "Unauthorized" };
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    if (payload.role !== "admin") {
      return { ok: false, status: 403, message: "Forbidden" };
    }
    return { ok: true };
  } catch {
    return { ok: false, status: 401, message: "Unauthorized" };
  }
}

// GET /api/settings — return the single site-settings document (create default if missing)
export async function GET() {
  try {
    await connectDB();
    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = await SiteSettings.create({});
    }
    return jsonWithCors(settings);
  } catch (error) {
    return jsonWithCors(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// POST /api/settings — upsert site settings
export async function POST(req) {
  try {
    const auth = await verifyAdmin(req);
    if (!auth.ok) {
      return jsonWithCors({ error: auth.message }, { status: auth.status });
    }

    await connectDB();
    const data = await req.json();

    const contactEmail = normalizeString(data.contact?.email);
    const contactPhone = normalizeString(data.contact?.phone);
    const social = {
      facebook: normalizeString(data.social?.facebook),
      instagram: normalizeString(data.social?.instagram),
      twitter: normalizeString(data.social?.twitter),
      linkedin: normalizeString(data.social?.linkedin),
      youtube: normalizeString(data.social?.youtube),
    };

    if (contactEmail && !isValidEmail(contactEmail)) {
      return jsonWithCors(
        { error: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    if (contactPhone && !/^\d+$/.test(contactPhone)) {
      return jsonWithCors(
        { error: "Phone number must be numeric" },
        { status: 400 }
      );
    }

    for (const [key, value] of Object.entries(social)) {
      if (!isValidHttpsUrl(value)) {
        return jsonWithCors(
          { error: `${key} link must start with https://` },
          { status: 400 }
        );
      }
    }

    // Only allow known fields
    const update = {
      storeName: normalizeString(data.storeName),
      description: normalizeString(data.description),
      contact: {
        phone: contactPhone,
        email: contactEmail,
        address: normalizeString(data.contact?.address),
      },
      social,
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

    return jsonWithCors(settings);
  } catch (error) {
    return jsonWithCors(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: CORS_HEADERS,
  });
}
