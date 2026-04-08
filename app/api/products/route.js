import { connectDB } from "@/lib/mongodb";

export async function GET() {
  try {
    const connection = await connectDB();
    const db = connection.connection.db;

    const products = await db
      .collection("products")
      .find({})
      .toArray();

    return Response.json({ success: true, products });
  } catch (error) {
    console.error("❌ ERROR:", error);

    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}