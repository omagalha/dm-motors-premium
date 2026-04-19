// Local store for cars — persists overrides + new cars in localStorage.
// This lets the admin panel work without a backend. Data lives in the browser
// of whoever opens the panel.

import { allCars as seedCars, type Car, type CarTag, type Transmission, type Category, type Fuel, type CarStatus } from "./cars";

const STORAGE_KEY = "dm-motors:cars:v1";

export type CarInput = {
  id?: string;
  name: string;
  brand: string;
  year: number;
  km: number;
  price: number;
  transmission: Transmission;
  category: Category;
  fuel: Fuel;
  color: string;
  tag: CarTag;
  image: string; // URL or data URL
  highlights?: string[];
  description?: string;
  features?: string[];
  status?: CarStatus;
};

function isBrowser() {
  return typeof window !== "undefined";
}

function readState(): Car[] | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Car[];
    if (!Array.isArray(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeState(cars: Car[]) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cars));
    window.dispatchEvent(new CustomEvent("dm-motors:cars-updated"));
  } catch {
    /* ignore quota errors */
  }
}

export function getCars(): Car[] {
  const stored = readState();
  if (stored && stored.length) return stored;
  return seedCars;
}

export function getCarById(id: string): Car | undefined {
  return getCars().find((c) => c.id === id);
}

function nextId(cars: Car[]) {
  const maxNumeric = cars
    .map((c) => Number(c.id))
    .filter((n) => Number.isFinite(n))
    .reduce((m, n) => Math.max(m, n), 0);
  return String(maxNumeric + 1);
}

export function addCar(input: CarInput): Car {
  const list = [...getCars()];
  const car: Car = {
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
  list.unshift(car);
  writeState(list);
  return car;
}

export function updateCar(id: string, input: Partial<CarInput>): Car | undefined {
  const list = getCars().map((c) => (c.id === id ? { ...c, ...input } as Car : c));
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

// React hook — subscribe to store changes
import { useEffect, useState } from "react";

export function useCars(): Car[] {
  const [cars, setCars] = useState<Car[]>(() => getCars());
  useEffect(() => {
    const refresh = () => setCars(getCars());
    refresh();
    window.addEventListener("dm-motors:cars-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("dm-motors:cars-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  return cars;
}
