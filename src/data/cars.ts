import car1 from "@/assets/car-1.jpg";
import car2 from "@/assets/car-2.jpg";
import car3 from "@/assets/car-3.jpg";
import car4 from "@/assets/car-4.jpg";
import car5 from "@/assets/car-5.jpg";
import car6 from "@/assets/car-6.jpg";
import car7 from "@/assets/car-7.jpg";
import car8 from "@/assets/car-8.jpg";

export type CarTag = "OPORTUNIDADE" | "BAIXA KM" | "VENDE RÁPIDO" | "ZERO ENTRADA";
export type Transmission = "Automático" | "Manual";
export type Category = "Hatch" | "Sedan" | "SUV" | "Picape";
export type Fuel = "Flex" | "Diesel" | "Gasolina";

export interface Car {
  id: string;
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
}

export const allCars: Car[] = [
  {
    id: "1",
    name: "VW Polo Highline",
    brand: "Volkswagen",
    year: 2022,
    km: 28000,
    price: 96900,
    tag: "OPORTUNIDADE",
    image: car1,
    transmission: "Automático",
    category: "Hatch",
    fuel: "Flex",
    color: "Vermelho",
    highlights: ["Único dono", "Revisado", "IPVA pago"],
  },
  {
    id: "2",
    name: "Chevrolet Onix LT 1.0",
    brand: "Chevrolet",
    year: 2021,
    km: 35500,
    price: 75500,
    tag: "BAIXA KM",
    image: car2,
    transmission: "Manual",
    category: "Hatch",
    fuel: "Flex",
    color: "Prata",
    highlights: ["Completo", "Garantia", "IPVA 2025"],
  },
  {
    id: "3",
    name: "Hyundai Creta SUV",
    brand: "Hyundai",
    year: 2020,
    km: 62300,
    price: 109000,
    tag: "VENDE RÁPIDO",
    image: car3,
    transmission: "Automático",
    category: "SUV",
    fuel: "Flex",
    color: "Azul",
    highlights: ["Multimídia", "Câmera de ré", "Único dono"],
  },
  {
    id: "4",
    name: "Toyota Hilux SRX",
    brand: "Toyota",
    year: 2019,
    km: 84000,
    price: 189000,
    tag: "ZERO ENTRADA",
    image: car4,
    transmission: "Automático",
    category: "Picape",
    fuel: "Diesel",
    color: "Preto",
    highlights: ["4x4", "Couro", "Aceita troca"],
  },
  {
    id: "5",
    name: "Jeep Renegade Sport",
    brand: "Jeep",
    year: 2021,
    km: 47000,
    price: 98500,
    tag: "OPORTUNIDADE",
    image: car5,
    transmission: "Automático",
    category: "SUV",
    fuel: "Flex",
    color: "Branco",
    highlights: ["Multimídia", "Único dono", "Revisado"],
  },
  {
    id: "6",
    name: "Honda Civic EXL",
    brand: "Honda",
    year: 2020,
    km: 58200,
    price: 124900,
    tag: "BAIXA KM",
    image: car6,
    transmission: "Automático",
    category: "Sedan",
    fuel: "Flex",
    color: "Cinza",
    highlights: ["Couro", "Teto solar", "Top de linha"],
  },
  {
    id: "7",
    name: "Fiat Argo Drive",
    brand: "Fiat",
    year: 2022,
    km: 22500,
    price: 68900,
    tag: "BAIXA KM",
    image: car7,
    transmission: "Manual",
    category: "Hatch",
    fuel: "Flex",
    color: "Preto",
    highlights: ["Único dono", "IPVA pago", "Garantia"],
  },
  {
    id: "8",
    name: "Renault Kwid Zen",
    brand: "Renault",
    year: 2021,
    km: 41000,
    price: 49900,
    tag: "ZERO ENTRADA",
    image: car8,
    transmission: "Manual",
    category: "Hatch",
    fuel: "Flex",
    color: "Prata",
    highlights: ["Econômico", "Multimídia", "Revisado"],
  },
];

// Compat with home page (preview-friendly format)
export const featuredCars = allCars.slice(0, 4).map((c) => ({
  ...c,
  km: `${c.km.toLocaleString("pt-BR")} km`,
  price: `R$ ${c.price.toLocaleString("pt-BR")}`,
}));

export function formatPrice(value: number) {
  return `R$ ${value.toLocaleString("pt-BR")}`;
}

export function formatKm(value: number) {
  return `${value.toLocaleString("pt-BR")} km`;
}
