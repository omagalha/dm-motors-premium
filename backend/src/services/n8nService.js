// backend/src/services/n8nService.js
const axios = require("axios");

const SALE_CONTRACT_WEBHOOK_PATH = "/webhook/sale-contract";

function getSaleContractWebhookUrl() {
  const webhookUrl = process.env.N8N_SALE_CONTRACT_WEBHOOK_URL;

  if (!webhookUrl) {
    throw new Error("N8N_SALE_CONTRACT_WEBHOOK_URL not set");
  }

  let parsedWebhookUrl;

  try {
    parsedWebhookUrl = new URL(webhookUrl);
  } catch (error) {
    throw new Error("N8N_SALE_CONTRACT_WEBHOOK_URL is not a valid URL");
  }

  if (parsedWebhookUrl.pathname !== SALE_CONTRACT_WEBHOOK_PATH) {
    throw new Error(
      `N8N_SALE_CONTRACT_WEBHOOK_URL must use the path ${SALE_CONTRACT_WEBHOOK_PATH}`,
    );
  }

  return parsedWebhookUrl.toString();
}

async function triggerSaleContractWorkflow(payload) {
  const webhookUrl = getSaleContractWebhookUrl();

  try {
    console.log("[n8n] webhookUrl:", webhookUrl);

    const response = await axios.post(webhookUrl, payload, {
      timeout: 5000,
      headers: { "Content-Type": "application/json" },
    });

    console.log("[n8n] status:", response.status);
    console.log("[n8n] data:", response.data);

    return response.data; // n8n retorna { executionId }
  } catch (error) {
    console.error("[n8n] webhookUrl:", webhookUrl);
    console.error("[n8n] status:", error.response?.status);
    console.error("[n8n] data:", error.response?.data);
    console.error("[n8n] message:", error.message);
    throw error;
  }
}

module.exports = {
  triggerSaleContractWorkflow,
  getSaleContractWebhookUrl,
  SALE_CONTRACT_WEBHOOK_PATH,
};
