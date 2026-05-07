export const dynamic = "force-dynamic";
export const revalidate = 0;

import { connectDB } from "@/lib/mongodb";
import Category from "@/models/Category";

const ALLOWED_ORIGINS = ["http://localhost:3000", "https://tnautomation.in"];

function getCorsHeaders(request?: Request): Record<string, string> {
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

export async function GET(req: Request) {
  try {
    await connectDB();

    const categories = await Category.find({}).sort({ name: 1 }).lean();

    return Response.json(
      {
        success: true,
        categories,
      },
      { 
        headers: {
          ...getCorsHeaders(req),
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        }
      }
    );
  } catch (error) {
    console.error("CATEGORY ERROR:", error);

    return Response.json(
      {
        success: false,
        categories: [],
        error: error instanceof Error ? error.message : "Categories are temporarily unavailable",
      },
      { status: 500, headers: getCorsHeaders(req) }
    );
  }
}

export async function OPTIONS(req: Request) {
  return new Response(null, {
    status: 200,
    headers: getCorsHeaders(req),
  });
}
