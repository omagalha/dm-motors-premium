// Domain types for the vehicle catalog.
// These shapes are the contract between the API/backend and the UI.
// Backed today by a localStorage store + the static seed in data/cars.ts,
// and tomorrow by the Node.js + MongoDB API behind VITE_API_URL.

export type CarTag = "OPORTUNIDADE" | "BAIXA KM" | "VENDE RÁPIDO" | "ZERO ENTRADA";
export type Transmission = "Automático" | "Manual";
export type Category = "Hatch" | "Sedan" | "SUV" | "Picape";
export type Fuel = "Flex" | "Diesel" | "Gasolina";
export type CarStatus = "disponivel" | "reservado" | "vendido";

export interface Vehicle {
  id: string;
  // tenantId?: string; // ← multi-tenant hook (Phase 2). Backend will scope by this.
  name: string;
  brand: string;
  year: number;
  km: number;
  price: number;
  tag: CarTag;
  image: string;
  transmission: Transmission;
  category: Category;
  fuel: Fuel;
  color: string;
  highlights: string[];
  description?: string;
  features?: string[];
  status?: CarStatus;
}

// Input shape for create/update operations.
// `id` is assigned by the backend (or the local store) on create.
// `highlights` is optional because the local store falls back to a sensible default.
export type VehicleInput = Omit<Vehicle, "id" | "highlights"> & {
  id?: string;
  highlights?: string[];
};

// Filters that the inventory page sends to the service. Even if filtering happens
// client-side today, the same shape will be forwarded as querystring to the API.
export interface VehicleFilters {
  search?: string;
  category?: Category | "Todos";
  transmission?: Transmission | "Todos";
  maxPrice?: number;
  sort?: "destaque" | "menor-preco" | "maior-preco" | "menor-km" | "novos";
}
