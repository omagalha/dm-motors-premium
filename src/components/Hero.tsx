import heroCar from "@/assets/hero-home.jpg";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarCheck,
  CarFront,
  Search,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { useState } from "react";
import type { Category } from "@/types/vehicle";

interface HeroProps {
  activeCarCount?: number;
}

const trustItems = [
  { icon: ShieldCheck, label: "Procedência analisada" },
  { icon: BadgeCheck, label: "Veículos selecionados" },
  { icon: WalletCards, label: "Financiamento assistido" },
];

function HeroSearch() {
  const [category, setCategory] = useState<Category | "">("");
  const [maxPrice, setMaxPrice] = useState("");
  const navigate = useNavigate();

  return (
    <div className="mt-9 w-full max-w-3xl border-y border-white/10 bg-black/20 py-4 backdrop-blur-sm">
      <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-white/55">
        <Search className="h-3.5 w-3.5 text-primary" />
        Busca rápida no estoque
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as Category | "")}
          className="h-12 rounded-none border border-white/12 bg-black/35 px-4 text-sm font-semibold text-foreground focus:border-primary focus:outline-none"
        >
          <option value="">Todas as categorias</option>
          <option value="SUV">SUV</option>
          <option value="Sedan">Sedan</option>
          <option value="Hatch">Hatch</option>
          <option value="Picape">Picape</option>
        </select>

        <select
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          className="h-12 rounded-none border border-white/12 bg-black/35 px-4 text-sm font-semibold text-foreground focus:border-primary focus:outline-none"
        >
          <option value="">Qualquer preço</option>
          <option value="50000">Até R$ 50 mil</option>
          <option value="80000">Até R$ 80 mil</option>
          <option value="100000">Até R$ 100 mil</option>
          <option value="150000">Até R$ 150 mil</option>
          <option value="200000">Até R$ 200 mil</option>
        </select>

        <button
          onClick={() => {
            void navigate({
              to: "/estoque",
              search: {
                ...(category ? { category } : {}),
                ...(maxPrice ? { maxPrice: Number(maxPrice) } : {}),
              },
            });
          }}
          className="inline-flex h-12 items-center justify-center gap-2 bg-white px-6 text-xs font-black uppercase tracking-[0.18em] text-black transition hover:bg-primary hover:text-primary-foreground"
        >
          Buscar
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function Hero({ activeCarCount }: HeroProps) {
  const displayCount = activeCarCount && activeCarCount > 0 ? `${activeCarCount}+` : "Estoque";

  return (
    <section className="relative isolate overflow-hidden border-b border-white/10 bg-background">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <img
          src={heroCar}
          alt=""
          aria-hidden="true"
          width={1920}
          height={1080}
          className="absolute inset-0 h-full w-full object-cover object-[72%_center] opacity-52"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,6,6,0.97)_0%,rgba(6,6,6,0.88)_42%,rgba(6,6,6,0.58)_78%,rgba(6,6,6,0.42)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-44 bg-[linear-gradient(180deg,transparent_0%,oklch(0.125_0.006_20)_100%)]" />
      </div>

      <div className="mx-auto grid min-h-[720px] max-w-7xl gap-10 px-5 py-16 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-center">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-4xl"
        >
          <span className="inline-flex items-center gap-3 border-l-2 border-primary pl-4 text-[10px] font-bold uppercase tracking-[0.28em] text-white/64">
            <Building2 className="h-3.5 w-3.5 text-primary" />
            Showroom premium em Santo Antônio de Pádua
          </span>

          <h1 className="mt-7 max-w-[14ch] font-sans text-5xl font-semibold leading-[1.02] text-white sm:text-6xl md:text-7xl">
            Curadoria automotiva para comprar com confiança.
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-[1.85] text-white/70 md:text-lg">
            A DM Motors seleciona veículos com procedência, apresentação e atendimento
            consultivo para quem valoriza uma compra clara, segura e sem pressa.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/estoque"
              className="inline-flex items-center justify-center gap-2 bg-white px-6 py-4 text-xs font-black uppercase tracking-[0.18em] text-black transition hover:bg-primary hover:text-primary-foreground"
            >
              Ver seleção
              <ArrowRight className="h-4 w-4" />
            </Link>
            <WhatsAppButton size="lg" label="Agendar atendimento" />
          </div>

          <HeroSearch />

          <div className="mt-7 grid max-w-3xl gap-3 sm:grid-cols-3">
            {trustItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 border border-white/10 bg-black/22 px-4 py-3 text-sm font-semibold text-white/76 backdrop-blur"
              >
                <item.icon className="h-4 w-4 text-primary" />
                {item.label}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.aside
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
          className="hidden border border-white/10 bg-black/28 p-6 backdrop-blur-xl lg:block"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-primary">
            Concierge DM
          </p>

          <div className="mt-5 border-y border-white/10 py-6">
            <p className="font-sans text-5xl font-semibold leading-none text-white">
              {displayCount}
            </p>
            <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-white/52">
              veículos disponíveis
            </p>
          </div>

          <div className="mt-6 space-y-4">
            {[
              {
                icon: CarFront,
                title: "Seleção sob curadoria",
                text: "Estoque enxuto, pensado para facilitar comparação e decisão.",
              },
              {
                icon: CalendarCheck,
                title: "Visita assistida",
                text: "Atendimento com hora marcada para avaliar carro, troca e crédito.",
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-white/10 text-primary">
                  <item.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{item.title}</p>
                  <p className="mt-1 text-sm leading-[1.65] text-white/58">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.aside>
      </div>
    </section>
  );
}
