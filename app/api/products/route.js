import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";
import Product from "@/models/Product";
import AdminLog from "@/models/AdminLog";
import {
  isAllowedProductImageInput,
  normalizeProductImageList,
} from "@/lib/product-image";

function normalizeImages(data) {
  const images = normalizeProductImageList(data.images, data.image);

  return {
    ...data,
    images,
    image: images[0] || "",
  };
}

function hasDisallowedImageInputs(data) {
  const candidates = [];

  if (Array.isArray(data.images)) {
    for (const entry of data.images) {
      if (typeof entry === "string") {
        candidates.push(entry);
      } else if (entry && typeof entry === "object" && typeof entry.url === "string") {
        candidates.push(entry.url);
      }
    }
  } else if (typeof data.images === "string") {
    candidates.push(data.images);
  }

  if (typeof data.image === "string") {
    candidates.push(data.image);
  }

  return candidates.some((candidate) => {
    const value = String(candidate || "").trim();
    if (!value) return false;
    return !isAllowedProductImageInput(value);
  });
}

function normalizeProductPayload(data) {
  const features = Array.isArray(data.features)
    ? data.features
        .map((feature) => (typeof feature === "string" ? feature.trim() : ""))
        .filter(Boolean)
    : [];

  return {
    ...data,
    sku: typeof data.sku === "string" ? data.sku.trim().toUpperCase() : "",
    name: typeof data.name === "string" ? data.name.trim() : "",
    category: typeof data.category === "string" ? data.category.trim() : "",
    description:
      typeof data.description === "string" ? data.description.trim() : "",
    price: Number(data.price),
    features,
  };
}

function validateProductPayload(data) {
  const fieldErrors = {};

  if (!data.sku) fieldErrors.sku = "SKU is required.";
  if (!data.name) fieldErrors.name = "Product name is required.";
  if (!Number.isFinite(data.price) || data.price <= 0) {
    fieldErrors.price = "Price must be a valid number greater than 0.";
  }
  if (!data.category) fieldErrors.category = "Category is required.";
  if (!data.description) fieldErrors.description = "Description is required.";
  return fieldErrors;
}

function validationErrorResponse(fieldErrors) {
  const firstError =
    Object.values(fieldErrors)[0] || "Please correct the highlighted fields.";

  return Response.json(
    { error: firstError, fieldErrors },
    { status: 400 }
  );
}

function mapMongooseValidationError(error) {
  if (error?.name !== "ValidationError") return null;

  return Object.entries(error.errors || {}).reduce((acc, [field, detail]) => {
    acc[field] = detail?.message || "Invalid value.";
    return acc;
  }, {});
}

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const pageParam = Number.parseInt(searchParams.get("page") || "1", 10);
    const limitParam = Number.parseInt(searchParams.get("limit") || "10", 10);
    const search = (searchParams.get("search") || "").trim();
    const category = (searchParams.get("category") || "").trim();
    const exclude = (searchParams.get("exclude") || "").trim();
    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
    const limit = Number.isFinite(limitParam) && limitParam > 0
      ? Math.min(limitParam, 50)
      : 12;
    const skip = (page - 1) * limit;

    const query = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { category: { $regex: search, $options: "i" } },
            { sku: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    if (category && category !== "All Categories") {
      query.category = category;
    }

    if (exclude) {
      query._id = { $ne: exclude };
    }

    const total = await Product.countDocuments(query);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("name sku slug price description image images features category inStock createdAt updatedAt")
      .lean();

    console.log("✅ PRODUCTS COUNT:", products.length);

    return Response.json(
      {
        success: true,
        products,
        page,
        totalPages,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );

  } catch (error) {
    console.error("❌ FULL ERROR:", error);

    return Response.json(
      {
        success: false,
        products: [],
        total: 0,
        page: 1,
        totalPages: 1,
        error: error instanceof Error ? error.message : "Products are temporarily unavailable",
      },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await connectDB();

    const requestBody = await req.json();

    console.log("Images received:", requestBody.images);

    if (hasDisallowedImageInputs(requestBody)) {
      return validationErrorResponse({
        images:
          "Invalid image value. Use a valid http(s) URL, an uploaded image (/uploads/...), or a local asset (/products/...).",
      });
    }

    const data = normalizeProductPayload(normalizeImages(requestBody));

    const fieldErrors = validateProductPayload(data);
    if (Object.keys(fieldErrors).length > 0) {
      return validationErrorResponse(fieldErrors);
    }

    const existingSku = await Product.findOne({ sku: data.sku });
    if (existingSku) {
      return Response.json(
        {
          error: "SKU already exists. Please use a unique SKU.",
          fieldErrors: { sku: "SKU already exists. Please use a unique SKU." },
        },
        { status: 409 }
      );
    }

    const payload = {
      ...data,
      createdAt: data.createdAt || new Date(),
    };

    const product = await Product.create(payload);

    await AdminLog.create({
      adminName: "Admin",
      action: "Added product",
      details: product.name || "",
    });

    return Response.json({ success: true, product }, { status: 201 });
  } catch (error) {
    if (error?.code === 11000 && error?.keyPattern?.sku) {
      return Response.json(
        {
          error: "SKU already exists. Please use a unique SKU.",
          fieldErrors: { sku: "SKU already exists. Please use a unique SKU." },
        },
        { status: 409 }
      );
    }

    const fieldErrors = mapMongooseValidationError(error);
    if (fieldErrors) {
      return validationErrorResponse(fieldErrors);
    }

    console.error("Products POST error:", error);
    return Response.json(
      { error: "Failed to add product" },
      { status: 500 }
    );
  }
}