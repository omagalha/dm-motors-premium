import heroCar from "@/assets/hero-home.jpg";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  Clock3,
  RefreshCw,
  Search,
  ShieldCheck,
  Star,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import type { Category } from "@/types/vehicle";

interface HeroProps {
  activeCarCount?: number;
}

interface HeroStat {
  value: string;
  label: string;
}

interface ShowroomPoint {
  icon: LucideIcon;
  title: string;
  description: string;
}

const showroomPoints: ShowroomPoint[] = [
  {
    icon: ShieldCheck,
    title: "Procedencia validada",
    description: "Laudo e historico avaliados antes de cada carro entrar no estoque.",
  },
  {
    icon: RefreshCw,
    title: "Troca com avaliacao justa",
    description: "Seu usado entra na negociacao com avaliacao clara e atendimento direto.",
  },
  {
    icon: WalletCards,
    title: "Financiamento multibancos",
    description: "Simulacao agil para buscar a melhor condicao para cada perfil.",
  },
];

function HeroSearch() {
  const [category, setCategory] = useState<Category | "">("");
  const [maxPrice, setMaxPrice] = useState("");
  const navigate = useNavigate();

  return (
    <div className="mt-8 w-full max-w-3xl rounded-[28px] border border-white/12 bg-[oklch(0.12_0.01_20/0.84)] p-4 shadow-[0_25px_80px_-40px_rgba(0,0,0,0.85)] backdrop-blur-xl sm:p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2.5 sm:gap-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-white/72">
          <Search className="h-3.5 w-3.5 text-primary" />
          Busca guiada
        </span>
        <p className="text-sm text-muted-foreground">
          Filtre o estoque em poucos cliques.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as Category | "")}
          className="rounded-2xl border border-border bg-card px-4 py-3.5 text-sm text-foreground focus:border-primary focus:outline-none"
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
          className="rounded-2xl border border-border bg-card px-4 py-3.5 text-sm text-foreground focus:border-primary focus:outline-none"
        >
          <option value="">Qualquer preco</option>
          <option value="50000">Ate R$ 50 mil</option>
          <option value="80000">Ate R$ 80 mil</option>
          <option value="100000">Ate R$ 100 mil</option>
          <option value="150000">Ate R$ 150 mil</option>
          <option value="200000">Ate R$ 200 mil</option>
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
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-sm font-black uppercase tracking-[0.18em] text-primary-foreground transition hover:brightness-110"
        >
          Buscar
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function HeroStatCard({ value, label }: HeroStat) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.04] px-5 py-4 backdrop-blur-sm">
      <p className="text-[1.9rem] font-black uppercase leading-none text-foreground sm:text-[2.4rem]">
        {value}
      </p>
      <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function ShowroomCard() {
  return (
    <motion.aside
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.12 }}
      className="w-full max-w-[420px] rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,oklch(0.18_0.01_20/0.92)_0%,oklch(0.11_0.008_20/0.94)_100%)] p-5 shadow-[0_30px_90px_-45px_rgba(0,0,0,0.9)] backdrop-blur-xl sm:p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/12 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
            <Building2 className="h-3.5 w-3.5" />
            Padrao DM Motors
          </span>
          <h2 className="mt-4 max-w-[14ch] text-[1.55rem] font-black uppercase leading-[0.98] text-foreground sm:text-[1.7rem]">
            Atendimento premium, com proximidade e confianca.
          </h2>
        </div>

        <div className="hidden rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right sm:block">
          <p className="flex items-center justify-end gap-1 text-sm font-bold text-amber-300">
            <Star className="h-4 w-4 fill-current" />
            4.9
          </p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-white/60">
            avaliacao Google
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {showroomPoints.map((point) => (
          <div
            key={point.title}
            className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/16 text-primary">
                <point.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-[13px] font-bold uppercase tracking-[0.08em] text-foreground sm:text-sm">
                  {point.title}
                </h3>
                <p className="mt-1 text-sm leading-[1.6] text-muted-foreground">
                  {point.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
          <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.08em] text-foreground">
            <Clock3 className="h-4 w-4 text-primary" />
            Loja aberta
          </p>
          <p className="mt-2 text-sm leading-[1.65] text-muted-foreground">
            Seg a Sex 8h as 19h
            <br />
            Sab 8h as 17h
            <br />
            Dom 9h as 13h
          </p>
        </div>

        <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
          <p className="text-sm font-bold uppercase tracking-[0.08em] text-foreground">
            Showroom fisico
          </p>
          <p className="mt-2 text-sm leading-[1.65] text-muted-foreground">
            Santo Antonio de Padua - RJ
            <br />
            Atendimento rapido no WhatsApp
            <br />
            Estoque atualizado
          </p>
        </div>
      </div>
    </motion.aside>
  );
}

export function Hero({ activeCarCount }: HeroProps) {
  const stats: HeroStat[] = [
    {
      value: activeCarCount && activeCarCount > 0 ? `${activeCarCount}+` : "Estoque",
      label: activeCarCount && activeCarCount > 0 ? "veiculos disponiveis" : "atualizado",
    },
    { value: "+500", label: "clientes atendidos" },
    { value: "4.9", label: "avaliacao no Google" },
  ];

  return (
    <section className="relative isolate overflow-hidden border-b border-border/60 bg-background">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <img
          src={heroCar}
          alt=""
          aria-hidden="true"
          width={1920}
          height={1080}
          className="absolute inset-0 h-full w-full object-cover object-[76%_center] opacity-28 md:opacity-40"
        />
        <div className="absolute inset-0 bg-[linear-gradient(102deg,oklch(0.11_0.008_20)_0%,oklch(0.11_0.008_20/0.98)_36%,oklch(0.11_0.008_20/0.84)_62%,oklch(0.11_0.008_20/0.45)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_16%,oklch(0.62_0.24_25/0.22),transparent_26%),radial-gradient(circle_at_76%_28%,oklch(0.97_0_0/0.08),transparent_18%),linear-gradient(180deg,transparent_0%,oklch(0.11_0.008_20)_92%)]" />
      </div>

      <div className="mx-auto grid min-h-[740px] max-w-7xl gap-9 px-5 py-16 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center lg:py-22">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex max-w-3xl flex-col"
        >
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.24em] text-white/72">
            <Building2 className="h-3.5 w-3.5 text-primary" />
            Showroom premium em Santo Antonio de Padua - RJ
          </span>

          <h1 className="mt-5 max-w-[11.5ch] text-[3.35rem] font-black uppercase leading-[0.9] tracking-[-0.035em] text-foreground sm:text-[4.5rem] md:text-[5.25rem] lg:text-[5rem]">
            Seu proximo carro,
            <br />
            com mais seguranca.
          </h1>

          <p className="mt-5 max-w-[38rem] text-[15px] leading-[1.72] text-white/72 sm:text-[17px]">
            Estoque selecionado, atendimento direto e condicoes reais para voce negociar
            bem, do primeiro contato ate a entrega.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/estoque"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-7 py-4 text-sm font-black uppercase tracking-[0.16em] text-background transition hover:opacity-90"
            >
              Ver estoque
              <ArrowRight className="h-4 w-4" />
            </Link>
            <WhatsAppButton size="lg" label="Falar com a DM Motors" />
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {stats.map((stat) => (
              <HeroStatCard key={stat.label} value={stat.value} label={stat.label} />
            ))}
          </div>

          <HeroSearch />

          <div className="mt-5 flex flex-wrap items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/62 sm:gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Procedencia garantida
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5">
              <RefreshCw className="h-3.5 w-3.5 text-primary" />
              Aceitamos troca
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5">
              <WalletCards className="h-3.5 w-3.5 text-primary" />
              Financiamento facil
            </span>
          </div>
        </motion.div>

        <div className="lg:justify-self-end">
          <ShowroomCard />
        </div>
      </div>
    </section>
  );
}
