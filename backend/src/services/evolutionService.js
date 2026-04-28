const axios = require("axios");

function getEvolutionConfig() {
  const baseUrl = (process.env.EVOLUTION_API_URL ?? "").replace(/\/+$/, "");
  const apiKey = process.env.EVOLUTION_API_KEY ?? "";
  const instanceName = process.env.EVOLUTION_INSTANCE_NAME ?? "";

  return {
    baseUrl,
    apiKey,
    instanceName,
    enabled: Boolean(baseUrl && apiKey && instanceName),
  };
}

function normalizeBrazilPhone(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) return "";
  return digits.startsWith("55") ? digits : `55${digits}`;
}

async function sendTextMessage(phone, text) {
  const config = getEvolutionConfig();
  if (!config.enabled) {
    return { sent: false, skipped: true, reason: "Evolution API not configured" };
  }

  const number = normalizeBrazilPhone(phone);
  if (!number) {
    return { sent: false, skipped: true, reason: "Missing WhatsApp number" };
  }

  await axios.post(
    `${config.baseUrl}/message/sendText/${encodeURIComponent(config.instanceName)}`,
    { number, text },
    {
      timeout: 8000,
      headers: {
        "Content-Type": "application/json",
        apikey: config.apiKey,
      },
    },
  );

  return { sent: true, skipped: false, reason: "" };
}

module.exports = {
  getEvolutionConfig,
  normalizeBrazilPhone,
  sendTextMessage,
};
