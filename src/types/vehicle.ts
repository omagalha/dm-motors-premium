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

export interface VehicleInternalData {
  plate: string;
  renavam: string;
  chassis: string;
  engineNumber: string;
  buyerDocument: string;
  buyerName: string;
  previousOwnerDocument: string;
  previousOwnerName: string;
  acquisitionDate: string;
  acquisitionValue: number;
  minimumSaleValue: number;
  financedValue: number;
  internalNotes: string;
  provenance: string;
  spareKeyCount: string;
  manualCount: string;
  hasInspectionReport: boolean;
  hasPaidIpva: boolean;
  hasFines: boolean;
  hasLien: boolean;
  legalNotes: string;
}

export interface VehicleMetricsSummary {
  views: number;
  whatsappClicks: number;
  lastViewAt?: string;
  lastWhatsappClickAt?: string;
  sources?: Record<string, number>;
  leads?: number;
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
  internal?: VehicleInternalData;
  metrics?: VehicleMetricsSummary;

  // Operacao
  createdAt: string;
  updatedAt: string;
}

export type VehicleInput = Omit<Vehicle, "id" | "createdAt" | "updatedAt">;

export type VehicleUpdateInput = Partial<VehicleInput>;

export interface VehicleFilters {
  category: Category | null;
  transmission: Transmission | null;
  maxPrice: number | null;
  maxKm: number | null;
  minYear: number | null;
}
