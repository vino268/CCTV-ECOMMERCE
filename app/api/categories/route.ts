import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";

export async function GET() {
try {
await connectDB();

const db = mongoose.connection.useDb("tn_automation");

const categories = await db
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

return new Response(JSON.stringify({
  success: true,
  categories
}), {
  status: 200,
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
    "Access-Control-Allow-Headers": "Content-Type"
  }
});

} catch (error) {
return new Response(JSON.stringify({
success: false,
error: "Failed to fetch categories"
}), {
status: 500,
headers: {
"Access-Control-Allow-Origin": "*"
}
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
