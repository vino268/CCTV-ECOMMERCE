import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";

export async function GET(request) {
  try {
    const host = request?.headers?.get("host") || "unknown-host";
    const forwardedHost = request?.headers?.get("x-forwarded-host") || "unknown-forwarded-host";
    const origin = request?.headers?.get("origin") || "no-origin-header";
    const hasMongoUri = Boolean(process.env.MONGODB_URI);

    console.log(
      `[api/products] Request received host=${host} forwardedHost=${forwardedHost} origin=${origin} hasMongoUri=${hasMongoUri}`
    );

    const conn = await connectDB();
    console.log("DB CONNECTED");
    const dbName = conn?.connection?.name || "unknown";
    const readyState = conn?.connection?.readyState;
    const stateLabel = ["disconnected", "connected", "connecting", "disconnecting"][readyState] || "unknown";
    const productCount = await Product.countDocuments();
    console.log(
      `[api/products] Mongo connected. db=${dbName}, readyState=${stateLabel}(${readyState}), productCount=${productCount}`
    );

    const products = await Product.find().lean();
    console.log("Products count:", products.length);
    console.log(`[api/products] Returning ${products.length} products`);

    return Response.json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("[api/products] Failed to fetch products:", error);

    return Response.json(
      {
        success: false,
        error: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
