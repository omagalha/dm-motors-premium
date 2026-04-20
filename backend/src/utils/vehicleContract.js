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
};

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

    return {
      url,
      ...(publicId ? { publicId } : {}),
      ...(width > 0 ? { width } : {}),
      ...(height > 0 ? { height } : {}),
      ...(format ? { format } : {}),
    };
  }

  return null;
}

function normalizeImageArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeImage(item)).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/[,\n]/)
      .map((item) => normalizeImage(item))
      .filter(Boolean);
  }

  const image = normalizeImage(value);
  return image ? [image] : [];
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
    normalizeBoolean(body.isFeatured ?? body.featured, DEFAULTS.isFeatured)
  );
  assign("active", "active" in body, normalizeBoolean(body.active, DEFAULTS.active));
  assign("year", "year" in body, normalizeNumber(body.year));
  assign(
    "mileage",
    "mileage" in body || "km" in body,
    normalizeNumber(body.mileage ?? body.km, DEFAULTS.mileage)
  );
  assign(
    "fuel",
    "fuel" in body,
    normalizeFuel(body.fuel)
  );
  assign(
    "transmission",
    "transmission" in body,
    normalizeTransmission(body.transmission)
  );
  assign("color", "color" in body, normalizeString(body.color, DEFAULTS.color));
  assign(
    "description",
    "description" in body,
    normalizeString(body.description, DEFAULTS.description)
  );
  assign(
    "images",
    "images" in body || "imageUrl" in body || "image" in body,
    normalizeImages(body)
  );
  assign("features", "features" in body, normalizeStringArray(body.features));
  assign(
    "category",
    "category" in body,
    normalizeCategory(body.category)
  );
  assign("city", "city" in body, normalizeString(body.city, DEFAULTS.city));
  assign(
    "status",
    "status" in body,
    normalizeStatus(body.status)
  );
  assign(
    "whatsappNumber",
    "whatsappNumber" in body,
    normalizeString(body.whatsappNumber, DEFAULTS.whatsappNumber)
  );
  assign(
    "tags",
    "tags" in body || "highlights" in body,
    normalizeTags(body)
  );

  return payload;
}

function serializeVehicle(vehicle) {
  const images = normalizeImageArray(vehicle.images);
  const legacyImages = normalizeImageArray(vehicle.imageUrl);
  const tags = normalizeStringArray(vehicle.tags);
  const legacyTags = normalizeStringArray(vehicle.highlights);

  return {
    id: String(vehicle._id),
    name: normalizeString(vehicle.name),
    brand: normalizeString(vehicle.brand),
    model: normalizeString(vehicle.model),
    price: normalizeNumber(vehicle.price),
    badge: normalizeString(vehicle.badge, DEFAULTS.badge),
    isFeatured: normalizeBoolean(
      vehicle.isFeatured ?? vehicle.featured,
      DEFAULTS.isFeatured
    ),
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
    createdAt: vehicle.createdAt instanceof Date ? vehicle.createdAt.toISOString() : "",
    updatedAt: vehicle.updatedAt instanceof Date ? vehicle.updatedAt.toISOString() : "",
  };
}

module.exports = {
  normalizeVehiclePayload,
  serializeVehicle,
};
