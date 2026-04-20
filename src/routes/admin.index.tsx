import { createFileRoute, Link } from "@tanstack/react-router";
import { allCars, formatPrice } from "@/data/cars";
import { useCars } from "@/data/carsStore";
import { getCarInsights, getLast7DaysActivity, getTotals } from "@/data/insights";
import { Eye, MessageCircle, TrendingUp, Users, Trophy, Flame, Car as CarIcon, ArrowUpRight } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Visão geral — Admin DM Motors" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminOverview,
});

function AdminOverview() {
  const cars = useCars();
  const totals = getTotals();
  const activity = getLast7DaysActivity();
  const carInsights = getCarInsights();

  const topClicked = [...allCars].sort(
    (a, b) =>
      (carInsights[b.id]?.whatsappClicks ?? 0) - (carInsights[a.id]?.whatsappClicks ?? 0),
  )[0];
  const topInsight = topClicked ? carInsights[topClicked.id] : null;

  // Build a 7-day sparkline of "views" for the top car (simulated proportionally).
  const topSparkline = topInsight
    ? activity.map((d, i) => ({
        day: d.day,
        v: Math.max(4, Math.round((topInsight.views / 14) * (0.6 + ((i * 13) % 11) / 18))),
      }))
    : [];

  const avgPrice = cars.length
    ? Math.round(cars.reduce((s, c) => s + c.price, 0) / cars.length)
    : 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary">
            Painel · últimos 7 dias
          </p>
          <h1 className="mt-1.5 text-3xl font-black tracking-tight text-foreground md:text-4xl">
            Visão geral
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {cars.length} veículos no estoque · ticket médio {formatPrice(avgPrice)}
          </p>
        </div>
      </header>

      {/* KPI grid */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Cliques no WhatsApp"
          value={totals.whatsapp}
          delta="+18%"
          icon={<MessageCircle className="h-5 w-5" />}
          accent="bg-whatsapp/15 text-whatsapp"
        />
        <KpiCard
          label="Visualizações"
          value={totals.views}
          delta="+24%"
          icon={<Eye className="h-5 w-5" />}
          accent="bg-primary/15 text-primary"
        />
        <KpiCard
          label="Leads recebidos"
          value={totals.leads}
          delta="+9%"
          icon={<Users className="h-5 w-5" />}
          accent="bg-foreground/10 text-foreground"
        />
        <KpiCard
          label="Veículos ativos"
          value={cars.length}
          delta="estoque"
          deltaNeutral
          icon={<CarIcon className="h-5 w-5" />}
          accent="bg-accent text-accent-foreground"
        />
      </section>

      {/* Top of the week */}
      {topClicked && topInsight && (
        <section className="overflow-hidden rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/15 via-card to-card p-5 shadow-card md:p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center">
            <div className="relative shrink-0">
              <img
                src={topClicked.image}
                alt={topClicked.name}
                className="h-32 w-full rounded-xl object-cover md:h-28 md:w-44"
              />
              <span className="absolute -left-2 -top-2 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-primary-foreground shadow-red">
                <Trophy className="h-3 w-3" /> Top da semana
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-primary">
                <Flame className="h-3.5 w-3.5" /> Mais clicado da semana
              </p>
              <h2 className="mt-1 text-2xl font-black uppercase tracking-tight text-foreground md:text-3xl">
                {topClicked.name}
              </h2>
              <p className="text-sm text-muted-foreground">
                {topClicked.year} · {formatPrice(topClicked.price)}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-whatsapp/15 px-3 py-1.5 font-bold text-whatsapp">
                  <MessageCircle className="h-4 w-4 fill-current" strokeWidth={0} />
                  {topInsight.whatsappClicks} cliques
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1.5 font-bold text-primary">
                  <Eye className="h-4 w-4" />
                  {topInsight.views.toLocaleString("pt-BR")} views
                </span>
              </div>

              {/* Mini sparkline */}
              <div className="mt-4">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Views · últimos 7 dias
                </p>
                <div className="h-12 w-full max-w-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topSparkline} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                      <Bar dataKey="v" fill="oklch(0.62 0.24 25)" radius={[3, 3, 0, 0]} />
                      <Tooltip
                        cursor={{ fill: "oklch(0.97 0 0 / 0.05)" }}
                        contentStyle={{
                          background: "oklch(0.20 0.012 20)",
                          border: "1px solid oklch(0.28 0.01 20)",
                          borderRadius: 8,
                          color: "oklch(0.97 0 0)",
                          fontSize: 11,
                          padding: "4px 8px",
                        }}
                        labelStyle={{ display: "none" }}
                        formatter={(v: number) => [`${v} views`, ""]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <Link
              to="/veiculo/$carId"
              params={{ carId: topClicked.id }}
              className="shrink-0 rounded-full bg-primary px-5 py-3 text-center text-xs font-black uppercase tracking-wider text-primary-foreground shadow-red transition hover:brightness-110"
            >
              Ver veículo
            </Link>
          </div>
        </section>
      )}

      {/* Activity chart */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-card md:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Atividade · 7 dias</h2>
            <p className="text-xs text-muted-foreground">
              Visualizações e cliques no WhatsApp por dia
            </p>
          </div>
          <span className="hidden items-center gap-1 rounded-full bg-whatsapp/10 px-3 py-1 text-xs font-semibold text-whatsapp sm:inline-flex">
            <TrendingUp className="h-3.5 w-3.5" />
            em alta
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={activity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.62 0.24 25)" stopOpacity={0.7} />
                  <stop offset="100%" stopColor="oklch(0.62 0.24 25)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradWhats" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.68 0.18 145)" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="oklch(0.68 0.18 145)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="oklch(0.28 0.01 20)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" stroke="oklch(0.72 0.01 20)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="oklch(0.72 0.01 20)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: "oklch(0.20 0.012 20)",
                  border: "1px solid oklch(0.28 0.01 20)",
                  borderRadius: 12,
                  color: "oklch(0.97 0 0)",
                  fontSize: 12,
                }}
                labelStyle={{ color: "oklch(0.97 0 0)", fontWeight: 600 }}
              />
              <Area type="monotone" dataKey="views" name="Visualizações" stroke="oklch(0.62 0.24 25)" strokeWidth={3} fill="url(#gradViews)" />
              <Area type="monotone" dataKey="whatsapp" name="WhatsApp" stroke="oklch(0.68 0.18 145)" strokeWidth={2.5} fill="url(#gradWhats)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-3 flex items-center gap-5 text-xs text-muted-foreground">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" />
            Visualizações
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-whatsapp" />
            WhatsApp
          </span>
        </div>
      </section>

      <p className="text-center text-xs text-muted-foreground">
        Dados de demonstração · conecte ao backend (VITE_API_URL) para métricas reais em tempo real.
      </p>
    </div>
  );
}

interface KpiCardProps {
  label: string;
  value: number;
  delta: string;
  icon: React.ReactNode;
  accent: string;
  deltaNeutral?: boolean;
}

function KpiCard({ label, value, delta, icon, accent, deltaNeutral }: KpiCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-start justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent}`}>
          {icon}
        </div>
      </div>
      <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-5xl font-black tabular-nums leading-none text-foreground md:text-[3.25rem]">
        {value.toLocaleString("pt-BR")}
      </p>
      <p
        className={`mt-3 inline-flex items-center gap-1 text-xs font-bold ${
          deltaNeutral ? "text-muted-foreground" : "text-whatsapp"
        }`}
      >
        {!deltaNeutral && <ArrowUpRight className="h-3.5 w-3.5" />}
        {delta}
        {!deltaNeutral && <span className="text-muted-foreground font-medium ml-1">vs. semana passada</span>}
      </p>
    </div>
  );
}
