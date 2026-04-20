import type {
  Category,
  Fuel,
  Transmission,
  Vehicle,
  VehicleImage,
  VehicleStatus,
} from "@/types/vehicle";
import { WHATSAPP_NUMBER } from "./whatsapp";

export const DEFAULT_VEHICLE_IMAGE = "https://via.placeholder.com/800x600?text=DM+Motors";

type VehicleRecordLike = Partial<Vehicle> & {
  _id?: string;
  imageUrl?: unknown;
  image?: unknown;
  images?: unknown;
};

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

function normalizeImage(value: unknown): VehicleImage | null {
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

function normalizeImageArray(value: unknown): VehicleImage[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeImage(item))
      .filter((item): item is VehicleImage => Boolean(item));
  }

  if (typeof value === "string") {
    return value
      .split(/[,\n]/)
      .map((item) => normalizeImage(item))
      .filter((item): item is VehicleImage => Boolean(item));
  }

  const image = normalizeImage(value);
  return image ? [image] : [];
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
  const images = normalizeImageArray(vehicle.images);
  const legacyImageUrl = normalizeImageArray(vehicle.imageUrl);
  const legacyImage = normalizeImageArray(vehicle.image);

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
    createdAt: normalizeString(vehicle.createdAt),
    updatedAt: normalizeString(vehicle.updatedAt),
  };
}

export function getVehiclePrimaryImage(vehicle: Pick<Vehicle, "images">) {
  return vehicle.images.find((image) => image.url.trim())?.url || DEFAULT_VEHICLE_IMAGE;
}

export function getVehicleGallery(vehicle: Pick<Vehicle, "images">) {
  return vehicle.images.length ? vehicle.images : [{ url: DEFAULT_VEHICLE_IMAGE }];
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
