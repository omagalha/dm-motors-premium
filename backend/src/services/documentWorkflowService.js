const { buildVehicleSaleDocumentPayload } = require("../utils/vehicleDocumentPayload");
const { buildVehicleSaleContractDraft } = require("../utils/vehicleSaleContractDraft");
const { validateVehicleForSaleDocument } = require("../utils/vehicleDocumentValidation");

const SALE_CONTRACT_WORKFLOW = "sale-contract";

async function runSaleContractWorkflow(vehicle) {
  const validation = validateVehicleForSaleDocument(vehicle);
  const ready = validation.ready;
  const payload = ready ? buildVehicleSaleDocumentPayload(vehicle) : null;
  const draft = payload ? buildVehicleSaleContractDraft(payload) : null;

  return {
    workflow: SALE_CONTRACT_WORKFLOW,
    ready,
    validation,
    payload,
    draft,
    nextStep: ready ? "ready_for_automation" : "complete_required_fields",
  };
}

module.exports = {
  SALE_CONTRACT_WORKFLOW,
  runSaleContractWorkflow,
};
