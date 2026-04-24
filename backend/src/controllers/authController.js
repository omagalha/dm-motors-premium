const {
  assertAdminAuthConfigured,
  findAdminUserByCredentials,
  getJwtExpirationSeconds,
  getAdminAuthConfig,
} = require("../config/adminAuth");
const { signJwt } = require("../utils/jwt");

function createSessionResponse({ user, payload, token }) {
  return {
    token,
    user: {
      email: user.email,
      name: user.name,
      role: user.role,
      permissions: user.permissions,
    },
    loggedInAt: payload.iat * 1000,
    expiresAt: payload.exp * 1000,
  };
}

async function login(req, res) {
  try {
    assertAdminAuthConfigured();

    const email = String(req.body?.email ?? "").trim().toLowerCase();
    const password = String(req.body?.password ?? "");

    if (!email || !password) {
      return res.status(400).json({ message: "Informe e-mail e senha." });
    }

    const adminUser = findAdminUserByCredentials(email, password);
    if (!adminUser) {
      return res.status(401).json({ message: "Credenciais invalidas." });
    }

    const config = getAdminAuthConfig();
    const { token, payload } = signJwt(
      {
        sub: adminUser.email,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
        permissions: adminUser.permissions,
      },
      config.jwtSecret,
      getJwtExpirationSeconds()
    );

    return res.status(200).json(createSessionResponse({ user: adminUser, payload, token }));
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      message: error.message || "Erro ao autenticar admin.",
    });
  }
}

async function getSession(req, res) {
  return res.status(200).json({
    user: {
      email: req.admin.email,
      name: req.admin.name,
      role: req.admin.role,
      permissions: req.admin.permissions,
    },
    loggedInAt: typeof req.admin.iat === "number" ? req.admin.iat * 1000 : undefined,
    expiresAt: typeof req.admin.exp === "number" ? req.admin.exp * 1000 : undefined,
  });
}

async function logout(req, res) {
  return res.status(204).send();
}

module.exports = {
  getSession,
  login,
  logout,
};
