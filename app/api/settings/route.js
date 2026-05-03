import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import SiteSettings from "@/models/SiteSettings";
import AdminLog from "@/models/AdminLog";
import { verifyAuthSession } from "@/lib/auth-session";

const ALLOWED_ORIGINS = ["http://localhost:3000", "https://tnautomation.in", "https://www.tnautomation.in"];

function getCorsHeaders(request) {
  const origin = request?.headers?.get("origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[1];

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  };
}

function jsonWithCors(request, body, init = {}) {
  const response = NextResponse.json(body, init);
  Object.entries(getCorsHeaders(request)).forEach(([key, value]) => {
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
  return verifyAuthSession(request, "admin");
}

// GET /api/settings — return the single site-settings document (create default if missing)
export async function GET(req) {
  try {
    await connectDB();
    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = await SiteSettings.create({});
    }
    const payload = settings.toObject ? settings.toObject() : settings;
    return jsonWithCors(req, {
      success: true,
      data: payload,
      ...payload,
    });
  } catch (error) {
    console.error("SETTINGS GET ERROR:", error);
    return jsonWithCors(
      req,
      {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : "Failed to fetch settings",
      },
      { status: 500 }
    );
  }
}

// POST /api/settings — upsert site settings
export async function POST(req) {
  try {
    const auth = await verifyAdmin(req);
    if (!auth.ok) {
      return jsonWithCors(req, { error: auth.message }, { status: auth.status });
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
        req,
        { error: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    if (contactPhone && !/^\d+$/.test(contactPhone)) {
      return jsonWithCors(
        req,
        { error: "Phone number must be numeric" },
        { status: 400 }
      );
    }

    for (const [key, value] of Object.entries(social)) {
      if (!isValidHttpsUrl(value)) {
        return jsonWithCors(
          req,
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

    return jsonWithCors(req, settings);
  } catch (error) {
    return jsonWithCors(
      req,
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}

export async function OPTIONS(req) {
  return new Response(null, {
    status: 200,
    headers: getCorsHeaders(req),
  });
}
