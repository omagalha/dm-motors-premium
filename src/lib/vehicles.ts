import type {
  Category,
  Fuel,
  Transmission,
  Vehicle,
  VehicleInternalData,
  VehicleImage,
  VehicleMetricsSummary,
  VehicleStatus,
} from "@/types/vehicle";
import { WHATSAPP_NUMBER } from "./whatsapp";

export const DEFAULT_VEHICLE_IMAGE = "https://via.placeholder.com/800x600?text=DM+Motors";

type VehicleRecordLike = Partial<Vehicle> & {
  _id?: string;
  imageUrl?: unknown;
  image?: unknown;
  images?: unknown;
  internal?: unknown;
  metrics?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasOwn(record: Record<string, unknown>, key: string) {
  return Object.prototype.hasOwnProperty.call(record, key);
}

function normalizeString(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function normalizePhone(value: unknown, fallback = WHATSAPP_NUMBER) {
  const digits = normalizeString(value).replace(/\D/g, "");
  return digits || fallback;
}

function normalizeLooseString(value: unknown) {
  return normalizeString(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function normalizeNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function normalizeBoolean(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeCounterRecord(value: unknown) {
  if (!isRecord(value)) return undefined;

  const counters = Object.entries(value).reduce<Record<string, number>>((acc, [key, count]) => {
    const normalizedKey = normalizeString(key);
    const normalizedCount = normalizeNumber(count, 0);

    if (!normalizedKey || normalizedCount <= 0) {
      return acc;
    }

    acc[normalizedKey] = normalizedCount;
    return acc;
  }, {});

  return Object.keys(counters).length ? counters : undefined;
}

function normalizeDateString(value: unknown) {
  const normalized = normalizeString(value);
  if (!normalized) return undefined;

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}

export function createEmptyVehicleMetricsSummary(): VehicleMetricsSummary {
  return {
    views: 0,
    whatsappClicks: 0,
  };
}

function normalizeVehicleInternalData(value: unknown): VehicleInternalData | undefined {
  if (!isRecord(value)) return undefined;

  return {
    plate: normalizeString(value.plate),
    renavam: normalizeString(value.renavam),
    chassis: normalizeString(value.chassis),
    engineNumber: normalizeString(value.engineNumber),
    buyerDocument: normalizeString(value.buyerDocument),
    buyerName: normalizeString(value.buyerName),
    previousOwnerDocument: normalizeString(value.previousOwnerDocument),
    previousOwnerName: normalizeString(value.previousOwnerName),
    acquisitionDate: normalizeString(value.acquisitionDate),
    acquisitionValue: normalizeNumber(value.acquisitionValue),
    minimumSaleValue: normalizeNumber(value.minimumSaleValue),
    financedValue: normalizeNumber(value.financedValue),
    internalNotes: normalizeString(value.internalNotes),
    provenance: normalizeString(value.provenance),
    spareKeyCount: normalizeString(value.spareKeyCount),
    manualCount: normalizeString(value.manualCount),
    hasInspectionReport: normalizeBoolean(value.hasInspectionReport),
    hasPaidIpva: normalizeBoolean(value.hasPaidIpva),
    hasFines: normalizeBoolean(value.hasFines),
    hasLien: normalizeBoolean(value.hasLien),
    legalNotes: normalizeString(value.legalNotes),
  };
}

function normalizeVehicleMetricsSummary(value: unknown): VehicleMetricsSummary | undefined {
  if (!isRecord(value)) return undefined;

  const metrics: VehicleMetricsSummary = {
    views: normalizeNumber(value.views),
    whatsappClicks: normalizeNumber(value.whatsappClicks),
  };

  const lastViewAt = normalizeDateString(value.lastViewAt);
  const lastWhatsappClickAt = normalizeDateString(value.lastWhatsappClickAt);
  const sources = normalizeCounterRecord(value.sources);

  if (hasOwn(value, "leads")) {
    metrics.leads = normalizeNumber(value.leads);
  }

  if (lastViewAt) {
    metrics.lastViewAt = lastViewAt;
  }

  if (lastWhatsappClickAt) {
    metrics.lastWhatsappClickAt = lastWhatsappClickAt;
  }

  if (sources) {
    metrics.sources = sources;
  }

  return metrics;
}

function normalizeStringArray(value: unknown) {
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

function normalizeVehicleImage(value: unknown): VehicleImage | null {
  if (typeof value === "string") {
    const url = normalizeString(value);
    return url ? { url } : null;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const url = normalizeString(record.url ?? record.secure_url ?? record.src);

    if (!url) return null;

    const publicId = normalizeString(record.publicId ?? record.public_id);
    const width = normalizeNumber(record.width, 0);
    const height = normalizeNumber(record.height, 0);
    const format = normalizeString(record.format);
    const isCover = normalizeBoolean(record.isCover);

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

export function setCoverImage(images: VehicleImage[], index: number): VehicleImage[] {
  return images.map((image, currentIndex) => ({
    ...image,
    isCover: currentIndex === index,
  }));
}

export function ensureSingleCover(images: VehicleImage[]): VehicleImage[] {
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

export function moveImage<T>(items: T[], from: number, to: number): T[] {
  if (from < 0 || to < 0 || from >= items.length || to >= items.length || from === to) {
    return items;
  }

  const updated = [...items];
  const [moved] = updated.splice(from, 1);
  updated.splice(to, 0, moved);
  return updated;
}

export function normalizeVehicleImages(value: unknown): VehicleImage[] {
  let images: VehicleImage[] = [];

  if (Array.isArray(value)) {
    images = value
      .map((item) => normalizeVehicleImage(item))
      .filter((item): item is VehicleImage => Boolean(item));
  } else if (typeof value === "string") {
    images = value
      .split(/[,\n]/)
      .map((item) => normalizeVehicleImage(item))
      .filter((item): item is VehicleImage => Boolean(item));
  } else {
    const image = normalizeVehicleImage(value);
    images = image ? [image] : [];
  }

  return ensureSingleCover(images);
}

function normalizeFuel(value: unknown): Fuel {
  const normalized = normalizeLooseString(value);
  if (normalized.includes("diesel")) return "Diesel";
  if (normalized.includes("gasol")) return "Gasolina";
  if (normalized.includes("flex")) return "Flex";
  return "Nao informado";
}

function normalizeTransmission(value: unknown): Transmission {
  const normalized = normalizeLooseString(value);
  if (normalized.includes("manual")) return "Manual";
  if (normalized.includes("auto")) return "Automático";
  return "Nao informado";
}

function normalizeCategory(value: unknown): Category {
  const normalized = normalizeLooseString(value);
  if (normalized.includes("picap") || normalized.includes("pickup")) return "Picape";
  if (normalized.includes("suv")) return "SUV";
  if (normalized.includes("sedan")) return "Sedan";
  if (normalized.includes("hatch")) return "Hatch";
  return "Nao informado";
}

function normalizeStatus(value: unknown): VehicleStatus {
  const normalized = normalizeLooseString(value);
  if (normalized.includes("reserv")) return "reservado";
  if (normalized.includes("vend")) return "vendido";
  if (normalized.includes("disp")) return "disponivel";
  return "disponivel";
}

export function normalizeVehicleRecord(vehicle: VehicleRecordLike): Vehicle {
  const images = normalizeVehicleImages(vehicle.images);
  const legacyImageUrl = normalizeVehicleImages(vehicle.imageUrl);
  const legacyImage = normalizeVehicleImages(vehicle.image);
  const internal = normalizeVehicleInternalData(vehicle.internal);
  const metrics = normalizeVehicleMetricsSummary(vehicle.metrics);

  return {
    id: String(vehicle.id ?? vehicle._id ?? ""),
    name: normalizeString(vehicle.name),
    brand: normalizeString(vehicle.brand),
    model: normalizeString(vehicle.model),
    price: normalizeNumber(vehicle.price),
    badge: normalizeString(vehicle.badge),
    isFeatured: normalizeBoolean(vehicle.isFeatured),
    active: normalizeBoolean(vehicle.active, true),
    year: normalizeNumber(vehicle.year),
    mileage: normalizeNumber(vehicle.mileage),
    fuel: normalizeFuel(vehicle.fuel),
    transmission: normalizeTransmission(vehicle.transmission),
    color: normalizeString(vehicle.color),
    description: normalizeString(vehicle.description),
    images: images.length ? images : legacyImageUrl.length ? legacyImageUrl : legacyImage,
    features: normalizeStringArray(vehicle.features),
    category: normalizeCategory(vehicle.category),
    city: normalizeString(vehicle.city),
    status: normalizeStatus(vehicle.status),
    whatsappNumber: normalizePhone(vehicle.whatsappNumber),
    tags: normalizeStringArray(vehicle.tags),
    ...(internal ? { internal } : {}),
    ...(metrics ? { metrics } : {}),
    createdAt: normalizeString(vehicle.createdAt),
    updatedAt: normalizeString(vehicle.updatedAt),
  };
}

export function stripVehicleAdminData(vehicle: Vehicle): Vehicle {
  const normalized = normalizeVehicleRecord(vehicle);
  const { internal: _internal, metrics: _metrics, ...publicVehicle } = normalized;
  return publicVehicle;
}

export function getVehicleMetricsSummary(vehicle: Pick<Vehicle, "metrics">) {
  return normalizeVehicleMetricsSummary(vehicle.metrics) ?? createEmptyVehicleMetricsSummary();
}

export function getVehicleCoverImage(vehicle: { images?: VehicleImage[]; imageUrl?: unknown }) {
  const images = normalizeVehicleImages(vehicle.images);
  const cover = images.find((image) => image.isCover && image.url.trim());

  if (cover?.url) return cover.url;
  if (images[0]?.url) return images[0].url;

  const legacyImageUrl = normalizeString(vehicle.imageUrl);
  return legacyImageUrl || DEFAULT_VEHICLE_IMAGE;
}

export function getVehiclePrimaryImage(vehicle: Pick<Vehicle, "images">) {
  return getVehicleCoverImage(vehicle);
}

export function getVehicleGallery(vehicle: Pick<Vehicle, "images">) {
  return vehicle.images.length
    ? ensureSingleCover(vehicle.images)
    : [{ url: DEFAULT_VEHICLE_IMAGE, isCover: true }];
}

export function getVehicleImageUrl(image: VehicleImage | null | undefined) {
  return image?.url?.trim() || DEFAULT_VEHICLE_IMAGE;
}

export function getVehicleWhatsappNumber(vehicle: Pick<Vehicle, "whatsappNumber">) {
  return normalizePhone(vehicle.whatsappNumber);
}

export function getVehicleBadgeStyle(badge?: string) {
  const normalized = badge?.trim().toUpperCase() ?? "";

  if (normalized === "OPORTUNIDADE") {
    return {
      bg: "bg-primary text-primary-foreground",
      icon: "flame" as const,
    };
  }
  if (normalized === "BAIXA KM") {
    return {
      bg: "bg-whatsapp text-whatsapp-foreground",
      icon: "gauge" as const,
    };
  }
  if (normalized === "VENDE RÁPIDO") {
    return {
      bg: "bg-amber-500 text-black",
      icon: "zap" as const,
    };
  }
  if (normalized === "ZERO ENTRADA") {
    return {
      bg: "bg-blue-500 text-white",
      icon: "badge-percent" as const,
    };
  }

  return {
    bg: "bg-secondary text-foreground",
    icon: "tag" as const,
  };
}
