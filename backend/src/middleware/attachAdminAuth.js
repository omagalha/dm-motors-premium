const { getAdminAuthConfig, isAdminAuthConfigured } = require("../config/adminAuth");
const { verifyJwt } = require("../utils/jwt");

function extractBearerToken(headerValue) {
  if (!headerValue || typeof headerValue !== "string") {
    return null;
  }

  const match = headerValue.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

function attachAdminAuth(req, res, next) {
  try {
    if (!isAdminAuthConfigured()) {
      return next();
    }

    const token = extractBearerToken(req.headers.authorization);
    if (!token) {
      return next();
    }

    const { jwtSecret } = getAdminAuthConfig();
    const payload = verifyJwt(token, jwtSecret);

    if (payload.role === "admin" && payload.email) {
      req.admin = payload;
    }
  } catch {
    /* Invalid public bearer tokens should not break public routes. */
  }

  return next();
}

module.exports = attachAdminAuth;
