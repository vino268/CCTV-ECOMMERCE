import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";
import AdminLog from "@/models/AdminLog";

function normalizeImages(data) {
  const images = Array.isArray(data.images)
    ? data.images.filter((img) => typeof img === "string" && img.trim())
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
    { error: firstError, fieldErrors },
    { status: 400 }
  );
}

// GET /api/products/[id] — return single product
export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const product = await Product.findById(id);

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id] — update product
export async function PUT(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const data = normalizeProductPayload(normalizeImages(await req.json()));

    const fieldErrors = validateProductPayload(data);
    if (Object.keys(fieldErrors).length > 0) {
      return validationErrorResponse(fieldErrors);
    }

    if (data.sku) {
      const existingSku = await Product.findOne({ sku: data.sku, _id: { $ne: id } });
      if (existingSku) {
        return NextResponse.json(
          {
            error: "SKU already exists. Please use a unique SKU.",
            fieldErrors: { sku: "SKU already exists. Please use a unique SKU." },
          },
          { status: 409 }
        );
      }
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    await AdminLog.create({
      adminName: "Admin",
      action: "Updated product",
      details: product.name || "",
    });

    return NextResponse.json(product);
  } catch (error) {
    if (error?.code === 11000 && error?.keyPattern?.sku) {
      return NextResponse.json(
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

    return NextResponse.json(
      { error: "Unable to update product right now. Please try again." },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] — delete product
export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    await AdminLog.create({
      adminName: "Admin",
      action: "Deleted product",
      details: product.name || "",
    });

    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
