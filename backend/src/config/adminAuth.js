const crypto = require("crypto");

function getAdminAuthConfig() {
  return {
    email: String(process.env.ADMIN_EMAIL ?? "").trim().toLowerCase(),
    password: String(process.env.ADMIN_PASSWORD ?? ""),
    jwtSecret: String(process.env.JWT_SECRET ?? ""),
    jwtExpiresInHours: Number(process.env.JWT_EXPIRES_IN_HOURS ?? 12),
  };
}

function isAdminAuthConfigured() {
  const config = getAdminAuthConfig();
  return Boolean(config.email && config.password && config.jwtSecret);
}

function assertAdminAuthConfigured() {
  if (!isAdminAuthConfigured()) {
    const error = new Error(
      "Autenticacao do admin nao configurada. Defina ADMIN_EMAIL, ADMIN_PASSWORD e JWT_SECRET."
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
  const config = getAdminAuthConfig();
  return (
    safeEquals(String(email ?? "").trim().toLowerCase(), config.email) &&
    safeEquals(String(password ?? ""), config.password)
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
  getAdminAuthConfig,
  getJwtExpirationSeconds,
  isAdminAuthConfigured,
  isValidAdminCredential,
};
