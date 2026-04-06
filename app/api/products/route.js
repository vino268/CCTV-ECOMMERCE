import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";

export async function GET() {
  try {
    await connectDB();
    console.log("DB connected");

    const products = await Product.find().lean();
    console.log("Products:", products.length);

    return Response.json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("Products API error:", error);
    const message = error instanceof Error ? error.message : String(error);

    return Response.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
