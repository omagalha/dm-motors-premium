// Thin fetch wrapper around the backend API.
// Configure the base URL via the VITE_API_URL environment variable.
// Example for local development: VITE_API_URL=http://localhost:3000
//
// When VITE_API_URL is not defined, the helpers below behave as if the backend
// were unreachable, and callers should fall back to local data.

const API_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");

export const isApiConfigured = Boolean(API_URL);

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

interface ApiOptions extends RequestInit {
  // Optional auth token; when implemented, will be attached as Bearer.
  token?: string;
  // Tenant slug for multi-tenant requests (Phase 2).
  tenant?: string;
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  if (!API_URL) {
    throw new ApiError("VITE_API_URL is not configured", 0);
  }

  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (options.token) headers.set("Authorization", `Bearer ${options.token}`);
  if (options.tenant) headers.set("X-Tenant", options.tenant);

  const url = `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new ApiError(text || `HTTP ${res.status}`, res.status);
  }

  // Endpoints that return 204 No Content
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
