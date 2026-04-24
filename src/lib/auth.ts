import type { AdminSession, AdminUser } from "@/lib/adminSession";
import {
  clearStoredAdminSession,
  getStoredAdminSession,
  saveStoredAdminSession,
} from "@/lib/adminSession";
import { apiFetch } from "@/services/apiClient";

interface AuthResponse {
  token?: string;
  user?: {
    email?: string;
    name?: string;
    role?: string;
    permissions?: {
      canViewGeneralFinance?: boolean;
    };
  };
  loggedInAt?: number;
  expiresAt?: number;
}

function normalizeAuthSession(payload: AuthResponse, fallbackToken?: string): AdminSession {
  const token = typeof payload.token === "string" && payload.token ? payload.token : fallbackToken;
  const email = payload.user?.email?.trim();
  const name = payload.user?.name?.trim();
  const role = payload.user?.role;
  const canViewGeneralFinance = payload.user?.permissions?.canViewGeneralFinance;
  const loggedInAt = payload.loggedInAt;
  const expiresAt = payload.expiresAt;

  if (
    !token ||
    !email ||
    !name ||
    (role !== "super_admin" && role !== "collaborator") ||
    typeof canViewGeneralFinance !== "boolean" ||
    typeof loggedInAt !== "number" ||
    !Number.isFinite(loggedInAt) ||
    typeof expiresAt !== "number" ||
    !Number.isFinite(expiresAt)
  ) {
    throw new Error("Resposta invalida do servidor de autenticacao.");
  }

  return {
    token,
    user: {
      email,
      name,
      role,
      permissions: {
        canViewGeneralFinance,
      },
    },
    loggedInAt,
    expiresAt,
  };
}

export function isAuthenticated(): boolean {
  return Boolean(getStoredAdminSession());
}

export function getSession(): AdminSession | null {
  return getStoredAdminSession();
}

export async function login(email: string, password: string): Promise<AdminSession> {
  const response = await apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    skipAuth: true,
    body: JSON.stringify({
      email: email.trim(),
      password,
    }),
  });

  const session = normalizeAuthSession(response);
  saveStoredAdminSession(session);
  return session;
}

export async function restoreSession(): Promise<AdminSession | null> {
  const existingSession = getStoredAdminSession();
  if (!existingSession) return null;

  try {
    const response = await apiFetch<AuthResponse>("/auth/session");
    const session = normalizeAuthSession(response, existingSession.token);
    saveStoredAdminSession(session);
    return session;
  } catch {
    clearStoredAdminSession();
    return null;
  }
}

export async function logout() {
  const existingSession = getStoredAdminSession();

  try {
    if (existingSession) {
      await apiFetch<void>("/auth/logout", {
        method: "POST",
      });
    }
  } catch {
    /* Stateless logout can fail silently; local cleanup still wins. */
  } finally {
    clearStoredAdminSession();
  }
}

export type { AdminSession, AdminUser };
