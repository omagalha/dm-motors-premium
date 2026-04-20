// Local store for vehicles — persists overrides + new vehicles in localStorage.
// This works as a fallback when the backend API (VITE_API_URL) is not reachable
// and as a mirror cache when it is. The vehicleService writes to both.

import { allCars as seedCars } from "./cars";
import type { Vehicle, VehicleInput } from "@/types/vehicle";

// Re-export the legacy `Car` aliases so existing imports keep compiling.
// The domain type lives in `@/types/vehicle` going forward.
export type Car = Vehicle;
export type CarInput = VehicleInput;

const STORAGE_KEY = "dm-motors:cars:v1";

function isBrowser() {
  return typeof window !== "undefined";
}

function readState(): Vehicle[] | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Vehicle[];
    if (!Array.isArray(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeState(cars: Vehicle[]) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cars));
    window.dispatchEvent(new CustomEvent("dm-motors:cars-updated"));
  } catch {
    /* ignore quota errors */
  }
}

export function getCars(): Vehicle[] {
  const stored = readState();
  if (stored && stored.length) return stored;
  return seedCars;
}

export function getCarById(id: string): Vehicle | undefined {
  return getCars().find((c) => c.id === id);
}

function nextId(cars: Vehicle[]) {
  const maxNumeric = cars
    .map((c) => Number(c.id))
    .filter((n) => Number.isFinite(n))
    .reduce((m, n) => Math.max(m, n), 0);
  return String(maxNumeric + 1);
}

export function addCar(input: VehicleInput | Vehicle): Vehicle {
  const list = [...getCars()];
  const car: Vehicle = {
    id: input.id ?? nextId(list),
    name: input.name,
    brand: input.brand,
    year: input.year,
    km: input.km,
    price: input.price,
    transmission: input.transmission,
    category: input.category,
    fuel: input.fuel,
    color: input.color,
    tag: input.tag,
    image: input.image,
    highlights: input.highlights ?? ["Revisado", "IPVA pago", "Aceita troca"],
    description: input.description,
    features: input.features,
    status: input.status ?? "disponivel",
  };
  // Replace if already exists (mirror from remote create), else prepend.
  const idx = list.findIndex((c) => c.id === car.id);
  if (idx >= 0) list[idx] = car;
  else list.unshift(car);
  writeState(list);
  return car;
}

export function updateCar(id: string, input: Partial<VehicleInput>): Vehicle | undefined {
  const list = getCars().map((c) => (c.id === id ? ({ ...c, ...input } as Vehicle) : c));
  writeState(list);
  return list.find((c) => c.id === id);
}

export function deleteCar(id: string) {
  const list = getCars().filter((c) => c.id !== id);
  writeState(list);
}

export function resetCars() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("dm-motors:cars-updated"));
}

// ────────────────────────────────────────────────────────────────────────────
// React hooks — subscribe to local store changes and (optionally) refresh
// from the backend API when configured.

import { useEffect, useState } from "react";
import { getVehicles } from "@/services/vehicleService";

export function useCars(): Vehicle[] {
  const [cars, setCars] = useState<Vehicle[]>(() => getCars());

  useEffect(() => {
    let cancelled = false;

    // Initial fetch from API (falls back to local inside the service).
    getVehicles()
      .then((list) => {
        if (cancelled) return;
        // If the API returned a different dataset than what's locally cached,
        // refresh the local store so admin actions stay consistent.
        if (Array.isArray(list) && list.length) {
          // Only overwrite local store if it's still on the seed (no admin edits).
          if (!readState()) writeState(list);
          setCars(list);
        }
      })
      .catch(() => {
        /* already handled inside service */
      });

    const refresh = () => setCars(getCars());
    window.addEventListener("dm-motors:cars-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      cancelled = true;
      window.removeEventListener("dm-motors:cars-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return cars;
}
