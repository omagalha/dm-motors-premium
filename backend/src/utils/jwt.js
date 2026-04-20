const crypto = require("crypto");

function base64UrlEncode(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${padding}`, "base64").toString("utf8");
}

function signSegment(value, secret) {
  return crypto
    .createHmac("sha256", secret)
    .update(value)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function signJwt(payload, secret, expiresInSeconds) {
  const nowInSeconds = Math.floor(Date.now() / 1000);
  const header = { alg: "HS256", typ: "JWT" };
  const completePayload = {
    ...payload,
    iat: nowInSeconds,
    exp: nowInSeconds + expiresInSeconds,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(completePayload));
  const signature = signSegment(`${encodedHeader}.${encodedPayload}`, secret);

  return {
    token: `${encodedHeader}.${encodedPayload}.${signature}`,
    payload: completePayload,
  };
}

function verifyJwt(token, secret) {
  if (!token || typeof token !== "string") {
    throw new Error("Token ausente.");
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Token invalido.");
  }

  const [encodedHeader, encodedPayload, signature] = parts;
  const expectedSignature = signSegment(`${encodedHeader}.${encodedPayload}`, secret);

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    throw new Error("Assinatura invalida.");
  }

  const header = JSON.parse(base64UrlDecode(encodedHeader));
  if (header.alg !== "HS256" || header.typ !== "JWT") {
    throw new Error("Cabecalho JWT invalido.");
  }

  const payload = JSON.parse(base64UrlDecode(encodedPayload));
  const nowInSeconds = Math.floor(Date.now() / 1000);

  if (typeof payload.exp !== "number" || payload.exp <= nowInSeconds) {
    throw new Error("Token expirado.");
  }

  return payload;
}

module.exports = {
  signJwt,
  verifyJwt,
};
