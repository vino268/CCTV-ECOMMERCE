import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";

export async function GET() {
	try {
		console.log("API HIT");

		await connectDB();

		const db = mongoose.connection.db;

		const products = await db.collection("products").find({}).toArray();

		return Response.json({
			success: true,
			products,
		});
	} catch (error) {
		console.error("ERROR:", error);

		return Response.json({
			success: false,
			error: error?.message || "Unknown error",
		});
	}
}
