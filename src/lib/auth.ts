// Provisional admin auth — single master password kept in localStorage.
// This is intentionally simple and NOT production-grade. It exists so the
// /admin route is not openly accessible during the prototype phase.
//
// When the backend is connected, replace this with a real JWT/session flow:
//   - exchange email + password at POST /auth/login
//   - store the returned token (httpOnly cookie ideally)
//   - update isAuthenticated() / login() / logout() to use it
//   - add multi-tenant: include the tenant slug in the auth payload

const SESSION_KEY = "dm-motors:admin:session:v1";
// Default password for the prototype. Change this before sharing the URL.
// In a real deployment this would never live in the frontend.
const MASTER_PASSWORD = "dmmotors2025";

function isBrowser() {
  return typeof window !== "undefined";
}

export interface AdminSession {
  loggedInAt: number;
  email?: string;
}

export function isAuthenticated(): boolean {
  if (!isBrowser()) return false;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    const session = JSON.parse(raw) as AdminSession;
    return Boolean(session?.loggedInAt);
  } catch {
    return false;
  }
}

export function login(email: string, password: string): boolean {
  if (!isBrowser()) return false;
  if (password !== MASTER_PASSWORD) return false;
  const session: AdminSession = { loggedInAt: Date.now(), email: email || undefined };
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return true;
}

export function logout() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(SESSION_KEY);
}

export function getSession(): AdminSession | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AdminSession) : null;
  } catch {
    return null;
  }
}
