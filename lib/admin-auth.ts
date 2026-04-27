export function applyNoCacheHeaders(headers: Headers): Headers {
  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  headers.set('Pragma', 'no-cache');
  headers.set('Expires', '0');
  return headers;
}

export function getAdminAuthHeaders(init?: HeadersInit): Headers {
  const headers = new Headers(init ?? {});

  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return applyNoCacheHeaders(headers);
}
