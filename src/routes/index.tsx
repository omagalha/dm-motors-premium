import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { CategoryBar } from "@/components/CategoryBar";
import { FeaturedCars } from "@/components/FeaturedCars";
import { Differentials } from "@/components/Differentials";
import { FinalCTA } from "@/components/FinalCTA";
import { Footer } from "@/components/Footer";
import { FloatingWhatsApp } from "@/components/WhatsAppButton";
import { getVehicles } from "@/services/vehicleService";
import type { Vehicle } from "@/types/vehicle";

export const Route = createFileRoute("/")({
  loader: async () => {
    const cars = await getVehicles();
    return { cars };
  },
  head: () => ({
    meta: [
      { title: "DM Motors Imports — Carros com procedência e preço diferenciado" },
      {
        name: "description",
        content:
          "Concessionária DM Motors Imports: oportunidades de verdade todos os dias. Veículos revisados, financiamento fácil e atendimento direto no WhatsApp.",
      },
      { property: "og:title", content: "DM Motors Imports — Oportunidades todos os dias" },
      {
        property: "og:description",
        content:
          "Carros impecáveis, com procedência e preço diferenciado. Fale agora no WhatsApp.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Index,
});

function Index() {
  const { cars } = Route.useLoaderData() as { cars: Vehicle[] };
  const activeCarCount = cars.filter((c) => c.active).length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero activeCarCount={activeCarCount} />
        <CategoryBar />
        <FeaturedCars initialCars={cars} />
        <Differentials />
        <FinalCTA />
      </main>
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
