export function buildApiUrl(path: string): string {
  const envBase = (process.env.NEXT_PUBLIC_API_URL || '').trim().replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (envBase) {
    return `${envBase}${normalizedPath}`;
  }

  if (typeof window !== 'undefined' && window.location.hostname === 'localhost' && window.location.port === '3000') {
    return `http://localhost:5000${normalizedPath}`;
  }

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
