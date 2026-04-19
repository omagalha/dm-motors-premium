import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FloatingWhatsApp } from "@/components/WhatsAppButton";
import {
  formatKm,
  formatPrice,
  type Category,
  type Transmission,
  type CarTag,
} from "@/data/cars";
import { useCars } from "@/data/carsStore";
import { whatsappLink } from "@/lib/whatsapp";
import {
  MessageCircle,
  Search,
  SlidersHorizontal,
  X,
  Calendar,
  Gauge,
  Fuel as FuelIcon,
  Settings2,
  Flame,
  Zap,
  BadgePercent,
} from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/estoque")({
  head: () => ({
    meta: [
      { title: "Estoque de carros — DM Motors Imports" },
      {
        name: "description",
        content:
          "Veja todos os veículos disponíveis na DM Motors Imports. Hatch, Sedan, SUV e Picape com procedência, preço e financiamento facilitado.",
      },
      { property: "og:title", content: "Estoque DM Motors Imports" },
      {
        property: "og:description",
        content:
          "Marketplace de carros com procedência. Filtre por preço, marca, câmbio e mais.",
      },
    ],
  }),
  component: EstoquePage,
});

const categories: ("Todos" | Category)[] = ["Todos", "Hatch", "Sedan", "SUV", "Picape"];
const transmissions: ("Todos" | Transmission)[] = ["Todos", "Automático", "Manual"];

const tagStyles: Record<CarTag, { bg: string; icon: React.ReactNode }> = {
  OPORTUNIDADE: { bg: "bg-primary text-primary-foreground", icon: <Flame className="h-3 w-3" /> },
  "BAIXA KM": { bg: "bg-whatsapp text-whatsapp-foreground", icon: <Gauge className="h-3 w-3" /> },
  "VENDE RÁPIDO": { bg: "bg-amber-500 text-black", icon: <Zap className="h-3 w-3" /> },
  "ZERO ENTRADA": { bg: "bg-blue-500 text-white", icon: <BadgePercent className="h-3 w-3" /> },
};

type SortKey = "destaque" | "menor-preco" | "maior-preco" | "menor-km" | "novos";

function EstoquePage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("Todos");
  const [transmission, setTransmission] = useState<(typeof transmissions)[number]>("Todos");
  const [maxPrice, setMaxPrice] = useState<number>(200000);
  const [sort, setSort] = useState<SortKey>("destaque");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtered = useMemo(() => {
    const list = allCars.filter((car) => {
      if (category !== "Todos" && car.category !== category) return false;
      if (transmission !== "Todos" && car.transmission !== transmission) return false;
      if (car.price > maxPrice) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !car.name.toLowerCase().includes(q) &&
          !car.brand.toLowerCase().includes(q) &&
          !car.color.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });

    const sorted = [...list];
    switch (sort) {
      case "menor-preco":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "maior-preco":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "menor-km":
        sorted.sort((a, b) => a.km - b.km);
        break;
      case "novos":
        sorted.sort((a, b) => b.year - a.year);
        break;
    }
    return sorted;
  }, [search, category, transmission, maxPrice, sort]);

  const reset = () => {
    setSearch("");
    setCategory("Todos");
    setTransmission("Todos");
    setMaxPrice(200000);
    setSort("destaque");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Page header */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-hero py-10 md:py-14">
        <div className="pointer-events-none absolute -right-20 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-gradient-red opacity-50 blur-2xl" />
        <div className="relative mx-auto max-w-7xl px-5">
          <nav className="mb-3 text-xs text-muted-foreground">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">Estoque</span>
          </nav>
          <h1 className="text-4xl font-black uppercase text-foreground md:text-6xl">
            Estoque <span className="text-primary">completo</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground md:text-base">
            {allCars.length} veículos disponíveis com procedência garantida e financiamento
            facilitado.
          </p>
        </div>
      </section>

      {/* Search bar */}
      <section className="sticky top-[68px] z-30 border-b border-border bg-background/90 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-5 py-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por marca, modelo ou cor..."
              className="w-full rounded-full border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>
          <button
            onClick={() => setFiltersOpen(true)}
            className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-foreground transition hover:border-primary hover:text-primary lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" /> Filtros
          </button>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="hidden rounded-full border border-border bg-card px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-foreground focus:border-primary focus:outline-none md:block"
          >
            <option value="destaque">Destaques</option>
            <option value="menor-preco">Menor preço</option>
            <option value="maior-preco">Maior preço</option>
            <option value="menor-km">Menor KM</option>
            <option value="novos">Mais novos</option>
          </select>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
          {/* Sidebar filters (desktop) */}
          <aside className="hidden lg:block">
            <FilterPanel
              category={category}
              setCategory={setCategory}
              transmission={transmission}
              setTransmission={setTransmission}
              maxPrice={maxPrice}
              setMaxPrice={setMaxPrice}
              onReset={reset}
            />
          </aside>

          {/* Results */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                <span className="font-bold text-foreground">{filtered.length}</span>{" "}
                {filtered.length === 1 ? "veículo encontrado" : "veículos encontrados"}
              </p>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground focus:border-primary focus:outline-none md:hidden"
              >
                <option value="destaque">Destaques</option>
                <option value="menor-preco">Menor preço</option>
                <option value="maior-preco">Maior preço</option>
                <option value="menor-km">Menor KM</option>
                <option value="novos">Mais novos</option>
              </select>
            </div>

            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
                <p className="text-base font-semibold text-foreground">
                  Nenhum veículo encontrado com esses filtros.
                </p>
                <button
                  onClick={reset}
                  className="mt-4 rounded-full bg-primary px-5 py-2.5 text-xs font-bold uppercase text-primary-foreground"
                >
                  Limpar filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((car, i) => {
                  const style = tagStyles[car.tag];
                  return (
                    <motion.article
                      key={car.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.3) }}
                      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition hover:border-primary/50 hover:shadow-red"
                    >
                      <Link
                        to="/veiculo/$carId"
                        params={{ carId: car.id }}
                        className="relative block aspect-[4/3] overflow-hidden bg-muted"
                      >
                        <img
                          src={car.image}
                          alt={car.name}
                          width={1024}
                          height={768}
                          loading="lazy"
                          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                        />
                        <span
                          className={`absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${style.bg}`}
                        >
                          {style.icon}
                          {car.tag}
                        </span>
                      </Link>

                      <div className="flex flex-1 flex-col p-4">
                        <Link
                          to="/veiculo/$carId"
                          params={{ carId: car.id }}
                          className="text-base font-bold uppercase tracking-tight text-foreground transition hover:text-primary"
                        >
                          {car.name}
                        </Link>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {car.brand} · {car.color}
                        </div>

                        <p className="mt-3 text-2xl font-black text-primary">
                          {formatPrice(car.price)}
                        </p>

                        <ul className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                          <li className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-primary" /> {car.year}
                          </li>
                          <li className="flex items-center gap-1.5">
                            <Gauge className="h-3.5 w-3.5 text-primary" /> {formatKm(car.km)}
                          </li>
                          <li className="flex items-center gap-1.5">
                            <Settings2 className="h-3.5 w-3.5 text-primary" /> {car.transmission}
                          </li>
                          <li className="flex items-center gap-1.5">
                            <FuelIcon className="h-3.5 w-3.5 text-primary" /> {car.fuel}
                          </li>
                        </ul>

                        <a
                          href={whatsappLink(
                            `Olá! Tenho interesse no ${car.name} ${car.year} (${formatPrice(car.price)}).`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-5 flex items-center justify-center gap-2 rounded-full bg-whatsapp py-3 text-xs font-bold uppercase tracking-wider text-whatsapp-foreground transition hover:brightness-110"
                        >
                          <MessageCircle className="h-4 w-4 fill-current" strokeWidth={0} />
                          Chamar no WhatsApp
                        </a>
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Mobile filters drawer */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setFiltersOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 w-[85%] max-w-sm overflow-y-auto bg-background p-5 shadow-card">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-black uppercase">Filtros</h3>
              <button
                aria-label="Fechar"
                onClick={() => setFiltersOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-border"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <FilterPanel
              category={category}
              setCategory={setCategory}
              transmission={transmission}
              setTransmission={setTransmission}
              maxPrice={maxPrice}
              setMaxPrice={setMaxPrice}
              onReset={reset}
            />
            <button
              onClick={() => setFiltersOpen(false)}
              className="mt-5 w-full rounded-full bg-primary py-3 text-sm font-bold uppercase tracking-wider text-primary-foreground"
            >
              Ver {filtered.length} resultados
            </button>
          </div>
        </div>
      )}

      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}

interface FilterPanelProps {
  category: (typeof categories)[number];
  setCategory: (v: (typeof categories)[number]) => void;
  transmission: (typeof transmissions)[number];
  setTransmission: (v: (typeof transmissions)[number]) => void;
  maxPrice: number;
  setMaxPrice: (v: number) => void;
  onReset: () => void;
}

function FilterPanel({
  category,
  setCategory,
  transmission,
  setTransmission,
  maxPrice,
  setMaxPrice,
  onReset,
}: FilterPanelProps) {
  return (
    <div className="space-y-6 rounded-2xl border border-border bg-card p-5">
      <div>
        <h4 className="mb-3 text-xs font-black uppercase tracking-widest text-muted-foreground">
          Categoria
        </h4>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                category === c
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:border-primary"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-3 text-xs font-black uppercase tracking-widest text-muted-foreground">
          Câmbio
        </h4>
        <div className="flex flex-wrap gap-2">
          {transmissions.map((t) => (
            <button
              key={t}
              onClick={() => setTransmission(t)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                transmission === t
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:border-primary"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            Preço máximo
          </h4>
          <span className="text-xs font-bold text-primary">{formatPrice(maxPrice)}</span>
        </div>
        <input
          type="range"
          min={30000}
          max={250000}
          step={5000}
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="w-full accent-[oklch(0.62_0.24_25)]"
        />
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
          <span>R$ 30 mil</span>
          <span>R$ 250 mil</span>
        </div>
      </div>

      <button
        onClick={onReset}
        className="w-full rounded-full border border-border bg-background py-2.5 text-xs font-bold uppercase tracking-wider text-foreground transition hover:border-primary hover:text-primary"
      >
        Limpar filtros
      </button>
    </div>
  );
}
