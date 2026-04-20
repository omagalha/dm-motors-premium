import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FloatingWhatsApp } from "@/components/WhatsAppButton";
import { formatKm, formatPrice, type Category, type Transmission } from "@/data/cars";
import { useCars } from "@/data/carsStore";
import {
  getVehicleBadgeStyle,
  getVehiclePrimaryImage,
  getVehicleWhatsappNumber,
} from "@/lib/vehicles";
import { whatsappLink } from "@/lib/whatsapp";
import {
  MessageCircle,
  Search,
  SlidersHorizontal,
  X,
  Flame,
  Gauge,
  Zap,
  BadgePercent,
  Tag,
} from "lucide-react";
import { motion } from "framer-motion";
import suvBanner from "@/assets/suv-banner.jpg";

interface EstoqueSearch {
  cat?: Category | "Todos";
}

export const Route = createFileRoute("/estoque")({
  validateSearch: (search: Record<string, unknown>): EstoqueSearch => ({
    cat: typeof search.cat === "string" ? (search.cat as Category | "Todos") : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Estoque de carros - DM Motors Imports" },
      {
        name: "description",
        content:
          "Veja todos os veiculos disponiveis na DM Motors Imports. Hatch, Sedan, SUV e Picape com procedencia, preco e financiamento facilitado.",
      },
      { property: "og:title", content: "Estoque DM Motors Imports" },
      {
        property: "og:description",
        content: "Marketplace de carros com procedencia. Filtre por preco, marca, cambio e mais.",
      },
    ],
  }),
  component: EstoquePage,
});

const categories: ("Todos" | Category)[] = ["Todos", "Hatch", "Sedan", "SUV", "Picape"];
const transmissions: ("Todos" | Transmission)[] = ["Todos", "Automático", "Manual"];

type SortKey = "destaque" | "menor-preco" | "maior-preco" | "menor-km" | "novos";

function BadgeIcon({ icon }: { icon: ReturnType<typeof getVehicleBadgeStyle>["icon"] }) {
  if (icon === "flame") return <Flame className="h-3 w-3" />;
  if (icon === "gauge") return <Gauge className="h-3 w-3" />;
  if (icon === "zap") return <Zap className="h-3 w-3" />;
  if (icon === "badge-percent") return <BadgePercent className="h-3 w-3" />;
  return <Tag className="h-3 w-3" />;
}

function EstoquePage() {
  const allCars = useCars().filter((car) => car.active);
  const { cat } = Route.useSearch();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>(cat ?? "Todos");
  const [transmission, setTransmission] = useState<(typeof transmissions)[number]>("Todos");
  const [maxPrice, setMaxPrice] = useState<number>(200000);
  const [sort, setSort] = useState<SortKey>("destaque");
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    if (cat && cat !== category) setCategory(cat);
  }, [cat, category]);

  const filtered = useMemo(() => {
    const list = allCars.filter((car) => {
      if (category !== "Todos" && car.category !== category) return false;
      if (transmission !== "Todos" && car.transmission !== transmission) return false;
      if (car.price > maxPrice) return false;

      if (search.trim()) {
        const query = search.toLowerCase();
        if (
          !car.name.toLowerCase().includes(query) &&
          !car.brand.toLowerCase().includes(query) &&
          !car.model.toLowerCase().includes(query) &&
          !car.color.toLowerCase().includes(query) &&
          !car.city.toLowerCase().includes(query) &&
          !car.tags.some((tag) => tag.toLowerCase().includes(query))
        ) {
          return false;
        }
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
        sorted.sort((a, b) => a.mileage - b.mileage);
        break;
      case "novos":
        sorted.sort((a, b) => b.year - a.year);
        break;
      default:
        sorted.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured));
        break;
    }
    return sorted;
  }, [allCars, search, category, transmission, maxPrice, sort]);

  const reset = () => {
    setSearch("");
    setCategory("Todos");
    setTransmission("Todos");
    setMaxPrice(200000);
    setSort("destaque");
  };

  const isSuv = category === "SUV";
  const activeFilterCount =
    (category !== "Todos" ? 1 : 0) +
    (transmission !== "Todos" ? 1 : 0) +
    (maxPrice !== 200000 ? 1 : 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {isSuv && (
        <section className="relative overflow-hidden border-b border-border">
          <img
            src={suvBanner}
            alt="SUVs disponiveis"
            width={1920}
            height={640}
            className="absolute inset-0 h-full w-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/30" />
          <div className="relative mx-auto max-w-7xl px-5 py-14 md:py-20">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
              Categoria
            </span>
            <h1 className="mt-3 text-5xl font-black uppercase leading-[0.95] tracking-tight text-foreground md:text-7xl">
              SUVs <span className="text-primary">disponiveis</span>
            </h1>
            <p className="mt-3 max-w-md text-sm text-muted-foreground md:text-base">
              Robustez, espaco e tecnologia. Selecionamos os melhores SUVs com procedencia e preco competitivo.
            </p>
          </div>
        </section>
      )}

      {!isSuv && (
        <section className="relative overflow-hidden border-b border-border bg-gradient-hero py-10 md:py-14">
          <div className="pointer-events-none absolute -right-20 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-gradient-red opacity-50 blur-2xl" />
          <div className="relative mx-auto max-w-7xl px-5">
            <nav className="mb-3 text-xs text-muted-foreground">
              <Link to="/" className="hover:text-foreground">
                Home
              </Link>
              <span className="mx-2">/</span>
              <span className="text-foreground">Estoque</span>
            </nav>
            <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
              <span className="text-[7rem] font-black leading-[0.85] text-primary drop-shadow-[0_0_30px_oklch(0.62_0.24_25/0.4)] tabular-nums md:text-[9rem]">
                {allCars.length}
              </span>
              <div className="pb-2">
                <h1 className="text-3xl font-black uppercase leading-tight text-foreground md:text-5xl">
                  veiculos
                  <br />
                  no estoque
                </h1>
                <p className="mt-2 max-w-md text-xs text-muted-foreground md:text-sm">
                  Procedencia garantida e financiamento facilitado.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="sticky top-[68px] z-30 border-b border-border bg-background/90 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-5 py-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por marca, modelo, cidade ou cor..."
              className="w-full rounded-full border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>
          <button
            onClick={() => setFiltersOpen(true)}
            className="relative flex shrink-0 items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-foreground transition hover:border-primary hover:text-primary"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtrar
            {activeFilterCount > 0 && (
              <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-black text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </button>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortKey)}
            className="hidden rounded-full border border-border bg-card px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-foreground focus:border-primary focus:outline-none md:block"
          >
            <option value="destaque">Destaques</option>
            <option value="menor-preco">Menor preco</option>
            <option value="maior-preco">Maior preco</option>
            <option value="menor-km">Menor KM</option>
            <option value="novos">Mais novos</option>
          </select>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            <span className="text-2xl font-black tabular-nums text-primary">{filtered.length}</span>{" "}
            {filtered.length === 1 ? "veiculo encontrado" : "veiculos encontrados"}
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <p className="text-base font-semibold text-foreground">
              Nenhum veiculo encontrado com esses filtros.
            </p>
            <button
              onClick={reset}
              className="mt-4 rounded-full bg-primary px-5 py-2.5 text-xs font-bold uppercase text-primary-foreground"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((car, index) => {
              const badgeStyle = getVehicleBadgeStyle(car.badge);
              const primaryImage = getVehiclePrimaryImage(car);
              return (
                <motion.article
                  key={car.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.3) }}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition hover:border-primary/50 hover:shadow-red"
                >
                  <Link
                    to="/veiculo/$carId"
                    params={{ carId: car.id }}
                    className="relative block aspect-[4/3] overflow-hidden bg-muted"
                  >
                    <img
                      src={primaryImage}
                      alt={car.name}
                      width={1024}
                      height={768}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                    {car.badge && (
                      <span
                        className={`absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${badgeStyle.bg}`}
                      >
                        <BadgeIcon icon={badgeStyle.icon} />
                        {car.badge}
                      </span>
                    )}
                  </Link>

                  <div className="flex flex-1 flex-col p-4">
                    <Link
                      to="/veiculo/$carId"
                      params={{ carId: car.id }}
                      className="text-sm font-semibold uppercase tracking-tight text-muted-foreground transition hover:text-primary"
                    >
                      {car.name}
                    </Link>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">
                      {car.brand} - {car.color}
                    </div>

                    <p className="mt-2 text-3xl font-black tabular-nums text-primary">
                      {formatPrice(car.price)}
                    </p>

                    <ul className="mt-3 grid grid-cols-2 gap-1.5 text-[11px] text-foreground">
                      <li className="flex items-center gap-1.5">
                        <span aria-hidden>📅</span>
                        <span className="tabular-nums">{car.year}</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span aria-hidden>🔢</span>
                        <span className="tabular-nums">{formatKm(car.mileage)}</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span aria-hidden>⚙️</span>
                        <span>{car.transmission}</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span aria-hidden>⛽</span>
                        <span>{car.fuel}</span>
                      </li>
                    </ul>

                    <a
                      href={whatsappLink(
                        `Ola! Vi o veiculo ${car.name} ${car.year} no site e tenho interesse. Ele ainda esta disponivel?`,
                        getVehicleWhatsappNumber(car)
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-5 flex items-center justify-center gap-2 rounded-full bg-whatsapp py-3 text-xs font-black uppercase tracking-wider text-whatsapp-foreground transition hover:brightness-110"
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
      </section>

      {filtersOpen && (
        <div className="fixed inset-0 z-50" role="dialog">
          <div className="absolute inset-0 bg-black/70" onClick={() => setFiltersOpen(false)} />
          <div className="absolute inset-y-0 right-0 w-[88%] max-w-sm overflow-y-auto bg-background p-5 shadow-card">
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
  setCategory: (value: (typeof categories)[number]) => void;
  transmission: (typeof transmissions)[number];
  setTransmission: (value: (typeof transmissions)[number]) => void;
  maxPrice: number;
  setMaxPrice: (value: number) => void;
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
          {categories.map((item) => (
            <button
              key={item}
              onClick={() => setCategory(item)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                category === item
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:border-primary"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-3 text-xs font-black uppercase tracking-widest text-muted-foreground">
          Cambio
        </h4>
        <div className="flex flex-wrap gap-2">
          {transmissions.map((item) => (
            <button
              key={item}
              onClick={() => setTransmission(item)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                transmission === item
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:border-primary"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            Preco maximo
          </h4>
          <span className="text-xs font-bold text-primary">{formatPrice(maxPrice)}</span>
        </div>
        <input
          type="range"
          min={30000}
          max={250000}
          step={5000}
          value={maxPrice}
          onChange={(event) => setMaxPrice(Number(event.target.value))}
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
