import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";
import AdminLog from "@/models/AdminLog";

function normalizeImages(data) {
  const images = Array.isArray(data.images)
    ? data.images
        .map((img) => {
          if (typeof img === "string") return img.trim();
          if (img && typeof img === "object" && typeof img.url === "string") {
            return img.url.trim();
          }
          return "";
        })
        .filter(Boolean)
    : typeof data.images === "string" && data.images.trim()
    ? [data.images.trim()]
    : [];

  if (images.length === 0 && data.image) {
    images.push(data.image);
  }

  return {
    ...data,
    images,
    image: images[0] || "",
  };
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
  if (Array.isArray(data.images) && data.images.some((img) => typeof img === "string" && img.startsWith("data:"))) {
    fieldErrors.images = "Base64 image payloads are not allowed. Upload image files and use URLs.";
  }
  if (typeof data.image === "string" && data.image.startsWith("data:")) {
    fieldErrors.image = "Base64 image payloads are not allowed. Upload image files and use URLs.";
  }

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

// GET /api/products — return all products
export async function GET() {
  try {
    await connectDB();
    const products = await Product.find().sort({ createdAt: -1 });
    return NextResponse.json(products);
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
