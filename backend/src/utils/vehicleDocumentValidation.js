const { buildVehicleSaleDocumentPayload } = require("./vehicleDocumentPayload");

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function hasPositiveNumber(value) {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function validateVehicleForSaleDocument(vehicle) {
  const payload = buildVehicleSaleDocumentPayload(vehicle);
  const missingFields = [];
  const warnings = [];

  if (!hasText(payload.vehicle.plate)) {
    missingFields.push("internal.plate");
  }

  if (!hasText(payload.vehicle.renavam)) {
    missingFields.push("internal.renavam");
  }

  if (!hasText(payload.vehicle.chassis)) {
    missingFields.push("internal.chassis");
  }

  if (!hasText(payload.vehicle.engineNumber)) {
    missingFields.push("internal.engineNumber");
  }

  if (!hasText(payload.buyer.name)) {
    missingFields.push("internal.buyerName");
  }

  if (!hasText(payload.buyer.document)) {
    missingFields.push("internal.buyerDocument");
  }

  if (!hasText(payload.previousOwner.name)) {
    missingFields.push("internal.previousOwnerName");
  }

  if (!hasText(payload.previousOwner.document)) {
    missingFields.push("internal.previousOwnerDocument");
  }

  if (!hasPositiveNumber(payload.transaction.salePrice)) {
    missingFields.push("price");
  }

  // For now, acquisitionDate is the canonical document date until a dedicated operation date exists.
  if (!hasText(payload.transaction.acquisitionDate)) {
    missingFields.push("internal.acquisitionDate");
  }

  if (payload.documentation.hasFines) {
    warnings.push("Veiculo marcado com multas.");
  }

  if (payload.documentation.hasLien) {
    warnings.push("Alienacao ativa.");
  }

  if (!payload.documentation.hasPaidIpva) {
    warnings.push("IPVA nao marcado como pago.");
  }

  if (!payload.documentation.hasInspectionReport) {
    warnings.push("Laudo de vistoria nao marcado.");
  }

  return {
    ready: missingFields.length === 0,
    missingFields,
    warnings,
  };
}

module.exports = {
  validateVehicleForSaleDocument,
};
