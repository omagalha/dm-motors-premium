export interface AdminUser {
  email: string;
  role: "admin";
}

export interface AdminSession {
  token: string;
  user: AdminUser;
  loggedInAt: number;
  expiresAt: number;
}

const SESSION_KEY = "dm-motors:admin:session:v2";
const SESSION_EVENT = "dm-motors:admin-session-changed";

function isBrowser() {
  return typeof window !== "undefined";
}

function notifySessionChanged() {
  if (!isBrowser()) return;
  window.dispatchEvent(new Event(SESSION_EVENT));
}

function isValidAdminSession(session: unknown): session is AdminSession {
  if (!session || typeof session !== "object") return false;

  const candidate = session as Partial<AdminSession>;

  return Boolean(
    typeof candidate.token === "string" &&
      candidate.token &&
      typeof candidate.loggedInAt === "number" &&
      Number.isFinite(candidate.loggedInAt) &&
      typeof candidate.expiresAt === "number" &&
      Number.isFinite(candidate.expiresAt) &&
      candidate.user &&
      typeof candidate.user.email === "string" &&
      candidate.user.email &&
      candidate.user.role === "admin"
  );
}

function hasSessionExpired(session: AdminSession) {
  return session.expiresAt <= Date.now();
}

export function saveStoredAdminSession(session: AdminSession) {
  if (!isBrowser()) return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  notifySessionChanged();
}

export function clearStoredAdminSession() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(SESSION_KEY);
  notifySessionChanged();
}

export function getStoredAdminSession(): AdminSession | null {
  if (!isBrowser()) return null;

  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as unknown;
    if (!isValidAdminSession(parsed)) {
      clearStoredAdminSession();
      return null;
    }

    if (hasSessionExpired(parsed)) {
      clearStoredAdminSession();
      return null;
    }

    return parsed;
  } catch {
    clearStoredAdminSession();
    return null;
  }
}

export function getStoredAdminToken() {
  return getStoredAdminSession()?.token ?? null;
}

export function subscribeToAdminSessionChanges(callback: () => void) {
  if (!isBrowser()) return () => {};

  const handleStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === SESSION_KEY) {
      callback();
    }
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(SESSION_EVENT, callback);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(SESSION_EVENT, callback);
  };
}
