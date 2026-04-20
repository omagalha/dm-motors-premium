// Official vehicle contract shared by the frontend and the backend.
// The goal is to keep one canonical shape and avoid guessing sales-critical data
// in the UI layer.

export type Transmission = "Automático" | "Manual" | "Nao informado";
export type Category = "Hatch" | "Sedan" | "SUV" | "Picape" | "Nao informado";
export type Fuel = "Flex" | "Diesel" | "Gasolina" | "Nao informado";
export type VehicleStatus = "disponivel" | "reservado" | "vendido";

export interface VehicleImage {
  url: string;
  publicId?: string;
  width?: number;
  height?: number;
  format?: string;
  isCover?: boolean;
}

export interface Vehicle {
  // Identidade
  id: string;
  name: string;
  brand: string;
  model: string;

  // Comercial
  price: number;
  badge: string;
  isFeatured: boolean;
  active: boolean;

  // Tecnica
  year: number;
  mileage: number;
  fuel: Fuel;
  transmission: Transmission;
  color: string;

  // Apresentacao
  description: string;
  images: VehicleImage[];
  features: string[];
  category: Category;
  city: string;
  status: VehicleStatus;
  whatsappNumber: string;
  tags: string[];

  // Operacao
  createdAt: string;
  updatedAt: string;
}

export type VehicleInput = Omit<Vehicle, "id" | "createdAt" | "updatedAt">;

export type VehicleUpdateInput = Partial<VehicleInput>;

export interface VehicleFilters {
  search?: string;
  category?: Category | "Todos";
  transmission?: Transmission | "Todos";
  maxPrice?: number;
  sort?: "destaque" | "menor-preco" | "maior-preco" | "menor-km" | "novos";
}
