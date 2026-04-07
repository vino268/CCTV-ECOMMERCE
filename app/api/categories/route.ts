import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";

export async function GET() {
try {
await connectDB();

const db = mongoose.connection.db!;

const categories = await db
  .collection("products")
  .distinct("category");

return Response.json({
  success: true,
  categories,
});

} catch (error) {
console.error("CATEGORY ERROR:", error);

return Response.json(
  {
    success: false,
    error: "Failed to fetch categories",
  },
  { status: 500 }
);

}
}

export async function OPTIONS() {
return new Response(null, {
status: 200,
headers: {
"Access-Control-Allow-Origin": "*",
"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
"Access-Control-Allow-Headers": "Content-Type"
}
});
}
