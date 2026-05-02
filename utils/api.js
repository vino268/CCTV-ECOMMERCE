export const fetchWithAuth = async (url, options = {}) => {
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || '').trim().replace(/\/+$/, '');
  const resolvedUrl = (() => {
    const raw = String(url || '');
    if (/^https?:\/\//i.test(raw)) return raw;
    if (!apiBase) return raw;
    if (!raw.startsWith('/')) return `${apiBase}/${raw}`;
    return `${apiBase}${raw}`;
  })();

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
