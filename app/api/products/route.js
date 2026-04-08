import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";

export async function GET() {
try {
await connectDB();

const products = await mongoose.connection.collection("products").find({}).toArray();

return new Response(JSON.stringify({
  success: true,
  products
}), {
  status: 200,
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  }
});

} catch (error) {
console.error("Products API error", error);
return new Response(JSON.stringify({
success: false,
error: error instanceof Error ? error.message : "Unknown error"
}), {
status: 500,
headers: {
"Access-Control-Allow-Origin": "*",
"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
"Access-Control-Allow-Headers": "Content-Type, Authorization"
}
});
}
}

export async function OPTIONS() {
return new Response(null, {
status: 200,
headers: {
"Access-Control-Allow-Origin": "*",
"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
"Access-Control-Allow-Headers": "Content-Type, Authorization"
}
});
}
