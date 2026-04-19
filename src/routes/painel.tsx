import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FloatingWhatsApp } from "@/components/WhatsAppButton";
import { allCars, formatPrice } from "@/data/cars";
import { getCarInsights, getLast7DaysActivity, getTotals } from "@/data/insights";
import { Eye, MessageCircle, TrendingUp, Users } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/painel")({
  head: () => ({
    meta: [
      { title: "Painel de Gestão — DM Motors Imports" },
      {
        name: "description",
        content:
          "Acompanhe cliques no WhatsApp, visualizações e leads dos veículos da DM Motors Imports.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PainelPage,
});

function PainelPage() {
  const totals = getTotals();
  const activity = getLast7DaysActivity();
  const carInsights = getCarInsights();

  // Sort cars by views (best performers first)
  const ranked = [...allCars].sort(
    (a, b) => (carInsights[b.id]?.views ?? 0) - (carInsights[a.id]?.views ?? 0),
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-7xl px-5 py-8 md:py-12">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
              Painel · últimos 7 dias
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground md:text-5xl">
              Resultados da loja
            </h1>
          </div>
          <Link
            to="/estoque"
            className="hidden rounded-full border border-border px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition hover:border-primary hover:text-foreground sm:inline-block"
          >
            Ver estoque
          </Link>
        </div>

        {/* KPI cards */}
        <section className="grid gap-4 sm:grid-cols-3">
          <KpiCard
            label="Cliques no WhatsApp"
            value={totals.whatsapp}
            delta="+18%"
            icon={<MessageCircle className="h-5 w-5" />}
            accent="bg-whatsapp/15 text-whatsapp"
          />
          <KpiCard
            label="Visualizações de veículos"
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
        </section>

        {/* Activity chart */}
        <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-card md:p-6">
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
              <AreaChart
                data={activity}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="gradViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.62 0.24 25)" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="oklch(0.62 0.24 25)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradWhats" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.68 0.18 145)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="oklch(0.68 0.18 145)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="oklch(0.28 0.01 20)" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="day"
                  stroke="oklch(0.72 0.01 20)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="oklch(0.72 0.01 20)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
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
                <Area
                  type="monotone"
                  dataKey="views"
                  name="Visualizações"
                  stroke="oklch(0.62 0.24 25)"
                  strokeWidth={2.5}
                  fill="url(#gradViews)"
                />
                <Area
                  type="monotone"
                  dataKey="whatsapp"
                  name="WhatsApp"
                  stroke="oklch(0.68 0.18 145)"
                  strokeWidth={2.5}
                  fill="url(#gradWhats)"
                />
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

        {/* Vehicles list with insights */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4 md:px-6">
            <div>
              <h2 className="text-lg font-bold text-foreground">Desempenho dos veículos</h2>
              <p className="text-xs text-muted-foreground">
                Ordenado por veículos mais vistos
              </p>
            </div>
            <span className="text-xs font-semibold text-muted-foreground">
              {ranked.length} veículos
            </span>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block">
            <table className="w-full text-sm">
              <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold">Veículo</th>
                  <th className="px-6 py-3 text-right font-semibold">Preço</th>
                  <th className="px-6 py-3 text-right font-semibold">
                    <span className="inline-flex items-center gap-1.5">
                      <Eye className="h-3.5 w-3.5" /> Visualizações
                    </span>
                  </th>
                  <th className="px-6 py-3 text-right font-semibold">
                    <span className="inline-flex items-center gap-1.5">
                      <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                    </span>
                  </th>
                  <th className="px-6 py-3 text-right font-semibold">Conversão</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((car) => {
                  const ins = carInsights[car.id];
                  const conv = ins.views ? (ins.whatsappClicks / ins.views) * 100 : 0;
                  return (
                    <tr
                      key={car.id}
                      className="border-t border-border transition hover:bg-secondary/30"
                    >
                      <td className="px-6 py-4">
                        <Link
                          to="/veiculo/$carId"
                          params={{ carId: car.id }}
                          className="flex items-center gap-3"
                        >
                          <img
                            src={car.image}
                            alt={car.name}
                            className="h-12 w-16 rounded-md object-cover"
                          />
                          <div>
                            <p className="font-semibold text-foreground">{car.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {car.year} · {car.km.toLocaleString("pt-BR")} km
                            </p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-foreground">
                        {formatPrice(car.price)}
                      </td>
                      <td className="px-6 py-4 text-right tabular-nums text-foreground">
                        {ins.views.toLocaleString("pt-BR")}
                      </td>
                      <td className="px-6 py-4 text-right tabular-nums">
                        <span className="font-semibold text-whatsapp">
                          {ins.whatsappClicks}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right tabular-nums text-muted-foreground">
                        {conv.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="divide-y divide-border md:hidden">
            {ranked.map((car) => {
              const ins = carInsights[car.id];
              return (
                <li key={car.id} className="px-5 py-4">
                  <Link
                    to="/veiculo/$carId"
                    params={{ carId: car.id }}
                    className="flex gap-3"
                  >
                    <img
                      src={car.image}
                      alt={car.name}
                      className="h-16 w-20 flex-shrink-0 rounded-md object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-foreground">{car.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {car.year} · {formatPrice(car.price)}
                      </p>
                      <div className="mt-2 flex items-center gap-4 text-xs">
                        <span className="inline-flex items-center gap-1 text-foreground">
                          <Eye className="h-3.5 w-3.5 text-primary" />
                          <span className="font-semibold tabular-nums">
                            {ins.views.toLocaleString("pt-BR")}
                          </span>
                        </span>
                        <span className="inline-flex items-center gap-1 text-foreground">
                          <MessageCircle className="h-3.5 w-3.5 text-whatsapp" />
                          <span className="font-semibold tabular-nums">
                            {ins.whatsappClicks}
                          </span>
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Dados de demonstração · conecte ao Lovable Cloud para métricas reais em tempo real.
        </p>
      </main>

      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}

interface KpiCardProps {
  label: string;
  value: number;
  delta: string;
  icon: React.ReactNode;
  accent: string;
}

function KpiCard({ label, value, delta, icon, accent }: KpiCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-start justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent}`}>
          {icon}
        </div>
        <span className="rounded-full bg-whatsapp/10 px-2 py-0.5 text-[10px] font-bold text-whatsapp">
          {delta}
        </span>
      </div>
      <p className="mt-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-3xl font-black tabular-nums text-foreground">
        {value.toLocaleString("pt-BR")}
      </p>
    </div>
  );
}
