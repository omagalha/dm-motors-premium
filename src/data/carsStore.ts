// Local store for vehicles - persists overrides + new vehicles in localStorage.
// This works as a fallback when the backend API (VITE_API_URL) is not reachable
// and as a mirror cache when it is. The vehicleService writes to both.

import { useEffect, useMemo, useState } from "react";
import { allCars as seedCars } from "./cars";
import { normalizeVehicleRecord } from "@/lib/vehicles";
import type { Vehicle, VehicleInput, VehicleUpdateInput } from "@/types/vehicle";
import { getVehicles } from "@/services/vehicleService";

export type Car = Vehicle;
export type CarInput = VehicleInput;

const STORAGE_KEY = "dm-motors:cars:v2";

function isBrowser() {
  return typeof window !== "undefined";
}

function normalizeVehicleList(cars: Vehicle[]) {
  return cars.map(normalizeVehicleRecord);
}

function readState(): Vehicle[] | null {
  if (!isBrowser()) return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Vehicle[];
    if (!Array.isArray(parsed)) return null;

    return normalizeVehicleList(parsed);
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
  if (stored) return stored;
  return seedCars;
}

export function replaceCars(cars: Vehicle[]) {
  writeState(normalizeVehicleList(cars));
}

export function getCarById(id: string): Vehicle | undefined {
  return getCars().find((car) => car.id === id);
}

function nextId(cars: Vehicle[]) {
  const maxNumeric = cars
    .map((car) => Number(car.id))
    .filter((value) => Number.isFinite(value))
    .reduce((max, value) => Math.max(max, value), 0);

  return String(maxNumeric + 1);
}

export function addCar(input: VehicleInput | Vehicle): Vehicle {
  const list = [...getCars()];
  const providedId = "id" in input && typeof input.id === "string" ? input.id : undefined;
  const car = normalizeVehicleRecord({
    ...input,
    id: providedId ?? nextId(list),
  });

  const index = list.findIndex((item) => item.id === car.id);
  if (index >= 0) list[index] = car;
  else list.unshift(car);

  writeState(list);
  return car;
}

export function updateCar(id: string, input: VehicleUpdateInput): Vehicle | undefined {
  let updatedCar: Vehicle | undefined;

  const list = getCars().map((car) => {
    if (car.id !== id) return car;

    updatedCar = normalizeVehicleRecord({
      ...car,
      ...input,
      id,
    });
    return updatedCar;
  });

  writeState(list);
  return updatedCar;
}

export function deleteCar(id: string) {
  writeState(getCars().filter((car) => car.id !== id));
}

export function resetCars() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("dm-motors:cars-updated"));
}

export function useCars(initialCars?: Vehicle[]): Vehicle[] {
  const initialSnapshot = useMemo(
    () => (initialCars ? normalizeVehicleList(initialCars) : seedCars),
    [initialCars],
  );
  const [cars, setCars] = useState<Vehicle[]>(initialSnapshot);

  useEffect(() => {
    setCars(initialSnapshot);
  }, [initialSnapshot]);

  useEffect(() => {
    let cancelled = false;

    if (!initialCars) {
      const stored = readState();
      if (stored?.length) {
        setCars(stored);
      }
    }

    getVehicles()
      .then((list) => {
        if (cancelled) return;
        if (Array.isArray(list)) setCars(list);
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
  }, [initialCars]);

  return cars;
}
