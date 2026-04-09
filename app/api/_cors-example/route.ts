const ALLOWED_ORIGINS = ["http://localhost:3000", "https://tnautomation.in"];

function getCorsHeaders(request?: Request): Record<string, string> {
  const origin = request?.headers?.get("origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[1];

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
    Vary: "Origin",
  };
}

export async function GET(req: Request) {
  const payload = { success: true, message: "CORS example route" };

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: getCorsHeaders(req),
  });
}

export async function OPTIONS(req: Request) {
  return new Response(null, {
    status: 200,
    headers: getCorsHeaders(req),
  });
}
