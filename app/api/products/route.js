export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";
import axios from "axios";
import { PassThrough } from "stream";
import Product from "@/models/Product";
import AdminLog from "@/models/AdminLog";
import cloudinary from "@/lib/cloudinary";
import {
  isAllowedProductImageInput,
  normalizeProductImageList,
} from "@/lib/product-image";

function normalizeImages(data) {
  const images = normalizeProductImageList(data.images, data.imageUrl || data.image);

  return {
    ...data,
    images,
    image: images[0] || "",
  };
}

function isRemoteHttpUrl(value) {
  if (typeof value !== "string") return false;

  try {
    const parsed = new URL(value.trim());
    const protocol = String(parsed.protocol || "").toLowerCase();
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

function isCloudinaryUrl(value) {
  return typeof value === "string" && /res\.cloudinary\.com/i.test(value);
}

function uploadBufferToCloudinary(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(result);
    });

    const bufferStream = new PassThrough();
    bufferStream.end(buffer);
    bufferStream.pipe(uploadStream);
  });
}

async function uploadImageFromUrl(imageUrl) {
  const response = await axios.get(imageUrl, {
    responseType: "arraybuffer",
    timeout: 20000,
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
  });

  const uploaded = await uploadBufferToCloudinary(Buffer.from(response.data), {
    folder: "products",
    resource_type: "image",
  });

  return uploaded.secure_url;
}

async function resolveStoredImages(images) {
  const resolved = [];

  for (const entry of Array.isArray(images) ? images : []) {
    const value = typeof entry === "string" ? entry.trim() : "";
    if (!value) continue;

    if (isRemoteHttpUrl(value) && !isCloudinaryUrl(value)) {
      resolved.push(await uploadImageFromUrl(value));
      continue;
    }

    resolved.push(value);
  }

  return [...new Set(resolved)];
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
    payload.shippingText = typeof data.shippingText === "string" && data.shippingText.trim()
      ? data.shippingText.trim()
      : "Across India";
  }
  if (data.warrantyYears !== undefined) {
    payload.warrantyYears = Number.isFinite(Number(data.warrantyYears))
      ? Math.max(0, Math.round(Number(data.warrantyYears)))
      : 1;
  }
  if (data.returnDays !== undefined) {
    payload.returnDays = Number.isFinite(Number(data.returnDays))
      ? Math.max(0, Math.round(Number(data.returnDays)))
      : 10;
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

    const query = {
      isDeleted: { $ne: true },
      ...(search
        ? {
            $or: [
              { name: { $regex: search, $options: "i" } },
              { category: { $regex: search, $options: "i" } },
              { sku: { $regex: search, $options: "i" } },
              { description: { $regex: search, $options: "i" } },
            ],
          }
        : {}),
    };

    if (category && category !== "All Categories") {
      query.category = { $regex: `^${category}$`, $options: "i" };
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
        .select(
          "name sku slug price description image images features category inStock shippingText warrantyYears returnDays createdAt updatedAt"
        )
        .lean();

    console.log("✅ PRODUCTS COUNT:", products.length);

    return NextResponse.json(
      {
        success: true,
        products,
        page,
        totalPages,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );

  } catch (error) {
    console.error("❌ FULL ERROR:", error);

    return NextResponse.json(
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

    console.log('📥 POST /api/products received:', {
      shippingText: requestBody?.shippingText,
      warrantyYears: requestBody?.warrantyYears,
      returnDays: requestBody?.returnDays,
      typeShipping: typeof requestBody?.shippingText,
      typeWarranty: typeof requestBody?.warrantyYears,
      typeReturnDays: typeof requestBody?.returnDays,
    });

    console.log("Images received:", requestBody.images);

    if (hasDisallowedImageInputs(requestBody)) {
      return validationErrorResponse({
        images:
          "Invalid image value. Use a valid http(s) URL, an uploaded image (/uploads/...), or a local asset (/products/...).",
      });
    }

    const data = normalizeProductPayload(normalizeImages(requestBody));
    const storedImages = await resolveStoredImages(data.images);
    const storedImage = storedImages[0] || data.image || "";

    console.log('🔄 POST - After normalization:', {
      shippingTextOut: data?.shippingText,
      warrantyYearsOut: data?.warrantyYears,
      returnDaysOut: data?.returnDays,
      hasShipping: 'shippingText' in data,
      hasWarranty: 'warrantyYears' in data,
      hasReturnDays: 'returnDays' in data,
    });

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
      images: storedImages,
      image: storedImage,
      createdAt: data.createdAt || new Date(),
    };

    const product = await Product.create(payload);

    console.log('✅ POST - Product created successfully:', {
      id: product._id,
      shippingText: product.shippingText,
      warrantyYears: product.warrantyYears,
      returnDays: product.returnDays,
    });

    await AdminLog.create({
      adminName: "Admin",
      type: "product",
      action: "add",
      message: "Product added",
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