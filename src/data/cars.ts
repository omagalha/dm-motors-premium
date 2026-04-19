import car1 from "@/assets/car-1.jpg";
import car2 from "@/assets/car-2.jpg";
import car3 from "@/assets/car-3.jpg";
import car4 from "@/assets/car-4.jpg";

export type CarTag = "OPORTUNIDADE" | "BAIXA KM" | "VENDE RÁPIDO" | "ZERO ENTRADA";

export interface Car {
  id: string;
  name: string;
  year: number;
  km: string;
  price: string;
  tag: CarTag;
  image: string;
  highlights: string[];
}

export const featuredCars: Car[] = [
  {
    id: "1",
    name: "VW Polo Highline",
    year: 2022,
    km: "28.000 km",
    price: "R$ 96.900",
    tag: "OPORTUNIDADE",
    image: car1,
    highlights: ["Automático", "Único dono", "Revisado"],
  },
  {
    id: "2",
    name: "Onix LT 1.0",
    year: 2021,
    km: "35.500 km",
    price: "R$ 75.500",
    tag: "BAIXA KM",
    image: car2,
    highlights: ["Completo", "IPVA 2025 pago", "Garantia"],
  },
  {
    id: "3",
    name: "Hyundai Creta SUV",
    year: 2020,
    km: "62.300 km",
    price: "R$ 109.000",
    tag: "VENDE RÁPIDO",
    image: car3,
    highlights: ["SUV", "Automático", "Multimídia"],
  },
  {
    id: "4",
    name: "Toyota Hilux SRX",
    year: 2019,
    km: "84.000 km",
    price: "R$ 189.000",
    tag: "ZERO ENTRADA",
    image: car4,
    highlights: ["4x4 Diesel", "Couro", "Aceita troca"],
  },
];
