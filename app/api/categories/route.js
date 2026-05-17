import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Category from "@/models/Category";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function slugifyCategoryName(name) {
  return String(name || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "category";
}

async function createUniqueSlug(name) {
  const baseSlug = slugifyCategoryName(name);
  let slug = baseSlug;
  let suffix = 1;

  while (await Category.findOne({ slug })) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

export async function GET() {
  try {
    await connectDB();

    const categories = await Category.find().sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      categories,
    });
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch categories",
      },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Category name required",
        },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();

    const existing = await Category.findOne({
      name: trimmedName,
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: "Category already exists",
        },
        { status: 400 }
      );
    }

    const slug = await createUniqueSlug(trimmedName);

    const category = await Category.create({
      name: trimmedName,
      slug,
    });

    return NextResponse.json({
      success: true,
      category,
    });
  } catch (error) {
    console.log(error);

    if (error?.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message: "Category already exists",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create category",
      },
      { status: 500 }
    );
  }
}