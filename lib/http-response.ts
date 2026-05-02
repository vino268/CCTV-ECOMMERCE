export function buildApiUrl(path: string): string {
  // Use NODE_ENV for automatic environment switching
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  // Always keep Next API and uploads same-origin.
  // This avoids CORS/cookie issues and prevents empty pages when the Express server isn't running.
  if (normalizedPath === '/api' || normalizedPath.startsWith('/api/')) {
    return normalizedPath;
  }

  if (normalizedPath === '/uploads' || normalizedPath.startsWith('/uploads/')) {
    return normalizedPath;
  }

  // Development environment - use localhost backend
  if (process.env.NODE_ENV === 'development') {
    const envBase = (process.env.NEXT_PUBLIC_API_URL || '').trim().replace(/\/+$/, '');
    if (envBase) {
      return `${envBase}${normalizedPath}`;
    }
    return `http://localhost:5000${normalizedPath}`;
  }

  // Production environment - use production domain
  const renderUrl = (process.env.NEXT_PUBLIC_RENDER_URL || '').trim().replace(/\/+$/, '');
  if (renderUrl) {
    return `${renderUrl}${normalizedPath}`;
  }

  // Fallback: same-origin relative path
  return normalizedPath;
}

export async function parseResponseBody<T = unknown>(res: Response): Promise<T | Record<string, never>> {
  const contentType = (res.headers.get('content-type') || '').toLowerCase();

  if (contentType.includes('application/json')) {
    return res.json().catch(() => ({}));
  }

  const text = await res.text().catch(() => '');
  const trimmed = text.trim();

  if (!trimmed) {
    return {};
  }

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return JSON.parse(trimmed) as T;
    } catch {
      return {};
    }
  }

  return {};
}
