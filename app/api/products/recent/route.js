import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";

export async function GET() {
  try {
    await connectDB(); // 🔥 VERY IMPORTANT

    const products = await Product.find()
      .sort({ createdAt: -1 })
      .limit(5);

    return Response.json(products);
  } catch (error) {
    console.error("🔥 API ERROR:", error);
    return Response.json(
      { error: "Failed to fetch recent products" },
      { status: 500 }
    );
  }
}