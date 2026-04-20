import { clearStoredAdminSession, getStoredAdminToken } from "@/lib/adminSession";

// Thin fetch wrapper around the backend API.
// Configure the base URL via the VITE_API_URL environment variable.
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
  // Optional auth token override.
  token?: string;
  // Skip automatic Bearer token injection for public endpoints like /auth/login.
  skipAuth?: boolean;
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

  const authToken = options.token ?? (!options.skipAuth ? getStoredAdminToken() : null);
  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  if (options.tenant) headers.set("X-Tenant", options.tenant);

  const url = `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, { ...options, headers });
  const contentType = res.headers.get("Content-Type") ?? "";

  if (!res.ok) {
    let message = res.statusText || `HTTP ${res.status}`;

    if (contentType.includes("application/json")) {
      const payload = (await res.json().catch(() => null)) as
        | { message?: string; error?: string }
        | null;

      if (payload?.message) {
        message = payload.message;
      } else if (payload?.error) {
        message = payload.error;
      }
    } else {
      const text = await res.text().catch(() => "");
      if (text) {
        message = text;
      }
    }

    if (res.status === 401 && !options.skipAuth) {
      clearStoredAdminSession();
    }

    throw new ApiError(message, res.status);
  }

  // Endpoints that return 204 No Content
  if (res.status === 204) return undefined as T;
  if (!contentType.includes("application/json")) {
    return undefined as T;
  }

  return (await res.json()) as T;
}
