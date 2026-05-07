import { v2 as cloudinary } from "cloudinary";

type CloudinaryEnvConfig = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
};

function parseCloudinaryUrl(value?: string | null): Partial<CloudinaryEnvConfig> {
  if (!value) return {};

  try {
    const url = new URL(value);
    if (url.protocol !== "cloudinary:") return {};

    return {
      apiKey: decodeURIComponent(url.username || ""),
      apiSecret: decodeURIComponent(url.password || ""),
      cloudName: decodeURIComponent(url.hostname || ""),
    };
  } catch {
    return {};
  }
}

function resolveCloudinaryEnv(): CloudinaryEnvConfig {
  const parsedUrl = parseCloudinaryUrl(process.env.CLOUDINARY_URL);

  const cloudName =
    process.env.CLOUDINARY_CLOUD_NAME ||
    parsedUrl.cloudName ||
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    "";
  const apiKey = process.env.CLOUDINARY_API_KEY || parsedUrl.apiKey || "";
  const apiSecret = process.env.CLOUDINARY_API_SECRET || parsedUrl.apiSecret || "";

  const missing: string[] = [];
  if (!cloudName) missing.push("CLOUDINARY_CLOUD_NAME");
  if (!apiKey) missing.push("CLOUDINARY_API_KEY");
  if (!apiSecret) missing.push("CLOUDINARY_API_SECRET");

  if (missing.length > 0) {
    throw new Error(
      `Cloudinary is not configured. Missing: ${missing.join(", ")}. Add them in local .env.local and your production environment settings.`
    );
  }

  return { cloudName, apiKey, apiSecret };
}

const cloudinaryEnv = resolveCloudinaryEnv();

cloudinary.config({
  cloud_name: cloudinaryEnv.cloudName,
  api_key: cloudinaryEnv.apiKey,
  api_secret: cloudinaryEnv.apiSecret,
});

export default cloudinary;
