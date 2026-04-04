import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
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

  const rawSku = data.sku ?? data.SKU;
  const rawCategory = data.category ?? data.Category;
  const parsedPrice =
    typeof data.price === "string"
      ? Number(data.price.replace(/,/g, "").trim())
      : Number(data.price);

  return {
    ...data,
    sku: typeof rawSku === "string" ? rawSku.trim().toUpperCase() : "",
    name: typeof data.name === "string" ? data.name.trim() : "",
    category: typeof rawCategory === "string" ? rawCategory.trim() : "",
    description:
      typeof data.description === "string" ? data.description.trim() : "",
    price: parsedPrice,
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

function mapMongooseValidationError(error) {
  if (error?.name !== "ValidationError") return null;

  return Object.entries(error.errors || {}).reduce((acc, [field, detail]) => {
    acc[field] = detail?.message || "Invalid value.";
    return acc;
  }, {});
}

function validationErrorResponse(fieldErrors) {
  const firstError =
    Object.values(fieldErrors)[0] || "Please correct the highlighted fields.";

  return NextResponse.json(
    { message: firstError, error: firstError, fieldErrors },
    { status: 400 }
  );
}

// GET /api/products — return products (supports pagination via page + limit)
export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const requestedPage = Number.parseInt(searchParams.get('page') || '1', 10);
    const requestedLimit = Number.parseInt(searchParams.get('limit') || '12', 10);

    const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    const limit = Number.isFinite(requestedLimit) && requestedLimit > 0
      ? Math.min(requestedLimit, 100)
      : 12;
    const skip = (page - 1) * limit;

    const isPaginatedRequest = searchParams.has('page') || searchParams.has('limit');

    // Preserve legacy response shape for existing consumers.
    if (!isPaginatedRequest) {
      const products = await Product.find().sort({ createdAt: -1 });
      return NextResponse.json(products);
    }

    const [products, total] = await Promise.all([
      Product.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      Product.countDocuments(),
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasMore = skip + products.length < total;

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// POST /api/products — create new product
export async function POST(req) {
  try {
    await connectDB();

    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.log("Invalid JSON payload for POST /api/products:", parseError);
      return NextResponse.json(
        {
          message: "Invalid request body. Please send valid JSON.",
          error: "Invalid request body. Please send valid JSON.",
        },
        { status: 400 }
      );
    }

    console.log("Incoming Data:", requestBody);

    if (hasDisallowedImageInputs(requestBody)) {
      return validationErrorResponse({
        images:
          "External image URLs are not allowed. Use uploaded images (/uploads/...) or local assets (/products/...).",
      });
    }

    const data = normalizeProductPayload(normalizeImages(requestBody));

    console.log("Normalized Product Fields:", {
      sku: data.sku,
      name: data.name,
      price: data.price,
      category: data.category,
      description: data.description,
      imagesCount: Array.isArray(data.images) ? data.images.length : 0,
    });

    const fieldErrors = validateProductPayload(data);
    if (Object.keys(fieldErrors).length > 0) {
      return validationErrorResponse(fieldErrors);
    }

    const product = await Product.create(data);

    await AdminLog.create({
      adminName: "Admin",
      action: "Added product",
      details: product.name || "",
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.log("ERROR:", error);

    if (error?.code === 11000 && error?.keyPattern?.sku) {
      return NextResponse.json(
        {
          message: "SKU already exists. Please use a unique SKU.",
          error: "SKU already exists. Please use a unique SKU.",
          fieldErrors: { sku: "SKU already exists. Please use a unique SKU." },
        },
        { status: 400 }
      );
    }

    const fieldErrors = mapMongooseValidationError(error);
    if (fieldErrors) {
      return validationErrorResponse(fieldErrors);
    }

    return NextResponse.json(
      {
        message: error?.message || "Server error",
        error: error?.message || "Server error",
      },
      { status: 500 }
    );
  }
}
