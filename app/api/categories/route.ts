import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";

export async function GET() {
try {
await connectDB();

const db = mongoose.connection.useDb("tn_automation");

const raw = await db
  .collection("products")
  .aggregate([
    {
      $group: {
        _id: "$category",
        count: { $sum: 1 }
      }
    }
  ])
  .toArray();

// ✅ FIX: convert to frontend format
const categories = raw.map(item => item._id);

return Response.json({
  success: true,
  categories
});

} catch (error) {
console.error(error);

return Response.json({
  success: false,
  categories: []
});

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
