const { assertAdminAuthConfigured, getAdminAuthConfig } = require("../config/adminAuth");
const { verifyJwt } = require("../utils/jwt");

function extractBearerToken(headerValue) {
  if (!headerValue || typeof headerValue !== "string") {
    return null;
  }

  const match = headerValue.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

function requireAdminAuth(req, res, next) {
  try {
    assertAdminAuthConfigured();

    const token = extractBearerToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ message: "Token de acesso ausente." });
    }

    const { jwtSecret } = getAdminAuthConfig();
    const payload = verifyJwt(token, jwtSecret);

    if (payload.role !== "admin" || !payload.email) {
      return res.status(401).json({ message: "Token de acesso invalido." });
    }

    req.admin = payload;
    return next();
  } catch (error) {
    const statusCode = error.statusCode || 401;
    return res.status(statusCode).json({
      message:
        statusCode === 500
          ? error.message
          : "Sessao invalida ou expirada. Faca login novamente.",
    });
  }
}

module.exports = requireAdminAuth;
