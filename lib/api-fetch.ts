type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

// Use relative paths for same-origin requests (cookies sent with credentials:'include')
const API_BASE = "";

export async function apiFetch<T>(
  path: string,
  options: {
    method?: HttpMethod;
    body?: unknown;
    headers?: Record<string, string>;
  } = {}
): Promise<T> {
  const method = options.method || "GET";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: "include",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = (data as { error?: string; message?: string })?.error ||
      (data as { error?: string; message?: string })?.message ||
      "Request failed";
    throw new Error(message);
  }

  return data as T;
}
