const { serializeVehicle } = require("./vehicleContract");

const EMPTY_INTERNAL = {
  plate: "",
  renavam: "",
  chassis: "",
  engineNumber: "",
  buyerDocument: "",
  buyerName: "",
  previousOwnerDocument: "",
  previousOwnerName: "",
  acquisitionDate: "",
  acquisitionValue: 0,
  minimumSaleValue: 0,
  financedValue: 0,
  internalNotes: "",
  provenance: "",
  spareKeyCount: "",
  manualCount: "",
  hasInspectionReport: false,
  hasPaidIpva: false,
  hasFines: false,
  hasLien: false,
  legalNotes: "",
};

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

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

function normalizeDateOnly(value) {
  const normalized = normalizeString(value);
  if (!normalized) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    const [year] = normalized.split("-");
    const numericYear = Number(year);

    if (Number.isFinite(numericYear) && numericYear >= 1900 && numericYear <= 2100) {
      return normalized;
    }

    return "";
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const year = parsed.getUTCFullYear();
  if (year < 1900 || year > 2100) {
    return "";
  }

  return parsed.toISOString().slice(0, 10);
}

function getVehicleId(vehicle) {
  if (!isRecord(vehicle)) return "";

  const rawId = vehicle.id ?? vehicle._id;
  if (rawId === undefined || rawId === null) return "";

  const normalized = String(rawId).trim();
  return normalized === "undefined" || normalized === "null" ? "" : normalized;
}

function buildVehicleSaleDocumentPayload(vehicle) {
  const source = isRecord(vehicle) ? vehicle : {};
  const serializedVehicle = serializeVehicle(source, { isAdmin: true });
  const internal = isRecord(serializedVehicle.internal)
    ? { ...EMPTY_INTERNAL, ...serializedVehicle.internal }
    : EMPTY_INTERNAL;

  return {
    vehicle: {
      id: getVehicleId(source) || getVehicleId(serializedVehicle),
      name: normalizeString(serializedVehicle.name),
      brand: normalizeString(serializedVehicle.brand),
      model: normalizeString(serializedVehicle.model),
      year: normalizeNumber(serializedVehicle.year),
      plate: normalizeString(internal.plate),
      renavam: normalizeString(internal.renavam),
      chassis: normalizeString(internal.chassis),
      engineNumber: normalizeString(internal.engineNumber),
      color: normalizeString(serializedVehicle.color),
      mileage: normalizeNumber(serializedVehicle.mileage),
      fuel: normalizeString(serializedVehicle.fuel),
      transmission: normalizeString(serializedVehicle.transmission),
    },
    transaction: {
      salePrice: normalizeNumber(serializedVehicle.price),
      acquisitionValue: normalizeNumber(internal.acquisitionValue),
      minimumSaleValue: normalizeNumber(internal.minimumSaleValue),
      financedValue: normalizeNumber(internal.financedValue),
      acquisitionDate: normalizeDateOnly(internal.acquisitionDate),
    },
    buyer: {
      name: normalizeString(internal.buyerName),
      document: normalizeString(internal.buyerDocument),
    },
    previousOwner: {
      name: normalizeString(internal.previousOwnerName),
      document: normalizeString(internal.previousOwnerDocument),
    },
    documentation: {
      hasInspectionReport: normalizeBoolean(internal.hasInspectionReport),
      hasPaidIpva: normalizeBoolean(internal.hasPaidIpva),
      hasFines: normalizeBoolean(internal.hasFines),
      hasLien: normalizeBoolean(internal.hasLien),
      provenance: normalizeString(internal.provenance),
      spareKeyCount: normalizeString(internal.spareKeyCount),
      manualCount: normalizeString(internal.manualCount),
      legalNotes: normalizeString(internal.legalNotes),
      internalNotes: normalizeString(internal.internalNotes),
    },
    generatedAt: new Date().toISOString(),
  };
}

module.exports = {
  buildVehicleSaleDocumentPayload,
};
