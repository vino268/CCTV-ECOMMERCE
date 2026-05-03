export const BASE_URL = (() => {
  const envBase = (process.env.NEXT_PUBLIC_API_URL || '').trim().replace(/\/+$/, '');
  if (envBase) return envBase;

  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return 'http://localhost:3000';
})();


function normalizePath(value: string): string {
  return value.replace(/\\/g, '/');
}

export function toProfileImageUrl(value?: string | null, cacheBust?: number): string {
  const raw = String(value || '').trim();
  if (!raw) return '';

  // Keep non-server sources intact so local previews continue to work.
  if (/^(https?:\/\/|blob:|data:)/i.test(raw)) {
    return raw;
  }

  const normalized = normalizePath(raw);
  const pathWithSlash = normalized.startsWith('/') ? normalized : `/${normalized}`;
  const absolute = `${BASE_URL}${pathWithSlash}`;

  if (!cacheBust) {
    return absolute;
  }

  const delimiter = absolute.includes('?') ? '&' : '?';
  return `${absolute}${delimiter}t=${cacheBust}`;
}
