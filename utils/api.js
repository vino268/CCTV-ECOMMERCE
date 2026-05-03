export const fetchWithAuth = async (url, options = {}) => {
  // Always use same-origin (relative) paths so HTTP-only cookies are sent correctly.
  // The NEXT_PUBLIC_API_URL env var is intentionally empty — all API calls go through
  // Next.js API routes which read cookies from the same origin.
  const resolvedUrl = String(url || '');

  const headers = new Headers(options.headers || {});
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  if (!headers.has("Content-Type") && !isFormData) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(resolvedUrl, {
    ...options,
    credentials: "include",
    headers,
  });
};
