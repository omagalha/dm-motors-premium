import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { formatPrice } from "@/data/cars";
import { useCars } from "@/data/carsStore";
import {
  createEmptyVehicleMetricsSummary,
  getVehicleMetricsSummary,
  getVehiclePrimaryImage,
} from "@/lib/vehicles";
import {
  getVehicleAnalyticsOverview,
  type VehicleAnalyticsOverview,
} from "@/services/analyticsService";
import {
  Activity,
  Car as CarIcon,
  Clock3,
  Eye,
  Flame,
  MessageCircle,
  Trophy,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Visao geral - Admin DM Motors" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminOverview,
});

const emptyOverview: VehicleAnalyticsOverview = {
  totals: {
    views: 0,
    whatsappClicks: 0,
    vehiclesWithEngagement: 0,
  },
  activity: [],
};

function formatMetricTimestamp(value?: string) {
  if (!value) return "Sem registro ainda";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Sem registro ainda";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(parsed);
}

function getTopSources(sources?: Record<string, number>, limit = 3) {
  if (!sources) return [];

  return Object.entries(sources)
    .sort(([, left], [, right]) => right - left)
    .slice(0, limit);
}

function AdminOverview() {
  const cars = useCars();
  const [overview, setOverview] = useState<VehicleAnalyticsOverview>(emptyOverview);

  useEffect(() => {
    let cancelled = false;

    getVehicleAnalyticsOverview()
      .then((data) => {
        if (!cancelled) {
          setOverview(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setOverview(emptyOverview);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const carInsights = useMemo(
    () => Object.fromEntries(cars.map((car) => [car.id, getVehicleMetricsSummary(car)])),
    [cars],
  );

  const derivedTotals = useMemo(
    () =>
      cars.reduce(
        (acc, car) => {
          const metrics = getVehicleMetricsSummary(car);
          const hasEngagement = metrics.views > 0 || metrics.whatsappClicks > 0;

          return {
            views: acc.views + metrics.views,
            whatsappClicks: acc.whatsappClicks + metrics.whatsappClicks,
            vehiclesWithEngagement: acc.vehiclesWithEngagement + (hasEngagement ? 1 : 0),
          };
        },
        { views: 0, whatsappClicks: 0, vehiclesWithEngagement: 0 },
      ),
    [cars],
  );

  const hasOverviewData =
    overview.activity.length > 0 ||
    overview.totals.views > 0 ||
    overview.totals.whatsappClicks > 0 ||
    overview.totals.vehiclesWithEngagement > 0;

  const totals = hasOverviewData ? overview.totals : derivedTotals;
  const activity = overview.activity;

  const topClicked = [...cars].sort(
    (a, b) =>
      (carInsights[b.id]?.whatsappClicks ?? 0) - (carInsights[a.id]?.whatsappClicks ?? 0),
  )[0];
  const topInsight = topClicked
    ? carInsights[topClicked.id] ?? createEmptyVehicleMetricsSummary()
    : null;
  const topSources = getTopSources(topInsight?.sources);

  const avgPrice = cars.length
    ? Math.round(cars.reduce((sum, car) => sum + car.price, 0) / cars.length)
    : 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary">
            Painel · metricas reais
          </p>
          <h1 className="mt-1.5 text-3xl font-black tracking-tight text-foreground md:text-4xl">
            Visao geral
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {cars.length} veiculos no estoque · ticket medio {formatPrice(avgPrice)}
          </p>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Cliques no WhatsApp"
          value={totals.whatsappClicks}
          subtext={`${totals.vehiclesWithEngagement} veiculos com engajamento`}
          icon={<MessageCircle className="h-5 w-5" />}
          accent="bg-whatsapp/15 text-whatsapp"
        />
        <KpiCard
          label="Visualizacoes"
          value={totals.views}
          subtext={
            activity.length ? `${activity.length} dias reais monitorados` : "Aguardando historico"
          }
          icon={<Eye className="h-5 w-5" />}
          accent="bg-primary/15 text-primary"
        />
        <KpiCard
          label="Veiculos com engajamento"
          value={totals.vehiclesWithEngagement}
          subtext="Com views ou cliques registrados"
          icon={<Activity className="h-5 w-5" />}
          accent="bg-foreground/10 text-foreground"
        />
        <KpiCard
          label="Veiculos ativos"
          value={cars.length}
          subtext="Estoque acompanhado pelo painel"
          icon={<CarIcon className="h-5 w-5" />}
          accent="bg-accent text-accent-foreground"
        />
      </section>

      {topClicked && topInsight && (
        <section className="overflow-hidden rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/15 via-card to-card p-5 shadow-card md:p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center">
            <div className="relative shrink-0">
              <img
                src={getVehiclePrimaryImage(topClicked)}
                alt={topClicked.name}
                className="h-32 w-full rounded-xl object-cover md:h-28 md:w-44"
              />
              <span className="absolute -left-2 -top-2 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-primary-foreground shadow-red">
                <Trophy className="h-3 w-3" /> Top do painel
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-primary">
                <Flame className="h-3.5 w-3.5" /> Mais clicado ate agora
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

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <MetricInfo
                  icon={<Clock3 className="h-4 w-4" />}
                  label="Ultimo clique"
                  value={formatMetricTimestamp(topInsight.lastWhatsappClickAt)}
                />
                <MetricInfo
                  icon={<TrendingUp className="h-4 w-4" />}
                  label="Ultima visualizacao"
                  value={formatMetricTimestamp(topInsight.lastViewAt)}
                />
              </div>

              {topSources.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Origens mais frequentes
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {topSources.map(([source, total]) => (
                      <span
                        key={source}
                        className="rounded-full bg-background/80 px-3 py-1 text-[11px] font-semibold text-foreground"
                      >
                        {source} · {total}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <Link
              to="/veiculo/$carId"
              params={{ carId: topClicked.id }}
              className="shrink-0 rounded-full bg-primary px-5 py-3 text-center text-xs font-black uppercase tracking-wider text-primary-foreground shadow-red transition hover:brightness-110"
            >
              Ver veiculo
            </Link>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-border bg-card p-5 shadow-card md:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Atividade · 7 dias</h2>
            <p className="text-xs text-muted-foreground">
              Visualizacoes e cliques no WhatsApp registrados no backend
            </p>
          </div>
          <span className="hidden items-center gap-1 rounded-full bg-whatsapp/10 px-3 py-1 text-xs font-semibold text-whatsapp sm:inline-flex">
            <TrendingUp className="h-3.5 w-3.5" />
            dados reais
          </span>
        </div>

        {activity.length ? (
          <>
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
                  <CartesianGrid
                    stroke="oklch(0.28 0.01 20)"
                    strokeDasharray="3 3"
                    vertical={false}
                  />
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
                    name="Visualizacoes"
                    stroke="oklch(0.62 0.24 25)"
                    strokeWidth={3}
                    fill="url(#gradViews)"
                  />
                  <Area
                    type="monotone"
                    dataKey="whatsappClicks"
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
                Visualizacoes
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-whatsapp" />
                WhatsApp
              </span>
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-background/50 px-5 py-10 text-center">
            <p className="text-sm font-semibold text-foreground">
              O grafico vai aparecer assim que o backend acumular historico diario.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Os contadores por veiculo ja estao vindo do backend real.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

interface KpiCardProps {
  label: string;
  value: number;
  subtext: string;
  icon: React.ReactNode;
  accent: string;
}

function KpiCard({ label, value, subtext, icon, accent }: KpiCardProps) {
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
      <p className="mt-3 text-xs font-semibold text-muted-foreground">{subtext}</p>
    </div>
  );
}

function MetricInfo({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
      <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
