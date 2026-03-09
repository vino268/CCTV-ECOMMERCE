import { connectDB } from "@/lib/mongodb";
import InstallationRequest from "@/models/InstallationRequest";

export async function POST(req) {
  await connectDB();

  const data = await req.json();

  const request = await InstallationRequest.create(data);

  return Response.json(request);
}