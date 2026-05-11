export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import mongoose from "mongoose";
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

  const payload = {
    ...data,
    sku: typeof data.sku === "string" ? data.sku.trim().toUpperCase() : "",
    name: typeof data.name === "string" ? data.name.trim() : "",
    category: typeof data.category === "string" ? data.category.trim() : "",
    description:
      typeof data.description === "string" ? data.description.trim() : "",
    price: Math.round(Number(data.price)),
    features,
  };

  // Only set feature fields if they are defined (handles both 0 and non-zero values)
  if (data.shippingText !== undefined) {
    payload.shippingText = typeof data.shippingText === "string" ? data.shippingText.trim() : "Across India";
  }
  if (data.warrantyYears !== undefined) {
    payload.warrantyYears = Number.isFinite(Number(data.warrantyYears)) ? Math.max(0, Math.round(Number(data.warrantyYears))) : 1;
  }
  if (data.returnDays !== undefined) {
    payload.returnDays = Number.isFinite(Number(data.returnDays)) ? Math.max(0, Math.round(Number(data.returnDays))) : 10;
  }

  return payload;
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
    { error: firstError, fieldErrors },
    { status: 400 }
  );
}

// GET /api/products/[id] — return single product
export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id: rawId } = await params;
    const id = String(rawId || "").trim();

    // Validate MongoDB ObjectId format
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid product ID" },
        { status: 400 }
      );
    }

    const product = await Product.findById(id);

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    console.log('🔍 NEXT.JS GET /api/products/[id] - Full Product from DB:', JSON.stringify({
      _id: product._id,
      name: product.name,
      shippingText: product.shippingText,
      warrantyYears: product.warrantyYears,
      returnDays: product.returnDays,
      allKeys: Object.keys(product.toObject ? product.toObject() : product),
    }, null, 2));

    return NextResponse.json(
      {
        success: true,
        product,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/products/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id] — update product
export async function PUT(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const requestBody = await req.json();

    console.log('📥 PUT /api/products/[id] received:', {
      id,
      shippingTextIn: requestBody?.shippingText,
      warrantyYearsIn: requestBody?.warrantyYears,
      returnDaysIn: requestBody?.returnDays,
      typeShipping: typeof requestBody?.shippingText,
      typeWarranty: typeof requestBody?.warrantyYears,
      typeReturnDays: typeof requestBody?.returnDays,
    });

    if (hasDisallowedImageInputs(requestBody)) {
      return validationErrorResponse({
        images:
          "Invalid image value. Use a valid http(s) URL, an uploaded image (/uploads/...), or a local asset (/products/...).",
      });
    }

    const data = normalizeProductPayload(normalizeImages(requestBody));

    console.log('🔄 After normalization - PUT:', {
      shippingTextOut: data?.shippingText,
      warrantyYearsOut: data?.warrantyYears,
      returnDaysOut: data?.returnDays,
      typeShippingOut: typeof data?.shippingText,
      typeWarrantyOut: typeof data?.warrantyYears,
      typeReturnDaysOut: typeof data?.returnDays,
      hasShipping: 'shippingText' in data,
      hasWarranty: 'warrantyYears' in data,
      hasReturnDays: 'returnDays' in data,
    });

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

    // Find existing product and update fields explicitly to avoid unintended overwrites
    const productDoc = await Product.findById(id);

    if (!productDoc) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Update common normalized fields from `data` (already validated)
    const updatableFields = [
      'sku', 'name', 'category', 'description', 'price', 'images', 'image', 'inStock', 'features'
    ];
    for (const f of updatableFields) {
      if (data[f] !== undefined) productDoc[f] = data[f];
    }

    // Update feature fields only if provided in the raw request (preserve existing otherwise)
    if (requestBody.shippingText !== undefined) {
      productDoc.shippingText = typeof requestBody.shippingText === 'string'
        ? String(requestBody.shippingText).trim()
        : productDoc.shippingText;
    }
    if (requestBody.warrantyYears !== undefined) {
      productDoc.warrantyYears = Number.isFinite(Number(requestBody.warrantyYears))
        ? Math.max(0, Math.round(Number(requestBody.warrantyYears)))
        : productDoc.warrantyYears;
    }
    if (requestBody.returnDays !== undefined) {
      productDoc.returnDays = Number.isFinite(Number(requestBody.returnDays))
        ? Math.max(0, Math.round(Number(requestBody.returnDays)))
        : productDoc.returnDays;
    }

    await productDoc.save();

    console.log('✅ Product saved successfully (after explicit save):', {
      id: productDoc._id,
      shippingTextAfter: productDoc.shippingText,
      warrantyYearsAfter: productDoc.warrantyYears,
      returnDaysAfter: productDoc.returnDays,
      typeShippingAfter: typeof productDoc.shippingText,
      typeWarrantyAfter: typeof productDoc.warrantyYears,
      typeReturnDaysAfter: typeof productDoc.returnDays,
    });

    await AdminLog.create({
      adminName: "Admin",
      action: "Updated product",
      details: productDoc.name || "",
    });

    return NextResponse.json(productDoc);
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

    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    await AdminLog.create({
      adminName: "Admin",
      action: "Deleted product",
      details: deletedProduct.name || "",
    });

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
    });

  } catch (error) {
    console.log("DELETE PRODUCT ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
