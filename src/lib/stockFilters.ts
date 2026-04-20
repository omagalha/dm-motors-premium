import type { Vehicle, VehicleFilters } from "@/types/vehicle";

export const STOCK_PRICE_MIN = 30000;
export const STOCK_PRICE_MAX = 250000;
export const LOW_MILEAGE_MAX_KM = 40000;

export interface StockQuickFilterPreset {
  key: string;
  label: string;
  patch: Partial<VehicleFilters>;
}

function normalizeSearchTerm(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function createDefaultVehicleFilters(): VehicleFilters {
  return {
    category: null,
    transmission: null,
    maxPrice: null,
    maxKm: null,
    minYear: null,
  };
}

export function getRecentVehicleMinYear(currentYear = new Date().getFullYear()) {
  return currentYear - 5;
}

export function getStockQuickFilterPresets(
  currentYear = new Date().getFullYear(),
): StockQuickFilterPreset[] {
  return [
    {
      key: "price-50",
      label: "Até R$ 50 mil",
      patch: { maxPrice: 50000 },
    },
    {
      key: "price-80",
      label: "Até R$ 80 mil",
      patch: { maxPrice: 80000 },
    },
    {
      key: "category-suv",
      label: "SUV",
      patch: { category: "SUV" },
    },
    {
      key: "transmission-automatic",
      label: "Automático",
      patch: { transmission: "Automático" },
    },
    {
      key: "low-mileage",
      label: "Baixa KM",
      patch: { maxKm: LOW_MILEAGE_MAX_KM },
    },
    {
      key: "recent-years",
      label: "0 km a 5 anos",
      patch: { minYear: getRecentVehicleMinYear(currentYear) },
    },
  ];
}

export function countActiveVehicleFilters(filters: VehicleFilters) {
  return Object.values(filters).filter((value) => value !== null).length;
}

export function isVehicleFilterPatchActive(
  filters: VehicleFilters,
  patch: Partial<VehicleFilters>,
) {
  return Object.entries(patch).every(([key, value]) => {
    return filters[key as keyof VehicleFilters] === value;
  });
}

export function toggleVehicleFilterPatch(
  filters: VehicleFilters,
  patch: Partial<VehicleFilters>,
): VehicleFilters {
  if (isVehicleFilterPatchActive(filters, patch)) {
    const nextFilters = { ...filters };

    Object.keys(patch).forEach((key) => {
      nextFilters[key as keyof VehicleFilters] = null;
    });

    return nextFilters;
  }

  return {
    ...filters,
    ...patch,
  };
}

export function applyVehicleFilters(vehicles: Vehicle[], filters: VehicleFilters) {
  return vehicles.filter((vehicle) => {
    const matchesCategory =
      !filters.category || vehicle.category === filters.category;

    const matchesTransmission =
      !filters.transmission || vehicle.transmission === filters.transmission;

    const matchesPrice =
      !filters.maxPrice || vehicle.price <= filters.maxPrice;

    const matchesKm =
      !filters.maxKm || vehicle.mileage <= filters.maxKm;

    const matchesYear =
      !filters.minYear || vehicle.year >= filters.minYear;

    return (
      matchesCategory &&
      matchesTransmission &&
      matchesPrice &&
      matchesKm &&
      matchesYear
    );
  });
}

export function matchesVehicleSearch(vehicle: Vehicle, search: string) {
  const query = normalizeSearchTerm(search);
  if (!query) return true;

  return normalizeSearchTerm(
    [
      vehicle.name,
      vehicle.brand,
      vehicle.model,
      vehicle.color,
      vehicle.city,
      vehicle.badge,
      vehicle.tags.join(" "),
    ].join(" "),
  ).includes(query);
}

export function getVehicleFilterSearch(filters: VehicleFilters) {
  return {
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.transmission ? { transmission: filters.transmission } : {}),
    ...(typeof filters.maxPrice === "number" ? { maxPrice: filters.maxPrice } : {}),
    ...(typeof filters.maxKm === "number" ? { maxKm: filters.maxKm } : {}),
    ...(typeof filters.minYear === "number" ? { minYear: filters.minYear } : {}),
  };
}
