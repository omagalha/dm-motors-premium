const CATEGORY_VALUES = ["Hatch", "Sedan", "SUV", "Picape", "Nao informado"];
const FUEL_VALUES = ["Flex", "Diesel", "Gasolina", "Nao informado"];
const TRANSMISSION_VALUES = ["Automático", "Manual", "Nao informado"];
const STATUS_VALUES = ["disponivel", "reservado", "vendido"];

const DEFAULTS = {
  badge: "",
  isFeatured: false,
  active: true,
  mileage: 0,
  fuel: "Nao informado",
  transmission: "Nao informado",
  color: "",
  description: "",
  images: [],
  features: [],
  category: "Nao informado",
  city: "",
  status: "disponivel",
  whatsappNumber: "",
  tags: [],
  internal: {
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
  },
  metrics: {
    views: 0,
    whatsappClicks: 0,
    lastViewAt: "",
    lastWhatsappClickAt: "",
    sources: {},
  },
  documentWorkflow: {
    saleContract: {
      status: "idle",
      executionId: "",
      providerExecutionId: "",
      triggeredAt: "",
      completedAt: "",
      failedAt: "",
      documentUrl: "",
      errorMessage: "",
    },
  },
};

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasOwn(record, key) {
  return Object.prototype.hasOwnProperty.call(record, key);
}

function normalizeString(value, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function normalizeLooseString(value) {
  return normalizeString(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
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

function normalizeDate(value, fallback = "") {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return fallback;
}

function normalizeDateOnly(value, fallback = "") {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    const [year] = value.trim().split("-");
    const numericYear = Number(year);

    if (Number.isFinite(numericYear) && numericYear >= 1900 && numericYear <= 2100) {
      return value.trim();
    }
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getUTCFullYear();
    if (year >= 1900 && year <= 2100) {
      return value.toISOString().slice(0, 10);
    }
    return fallback;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      const year = parsed.getUTCFullYear();
      if (year >= 1900 && year <= 2100) {
        return parsed.toISOString().slice(0, 10);
      }
    }
  }

  return fallback;
}

function normalizeStringArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/[,\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeImage(value) {
  if (typeof value === "string") {
    const url = normalizeString(value);
    return url ? { url } : null;
  }

  if (value && typeof value === "object") {
    const url = normalizeString(value.url ?? value.secure_url ?? value.src);
    if (!url) return null;

    const publicId = normalizeString(value.publicId ?? value.public_id);
    const width = normalizeNumber(value.width, 0);
    const height = normalizeNumber(value.height, 0);
    const format = normalizeString(value.format);
    const isCover = normalizeBoolean(value.isCover, false);

    return {
      url,
      ...(publicId ? { publicId } : {}),
      ...(width > 0 ? { width } : {}),
      ...(height > 0 ? { height } : {}),
      ...(format ? { format } : {}),
      ...(isCover ? { isCover } : {}),
    };
  }

  return null;
}

function ensureSingleCover(images) {
  if (!images.length) return images;

  const coverCount = images.filter((image) => image.isCover).length;

  if (coverCount === 1) {
    return images.map((image) => ({
      ...image,
      isCover: Boolean(image.isCover),
    }));
  }

  return images.map((image, index) => ({
    ...image,
    isCover: index === 0,
  }));
}

function normalizeImageArray(value) {
  let images = [];

  if (Array.isArray(value)) {
    images = value.map((item) => normalizeImage(item)).filter(Boolean);
  } else if (typeof value === "string") {
    images = value
      .split(/[,\n]/)
      .map((item) => normalizeImage(item))
      .filter(Boolean);
  } else {
    const image = normalizeImage(value);
    images = image ? [image] : [];
  }

  return ensureSingleCover(images);
}

function normalizeEnum(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

function normalizeFuel(value) {
  const normalized = normalizeLooseString(value);
  if (normalized.includes("diesel")) return "Diesel";
  if (normalized.includes("gasol")) return "Gasolina";
  if (normalized.includes("flex")) return "Flex";
  return DEFAULTS.fuel;
}

function normalizeTransmission(value) {
  const normalized = normalizeLooseString(value);
  if (normalized.includes("manual")) return "Manual";
  if (normalized.includes("auto")) return "Automático";
  return DEFAULTS.transmission;
}

function normalizeCategory(value) {
  const normalized = normalizeLooseString(value);
  if (normalized.includes("picap") || normalized.includes("pickup")) return "Picape";
  if (normalized.includes("suv")) return "SUV";
  if (normalized.includes("sedan")) return "Sedan";
  if (normalized.includes("hatch")) return "Hatch";
  return DEFAULTS.category;
}

function normalizeStatus(value) {
  const normalized = normalizeLooseString(value);
  if (normalized.includes("reserv")) return "reservado";
  if (normalized.includes("vend")) return "vendido";
  if (normalized.includes("disp")) return "disponivel";
  return DEFAULTS.status;
}

function normalizeImages(body) {
  const images = normalizeImageArray(body.images);
  if (images.length) return images;

  const legacyImageUrl = normalizeImageArray(body.imageUrl);
  if (legacyImageUrl.length) return legacyImageUrl;

  return normalizeImageArray(body.image);
}

function normalizeTags(body) {
  const tags = normalizeStringArray(body.tags);
  if (tags.length) return tags;

  return normalizeStringArray(body.highlights);
}

function normalizeVehicleInternalData(value, options = {}) {
  const partial = options.partial === true;
  if (!isRecord(value)) return null;

  const internal = {};
  const assign = (key, normalizer) => {
    if (!partial || hasOwn(value, key)) {
      internal[key] = normalizer(value[key]);
    }
  };

  assign("plate", (entry) => normalizeString(entry, DEFAULTS.internal.plate));
  assign("renavam", (entry) => normalizeString(entry, DEFAULTS.internal.renavam));
  assign("chassis", (entry) => normalizeString(entry, DEFAULTS.internal.chassis));
  assign("engineNumber", (entry) => normalizeString(entry, DEFAULTS.internal.engineNumber));
  assign("buyerDocument", (entry) => normalizeString(entry, DEFAULTS.internal.buyerDocument));
  assign("buyerName", (entry) => normalizeString(entry, DEFAULTS.internal.buyerName));
  assign("previousOwnerDocument", (entry) =>
    normalizeString(entry, DEFAULTS.internal.previousOwnerDocument),
  );
  assign("previousOwnerName", (entry) =>
    normalizeString(entry, DEFAULTS.internal.previousOwnerName),
  );
  assign("acquisitionDate", (entry) => normalizeDateOnly(entry, DEFAULTS.internal.acquisitionDate));
  assign("acquisitionValue", (entry) => normalizeNumber(entry, DEFAULTS.internal.acquisitionValue));
  assign("minimumSaleValue", (entry) => normalizeNumber(entry, DEFAULTS.internal.minimumSaleValue));
  assign("financedValue", (entry) => normalizeNumber(entry, DEFAULTS.internal.financedValue));
  assign("internalNotes", (entry) => normalizeString(entry, DEFAULTS.internal.internalNotes));
  assign("provenance", (entry) => normalizeString(entry, DEFAULTS.internal.provenance));
  assign("spareKeyCount", (entry) => normalizeString(entry, DEFAULTS.internal.spareKeyCount));
  assign("manualCount", (entry) => normalizeString(entry, DEFAULTS.internal.manualCount));
  assign("hasInspectionReport", (entry) =>
    normalizeBoolean(entry, DEFAULTS.internal.hasInspectionReport),
  );
  assign("hasPaidIpva", (entry) => normalizeBoolean(entry, DEFAULTS.internal.hasPaidIpva));
  assign("hasFines", (entry) => normalizeBoolean(entry, DEFAULTS.internal.hasFines));
  assign("hasLien", (entry) => normalizeBoolean(entry, DEFAULTS.internal.hasLien));
  assign("legalNotes", (entry) => normalizeString(entry, DEFAULTS.internal.legalNotes));

  return internal;
}

function normalizeVehicleMetrics(value, options = {}) {
  const partial = options.partial === true;
  if (!isRecord(value)) return null;

  const metrics = {};
  const assign = (key, normalizer) => {
    if (!partial || hasOwn(value, key)) {
      metrics[key] = normalizer(value[key]);
    }
  };

  assign("views", (entry) => normalizeNumber(entry, DEFAULTS.metrics.views));
  assign("whatsappClicks", (entry) => normalizeNumber(entry, DEFAULTS.metrics.whatsappClicks));
  assign("lastViewAt", (entry) => normalizeString(entry, DEFAULTS.metrics.lastViewAt));
  assign("lastWhatsappClickAt", (entry) =>
    normalizeString(entry, DEFAULTS.metrics.lastWhatsappClickAt),
  );
  assign("sources", (entry) => (isRecord(entry) ? entry : DEFAULTS.metrics.sources));

  return metrics;
}

function normalizeWorkflowStatus(value) {
  return ["idle", "pending", "completed", "failed"].includes(value)
    ? value
    : DEFAULTS.documentWorkflow.saleContract.status;
}

function normalizeVehicleDocumentWorkflow(value) {
  if (!isRecord(value) || !isRecord(value.saleContract)) return null;

  return {
    saleContract: {
      status: normalizeWorkflowStatus(value.saleContract.status),
      executionId: normalizeString(
        value.saleContract.executionId,
        DEFAULTS.documentWorkflow.saleContract.executionId,
      ),
      providerExecutionId: normalizeString(
        value.saleContract.providerExecutionId,
        DEFAULTS.documentWorkflow.saleContract.providerExecutionId,
      ),
      triggeredAt: normalizeDate(
        value.saleContract.triggeredAt,
        DEFAULTS.documentWorkflow.saleContract.triggeredAt,
      ),
      completedAt: normalizeDate(
        value.saleContract.completedAt,
        DEFAULTS.documentWorkflow.saleContract.completedAt,
      ),
      failedAt: normalizeDate(
        value.saleContract.failedAt,
        DEFAULTS.documentWorkflow.saleContract.failedAt,
      ),
      documentUrl: normalizeString(
        value.saleContract.documentUrl,
        DEFAULTS.documentWorkflow.saleContract.documentUrl,
      ),
      errorMessage: normalizeString(
        value.saleContract.errorMessage,
        DEFAULTS.documentWorkflow.saleContract.errorMessage,
      ),
    },
  };
}

function normalizeVehiclePayload(body = {}, options = {}) {
  const partial = options.partial === true;
  const payload = {};

  const assign = (key, condition, value) => {
    if (!partial || condition) payload[key] = value;
  };

  assign("name", "name" in body, normalizeString(body.name));
  assign("brand", "brand" in body, normalizeString(body.brand));
  assign("model", "model" in body, normalizeString(body.model));
  assign("price", "price" in body, normalizeNumber(body.price));
  assign("badge", "badge" in body, normalizeString(body.badge, DEFAULTS.badge));
  assign(
    "isFeatured",
    "isFeatured" in body || "featured" in body,
    normalizeBoolean(body.isFeatured ?? body.featured, DEFAULTS.isFeatured),
  );
  assign("active", "active" in body, normalizeBoolean(body.active, DEFAULTS.active));
  assign("year", "year" in body, normalizeNumber(body.year));
  assign(
    "mileage",
    "mileage" in body || "km" in body,
    normalizeNumber(body.mileage ?? body.km, DEFAULTS.mileage),
  );
  assign("fuel", "fuel" in body, normalizeFuel(body.fuel));
  assign("transmission", "transmission" in body, normalizeTransmission(body.transmission));
  assign("color", "color" in body, normalizeString(body.color, DEFAULTS.color));
  assign(
    "description",
    "description" in body,
    normalizeString(body.description, DEFAULTS.description),
  );
  assign(
    "images",
    "images" in body || "imageUrl" in body || "image" in body,
    normalizeImages(body),
  );
  assign("features", "features" in body, normalizeStringArray(body.features));
  assign("category", "category" in body, normalizeCategory(body.category));
  assign("city", "city" in body, normalizeString(body.city, DEFAULTS.city));
  assign("status", "status" in body, normalizeStatus(body.status));
  assign(
    "whatsappNumber",
    "whatsappNumber" in body,
    normalizeString(body.whatsappNumber, DEFAULTS.whatsappNumber),
  );
  assign("tags", "tags" in body || "highlights" in body, normalizeTags(body));

  if (hasOwn(body, "internal")) {
    payload.internal = normalizeVehicleInternalData(body.internal, { partial });
  }

  if (hasOwn(body, "metrics")) {
    payload.metrics = normalizeVehicleMetrics(body.metrics, { partial });
  }

  return payload;
}

function serializeVehicle(vehicle, options = {}) {
  const isAdmin = options.isAdmin === true;
  const metricsSource = options.metricsOverride ?? vehicle.metrics;
  const images = normalizeImageArray(vehicle.images);
  const legacyImages = normalizeImageArray(vehicle.imageUrl);
  const tags = normalizeStringArray(vehicle.tags);
  const legacyTags = normalizeStringArray(vehicle.highlights);
  const internal = normalizeVehicleInternalData(vehicle.internal);
  const metrics = normalizeVehicleMetrics(metricsSource) ?? DEFAULTS.metrics;
  const documentWorkflow = normalizeVehicleDocumentWorkflow(vehicle.documentWorkflow);

  return {
    id: String(vehicle._id),
    name: normalizeString(vehicle.name),
    brand: normalizeString(vehicle.brand),
    model: normalizeString(vehicle.model),
    price: normalizeNumber(vehicle.price),
    badge: normalizeString(vehicle.badge, DEFAULTS.badge),
    isFeatured: normalizeBoolean(vehicle.isFeatured ?? vehicle.featured, DEFAULTS.isFeatured),
    active: normalizeBoolean(vehicle.active, DEFAULTS.active),
    year: normalizeNumber(vehicle.year),
    mileage: normalizeNumber(vehicle.mileage, DEFAULTS.mileage),
    fuel: normalizeFuel(vehicle.fuel),
    transmission: normalizeTransmission(vehicle.transmission),
    color: normalizeString(vehicle.color, DEFAULTS.color),
    description: normalizeString(vehicle.description, DEFAULTS.description),
    images: images.length ? images : legacyImages,
    features: normalizeStringArray(vehicle.features),
    category: normalizeCategory(vehicle.category),
    city: normalizeString(vehicle.city, DEFAULTS.city),
    status: normalizeStatus(vehicle.status),
    whatsappNumber: normalizeString(vehicle.whatsappNumber, DEFAULTS.whatsappNumber),
    tags: tags.length ? tags : legacyTags,
    ...(isAdmin && internal ? { internal } : {}),
    ...(isAdmin ? { metrics } : {}),
    ...(isAdmin && documentWorkflow ? { documentWorkflow } : {}),
    createdAt: vehicle.createdAt instanceof Date ? vehicle.createdAt.toISOString() : "",
    updatedAt: vehicle.updatedAt instanceof Date ? vehicle.updatedAt.toISOString() : "",
  };
}

module.exports = {
  normalizeVehiclePayload,
  serializeVehicle,
};
