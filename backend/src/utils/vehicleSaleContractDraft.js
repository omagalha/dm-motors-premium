function normalizeString(value, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function normalizeNumber(value, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function normalizeBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function buildVehicleSaleContractDraft(documentPayload) {
  const payload =
    documentPayload && typeof documentPayload === "object" ? documentPayload : {};
  const vehicle =
    payload.vehicle && typeof payload.vehicle === "object" ? payload.vehicle : {};
  const transaction =
    payload.transaction && typeof payload.transaction === "object" ? payload.transaction : {};
  const buyer = payload.buyer && typeof payload.buyer === "object" ? payload.buyer : {};
  const previousOwner =
    payload.previousOwner && typeof payload.previousOwner === "object"
      ? payload.previousOwner
      : {};
  const documentation =
    payload.documentation && typeof payload.documentation === "object"
      ? payload.documentation
      : {};

  return {
    title: "Pre-contrato de compra e venda",
    vehicleId: normalizeString(vehicle.id),
    workflow: "sale-contract",
    generatedAt: normalizeString(payload.generatedAt) || new Date().toISOString(),
    parties: {
      buyer: {
        name: normalizeString(buyer.name),
        document: normalizeString(buyer.document),
      },
      seller: {
        name: normalizeString(previousOwner.name),
        document: normalizeString(previousOwner.document),
      },
    },
    vehicle: {
      id: normalizeString(vehicle.id),
      name: normalizeString(vehicle.name),
      brand: normalizeString(vehicle.brand),
      model: normalizeString(vehicle.model),
      year: normalizeNumber(vehicle.year),
      plate: normalizeString(vehicle.plate),
      renavam: normalizeString(vehicle.renavam),
      chassis: normalizeString(vehicle.chassis),
      engineNumber: normalizeString(vehicle.engineNumber),
      color: normalizeString(vehicle.color),
      mileage: normalizeNumber(vehicle.mileage),
      fuel: normalizeString(vehicle.fuel),
      transmission: normalizeString(vehicle.transmission),
    },
    financial: {
      salePrice: normalizeNumber(transaction.salePrice),
      acquisitionValue: normalizeNumber(transaction.acquisitionValue),
      minimumSaleValue: normalizeNumber(transaction.minimumSaleValue),
      financedValue: normalizeNumber(transaction.financedValue),
      acquisitionDate: normalizeString(transaction.acquisitionDate),
    },
    documentation: {
      hasInspectionReport: normalizeBoolean(documentation.hasInspectionReport),
      hasPaidIpva: normalizeBoolean(documentation.hasPaidIpva),
      hasFines: normalizeBoolean(documentation.hasFines),
      hasLien: normalizeBoolean(documentation.hasLien),
      provenance: normalizeString(documentation.provenance),
      spareKeyCount: normalizeString(documentation.spareKeyCount),
      manualCount: normalizeString(documentation.manualCount),
      legalNotes: normalizeString(documentation.legalNotes),
      internalNotes: normalizeString(documentation.internalNotes),
    },
  };
}

module.exports = {
  buildVehicleSaleContractDraft,
};
