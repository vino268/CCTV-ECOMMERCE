import { connectDB } from "@/lib/mongodb";
import InstallationRequest from "@/models/InstallationRequest";

export async function POST(req) {
  try {
    await connectDB();

    const data = await req.json();

    const request = await InstallationRequest.create(data);

    return Response.json(request);
  } catch (error) {
    console.error("Installation API error", error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create installation request",
      },
      { status: 500 }
    );
  }
}