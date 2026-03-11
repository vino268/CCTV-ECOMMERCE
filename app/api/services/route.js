import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Service from "@/models/Service";
import AdminLog from "@/models/AdminLog";

const DEFAULT_SERVICES = [
  {
    slug: "online-support",
    name: "Online Support",
    description:
      "Remote assistance for CCTV setup, troubleshooting, and software configuration.",
    price: 499,
    icon: "support",
    isDefault: true,
    isActive: true,
  },
  {
    slug: "installation-support",
    name: "Installation Support",
    description:
      "Professional CCTV installation including camera placement, wiring, DVR/NVR setup, and mobile app configuration.",
    price: 1999,
    icon: "installation",
    isDefault: true,
    isActive: true,
  },
  {
    slug: "service-maintenance",
    name: "Service & Maintenance",
    description:
      "Regular system maintenance, firmware updates, camera repair, and troubleshooting services.",
    price: 799,
    icon: "maintenance",
    isDefault: true,
    isActive: true,
  },
];

// Ensure each default service exists by slug — insert only missing ones
async function ensureDefaultServices() {
  for (const svc of DEFAULT_SERVICES) {
    const exists = await Service.findOne({ slug: svc.slug });
    if (!exists) {
      await Service.create(svc);
    }
  }
}

// GET /api/services — ensure defaults exist, then return all active services
export async function GET() {
  try {
    await connectDB();
    await ensureDefaultServices();
    const services = await Service.find({ isActive: true }).sort({
      createdAt: 1,
    });
    return NextResponse.json(services);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}

// POST /api/services — create a new service
export async function POST(req) {
  try {
    await connectDB();
    const data = await req.json();

    if (!data.name || !String(data.name).trim()) {
      return NextResponse.json(
        { error: "Service name is required" },
        { status: 400 }
      );
    }

    // Generate a slug from the name
    const slug =
      String(data.name)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") +
      "-" +
      Date.now();

    const service = await Service.create({
      slug,
      name: String(data.name).trim(),
      description: data.description ? String(data.description).trim() : "",
      price: data.price ? Number(data.price) : 0,
      icon: data.icon ? String(data.icon).trim() : "",
      isDefault: false,
      isActive: true,
    });

    await AdminLog.create({
      adminName: "Admin",
      action: "Added service",
      details: service.name,
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create service" },
      { status: 500 }
    );
  }
}
