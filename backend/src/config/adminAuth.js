const crypto = require("crypto");

const ADMIN_ROLE_VALUES = new Set(["super_admin", "collaborator"]);

function getAdminAuthConfig() {
  return {
    email: String(process.env.ADMIN_EMAIL ?? "").trim().toLowerCase(),
    password: String(process.env.ADMIN_PASSWORD ?? ""),
    jwtSecret: String(process.env.JWT_SECRET ?? ""),
    jwtExpiresInHours: Number(process.env.JWT_EXPIRES_IN_HOURS ?? 12),
  };
}

function getRolePermissions(role) {
  if (role === "super_admin") {
    return {
      canViewGeneralFinance: true,
    };
  }

  return {
    canViewGeneralFinance: false,
  };
}

function normalizeAdminUser(candidate) {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return null;
  }

  const email = String(candidate.email ?? "")
    .trim()
    .toLowerCase();
  const password = String(candidate.password ?? "");
  const name = String(candidate.name ?? "").trim();
  const normalizedRole = String(candidate.role ?? "collaborator")
    .trim()
    .toLowerCase();
  const role = ADMIN_ROLE_VALUES.has(normalizedRole) ? normalizedRole : "collaborator";

  if (!email || !password) {
    return null;
  }

  const basePermissions = getRolePermissions(role);
  const customPermissions =
    candidate.permissions && typeof candidate.permissions === "object" && !Array.isArray(candidate.permissions)
      ? candidate.permissions
      : {};

  return {
    email,
    password,
    name: name || email,
    role,
    permissions: {
      canViewGeneralFinance:
        typeof customPermissions.canViewGeneralFinance === "boolean"
          ? customPermissions.canViewGeneralFinance
          : basePermissions.canViewGeneralFinance,
    },
  };
}

function getConfiguredAdminUsers() {
  const config = getAdminAuthConfig();
  const users = [];
  const rawUsers = String(process.env.ADMIN_USERS ?? "").trim();

  if (rawUsers) {
    try {
      const parsed = JSON.parse(rawUsers);
      if (Array.isArray(parsed)) {
        parsed
          .map(normalizeAdminUser)
          .filter(Boolean)
          .forEach((user) => users.push(user));
      }
    } catch (error) {
      const parseError = new Error(
        "ADMIN_USERS invalido. Use um JSON de array com email, password, role e permissions."
      );
      parseError.statusCode = 500;
      throw parseError;
    }
  }

  if (config.email && config.password) {
    users.push({
      email: config.email,
      password: config.password,
      name: config.email,
      role: "super_admin",
      permissions: {
        canViewGeneralFinance: true,
      },
    });
  }

  const deduped = new Map();
  users.forEach((user) => {
    deduped.set(user.email, user);
  });

  return [...deduped.values()];
}

function isAdminAuthConfigured() {
  const config = getAdminAuthConfig();
  return Boolean(config.jwtSecret && getConfiguredAdminUsers().length);
}

function assertAdminAuthConfigured() {
  if (!isAdminAuthConfigured()) {
    const error = new Error(
      "Autenticacao do admin nao configurada. Defina ADMIN_USERS ou ADMIN_EMAIL/ADMIN_PASSWORD e JWT_SECRET."
    );
    error.statusCode = 500;
    throw error;
  }
}

function safeEquals(left, right) {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function isValidAdminCredential(email, password) {
  return Boolean(findAdminUserByCredentials(email, password));
}

function findAdminUserByCredentials(email, password) {
  const normalizedEmail = String(email ?? "")
    .trim()
    .toLowerCase();
  const normalizedPassword = String(password ?? "");

  return (
    getConfiguredAdminUsers().find(
      (user) => safeEquals(normalizedEmail, user.email) && safeEquals(normalizedPassword, user.password)
    ) ?? null
  );
}

function getJwtExpirationSeconds() {
  const config = getAdminAuthConfig();
  const hours = Number.isFinite(config.jwtExpiresInHours) && config.jwtExpiresInHours > 0
    ? config.jwtExpiresInHours
    : 12;

  return Math.round(hours * 60 * 60);
}

module.exports = {
  assertAdminAuthConfigured,
  findAdminUserByCredentials,
  getAdminAuthConfig,
  getConfiguredAdminUsers,
  getJwtExpirationSeconds,
  getRolePermissions,
  isAdminAuthConfigured,
  isValidAdminCredential,
};
