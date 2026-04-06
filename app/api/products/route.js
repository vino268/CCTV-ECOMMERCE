import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";

export async function GET() {
  try {
    const conn = await connectDB();
    const dbName = conn?.connection?.name || "unknown";
    const productCount = await Product.countDocuments();
    console.log(`[api/products] Mongo connected. db=${dbName}, productCount=${productCount}`);

    const products = await Product.find().lean();
    console.log(`[api/products] Returning ${products.length} products`);

    return Response.json(products);
  } catch (error) {
    console.error("[api/products] Failed to fetch products:", error);
    return Response.json(
      { error: "Failed to fetch products", details: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
