// backend/src/services/n8nService.js
const axios = require('axios');

async function triggerSaleContractWorkflow(payload) {
  const webhookUrl = process.env.N8N_SALE_CONTRACT_WEBHOOK_URL;
  if (!webhookUrl) throw new Error('N8N_SALE_CONTRACT_WEBHOOK_URL not set');

  const response = await axios.post(webhookUrl, payload, {
    timeout: 5000,
    headers: { 'Content-Type': 'application/json' }
  });

  return response.data; // n8n retorna { executionId }
}

module.exports = { triggerSaleContractWorkflow };
