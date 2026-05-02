const ALLOWED_PREFIXES = ["/products/", "/uploads/"];
// Use same-origin relative paths for production (cookies sent with credentials:'include')
const API_BASE = (() => {
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
    return (process.env.NEXT_PUBLIC_API_URL || "").trim().replace(/\/+$/, "");
  }
  return "";
})();

function ensureLeadingSlash(pathname) {
  if (!pathname) return "";
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

function isAllowedPath(pathname) {
  return ALLOWED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function sanitizeProductImageInput(value) {
  if (typeof value !== "string") return "";

  const trimmed = value.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("data:")) return "";

  const lowered = trimmed.toLowerCase();
  if (lowered.startsWith("http://") || lowered.startsWith("https://")) {
    try {
      const parsed = new URL(trimmed);
      const protocol = String(parsed.protocol || "").toLowerCase();
      if (protocol !== "http:" && protocol !== "https:") {
        return "";
      }

      return parsed.toString();
    } catch {
      return "";
    }
  }

  const normalizedPath = ensureLeadingSlash(trimmed);
  if (isAllowedPath(normalizedPath)) {
    return normalizedPath;
  }

  // Allow plain file names as product assets, e.g. cam1.jpg -> /products/cam1.jpg
  if (/^[a-z0-9._-]+\.(jpg|jpeg|png|webp|gif|avif|svg)$/i.test(trimmed)) {
    return `/products/${trimmed}`;
  }

  return "";
}

export function isAllowedProductImageInput(value) {
  return Boolean(sanitizeProductImageInput(value));
}

export function normalizeProductImageList(images, image) {
  const normalized = [];

  if (Array.isArray(images)) {
    for (const entry of images) {
      const source = typeof entry === "string" ? entry : entry?.url;
      const sanitized = sanitizeProductImageInput(source);
      if (sanitized) normalized.push(sanitized);
    }
  } else if (typeof images === "string") {
    const sanitized = sanitizeProductImageInput(images);
    if (sanitized) normalized.push(sanitized);
  }

  if (normalized.length === 0) {
    const single = sanitizeProductImageInput(image);
    if (single) normalized.push(single);
  }

  return [...new Set(normalized)];
}

export function getSafeImageSrc(value, fallback = "/placeholder.jpg") {
  const sanitized = sanitizeProductImageInput(value);
  if (!sanitized) return fallback;

  if (/^https?:\/\//i.test(sanitized)) {
    return sanitized;
  }

  if (sanitized.startsWith('/uploads/')) {
    // Serve uploads from the Next.js public folder to avoid dev-time `next/image`
    // upstream blocking when pointing at localhost/private IPs.
    // Express uploads are mirrored into `public/uploads`.
    return sanitized;
  }

  return sanitized;
}
