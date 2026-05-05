export const runtime = "nodejs";
export async function POST() {
  return new Response(JSON.stringify({ 
    success: false, 
    error: "This endpoint is deprecated. Use direct unsigned upload to Cloudinary from the frontend." 
  }), { 
    status: 410,
    headers: { "Content-Type": "application/json" }
  });
}
