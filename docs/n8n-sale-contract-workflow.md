# N8N Sale Contract Workflow

## Canonical payload

The backend must keep sending this exact shape to n8n:

```json
{
  "executionId": "sale-contract_123",
  "vehicleId": "abc123",
  "workflow": "sale-contract",
  "callbackUrl": "https://backend.example.com/vehicles/abc123/document-workflows/sale-contract/callback",
  "draft": {
    "title": "Pre-contrato de compra e venda",
    "vehicle": {},
    "buyer": {},
    "previousOwner": {},
    "financial": {},
    "documentation": {}
  }
}
```

The `draft` is the single source of truth for the contract content in n8n.

## 3.3-A checklist

The backend trigger for the sale contract workflow must send this payload to n8n:

- `executionId`
- `vehicleId`
- `workflow`
- `draft`
- `callbackUrl`

Current backend source of truth:

- `backend/src/controllers/vehicleDocumentController.js`
- `backend/src/services/n8nService.js`

## Important n8n note

If the workflow uses a `Set` node between the Webhook and the callback step, do not let it drop
`vehicleId`.

Use one of these options:

1. Enable `Keep All Values`
2. Re-add `vehicleId` manually in the node output

Without `vehicleId`, the callback cannot target the correct vehicle in the backend.

## Callback contract

The callback back to the backend must send:

- `status`: `completed` or `failed`
- `executionId`
- `documentUrl`: empty string for now in phase 3.3-A
- `errorMessage`

Header required:

- `x-callback-secret`

Callback route:

- `POST /vehicles/:id/document-workflows/sale-contract/callback`

## HTML generation in n8n

Before generating a PDF, build a simple HTML string from `draft`.

Recommended node:

1. `Code`

Example `Code` node:

```js
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

return items.map((item) => {
  const draft = item.json.draft ?? {};
  const vehicle = draft.vehicle ?? {};
  const buyer = draft.buyer ?? {};
  const previousOwner = draft.previousOwner ?? {};
  const financial = draft.financial ?? {};
  const documentation = draft.documentation ?? {};

  const html = `
    <html>
      <body style="font-family: Arial, sans-serif; color: #111; line-height: 1.5;">
        <h1>Contrato de Compra e Venda</h1>
        <p><strong>Veiculo:</strong> ${escapeHtml(vehicle.name)} ${escapeHtml(vehicle.year)}</p>
        <p><strong>Placa:</strong> ${escapeHtml(vehicle.plate)}</p>
        <p><strong>Comprador:</strong> ${escapeHtml(buyer.name)}</p>
        <p><strong>Documento:</strong> ${escapeHtml(buyer.document)}</p>
        <p><strong>Proprietario anterior:</strong> ${escapeHtml(previousOwner.name)}</p>
        <p><strong>Documento anterior:</strong> ${escapeHtml(previousOwner.document)}</p>
        <p><strong>Valor da venda:</strong> ${escapeHtml(financial.salePrice)}</p>
        <p><strong>Procedencia:</strong> ${escapeHtml(documentation.provenance)}</p>
      </body>
    </html>
  `.trim();

  return {
    json: {
      ...item.json,
      html,
    },
  };
});
```

Output expected from this step:

- `html`

## 3.3-B

Next phase:

1. Generate the real PDF in n8n
2. Upload the file
3. Return `documentUrl` in the callback
4. Persist `documentUrl` in the backend
5. Show the document link in the admin
