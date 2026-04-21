import heroCar from "@/assets/hero-home.jpg";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Search, ShieldCheck, RefreshCw } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { Category } from "@/types/vehicle";

interface HeroProps {
  activeCarCount?: number;
}

function DealerPlateBadge() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="inline-flex flex-col overflow-hidden rounded-[3px] border border-white/20 shadow-card"
    >
      <div className="bg-[#002868] px-7 py-[3px] text-center text-[7px] font-black tracking-[0.6em] text-yellow-300">
        ★ BRASIL ★
      </div>
      <div className="bg-primary px-7 py-1.5">
        <span className="block text-center font-display text-[15px] font-black tracking-[0.3em] text-white uppercase leading-none">
          DM · MOTORS
        </span>
      </div>
      <div className="bg-[oklch(0.10_0.006_20)] px-7 py-[3px] text-center text-[7px] font-bold tracking-[0.4em] text-white/45 uppercase">
        Revendedor · Imports
      </div>
    </motion.div>
  );
}

function HeroSearch() {
  const [category, setCategory] = useState<Category | "">("");
  const [maxPrice, setMaxPrice] = useState("");
  const navigate = useNavigate();

  return (
    <div className="mt-8 w-full max-w-xl rounded-2xl border border-white/10 bg-black/40 p-5 backdrop-blur-md">
      <p className="mb-3 text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">
        Encontre seu veículo
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as Category | "")}
          className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none"
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
          className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none"
        >
          <option value="">Qualquer preço</option>
          <option value="50000">Até R$ 50 mil</option>
          <option value="80000">Até R$ 80 mil</option>
          <option value="100000">Até R$ 100 mil</option>
          <option value="150000">Até R$ 150 mil</option>
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
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-black uppercase tracking-wide text-primary-foreground transition hover:brightness-110"
        >
          <Search className="h-4 w-4" />
          Buscar
        </button>
      </div>
    </div>
  );
}

export function Hero({ activeCarCount }: HeroProps) {
  return (
    <section className="relative isolate overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <img
          src={heroCar}
          alt=""
          aria-hidden="true"
          width={1920}
          height={1080}
          className="absolute inset-0 h-full w-full object-cover object-[82%_center] opacity-35 md:opacity-50"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,oklch(0.13_0.008_20)_0%,oklch(0.13_0.008_20/0.96)_42%,oklch(0.13_0.008_20/0.70)_68%,transparent_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,oklch(0.13_0.008_20/0.4)_0%,transparent_20%,transparent_80%,oklch(0.13_0.008_20)_100%)]" />
      </div>

      <div className="relative mx-auto flex min-h-[680px] max-w-7xl flex-col items-center justify-center px-5 py-20 text-center md:min-h-[760px] md:py-28 lg:items-start lg:text-left">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex max-w-2xl flex-col items-center lg:items-start will-change-transform"
        >
          <DealerPlateBadge />

          <h1 className="mt-7 text-5xl font-black uppercase leading-[0.9] tracking-tight text-foreground sm:text-6xl md:text-7xl lg:text-[5.5rem]">
            Seu próximo carro
            <br />
            <span className="bg-gradient-to-r from-primary to-[oklch(0.70_0.26_25)] bg-clip-text text-transparent">
              começa aqui.
            </span>
          </h1>

          <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
            Importados e nacionais selecionados com procedência garantida.
            Financiamento em todos os bancos, troca na hora.
          </p>

          <HeroSearch />

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <WhatsAppButton size="lg" label="Chamar no WhatsApp" />
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            {activeCarCount != null && activeCarCount > 0 && (
              <TrustItem label={`${activeCarCount} veículos disponíveis`} />
            )}
            <TrustItem icon={<ShieldCheck className="h-3.5 w-3.5" />} label="Procedência garantida" />
            <TrustItem icon={<RefreshCw className="h-3.5 w-3.5" />} label="Aceitamos troca" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function TrustItem({ icon, label }: { icon?: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
      {icon && <span className="text-primary">{icon}</span>}
      {label}
    </div>
  );
}
