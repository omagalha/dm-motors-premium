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

  const response = await axios.post(webhookUrl, payload, {
    timeout: 5000,
    headers: { "Content-Type": "application/json" },
  });

  return response.data; // n8n retorna { executionId }
}

module.exports = {
  triggerSaleContractWorkflow,
  getSaleContractWebhookUrl,
  SALE_CONTRACT_WEBHOOK_PATH,
};
