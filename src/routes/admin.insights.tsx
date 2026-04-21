import { createFileRoute, Link } from "@tanstack/react-router";
import { formatPrice } from "@/data/cars";
import { useCars } from "@/data/carsStore";
import { getVehicleMetricsSummary, getVehiclePrimaryImage } from "@/lib/vehicles";
import { Eye, MessageCircle, Flame, Car as CarIcon } from "lucide-react";

export const Route = createFileRoute("/admin/insights")({
  head: () => ({
    meta: [
      { title: "Insights — Admin DM Motors" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminInsights,
});

function AdminInsights() {
  const cars = useCars();
  const carInsights = Object.fromEntries(cars.map((car) => [car.id, getVehicleMetricsSummary(car)]));
  const ranked = [...cars].sort(
    (a, b) => (carInsights[b.id]?.views ?? 0) - (carInsights[a.id]?.views ?? 0),
  );

  const topViews = ranked[0] ? carInsights[ranked[0].id].views : 1;
  const totals = ranked.reduce(
    (acc, car) => {
      const ins = carInsights[car.id];
      return {
        views: acc.views + (ins?.views ?? 0),
        whatsapp: acc.whatsapp + (ins?.whatsappClicks ?? 0),
      };
    },
    { views: 0, whatsapp: 0 },
  );

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary">
          Performance
        </p>
        <h1 className="mt-1.5 text-3xl font-black tracking-tight text-foreground md:text-4xl">
          Insights por veículo
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ordenado por veículos mais vistos
        </p>
      </header>

      {/* Totals */}
      <section className="grid grid-cols-3 gap-3 sm:gap-4">
        <TotalCard
          label="Views"
          value={totals.views}
          icon={<Eye className="h-4 w-4" />}
          accent="text-primary"
          ring="bg-primary/15"
        />
        <TotalCard
          label="Mensagens"
          value={totals.whatsapp}
          icon={<MessageCircle className="h-4 w-4 fill-current" strokeWidth={0} />}
          accent="text-whatsapp"
          ring="bg-whatsapp/15"
        />
        <TotalCard
          label="Veículos"
          value={ranked.length}
          icon={<CarIcon className="h-4 w-4" />}
          accent="text-foreground"
          ring="bg-foreground/10"
        />
      </section>

      {/* Ranking list */}
      <ul className="space-y-3">
        {ranked.map((car, idx) => {
          const ins = carInsights[car.id];
          const pct = topViews ? Math.round((ins.views / topViews) * 100) : 0;
          const isFirst = idx === 0;
          const rank = idx + 1;
          return (
            <li
              key={car.id}
              className={`overflow-hidden rounded-2xl border bg-card shadow-card transition hover:border-primary/40 ${
                isFirst ? "border-primary/60 shadow-red" : "border-border"
              }`}
            >
              <Link
                to="/veiculo/$carId"
                params={{ carId: car.id }}
                className="flex items-center gap-3 p-3 sm:gap-5 sm:p-4"
              >
                {/* Rank number */}
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl font-black tabular-nums sm:h-16 sm:w-16 sm:text-3xl ${
                    isFirst
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  #{rank}
                </div>

                {/* Image */}
                <img
                  src={getVehiclePrimaryImage(car)}
                  alt={car.name}
                  className="h-16 w-20 shrink-0 rounded-md object-cover sm:h-20 sm:w-28"
                />

                {/* Info + progress */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-bold text-foreground sm:text-base">
                          {car.name}
                        </p>
                        {isFirst && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary">
                            <Flame className="h-3 w-3" /> Mais visto
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground sm:text-xs">
                        {car.year} · {formatPrice(car.price)}
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="mt-2 flex items-center gap-4 text-xs">
                    <span className="inline-flex items-center gap-1 font-semibold text-primary">
                      <Eye className="h-3.5 w-3.5" />
                      <span className="tabular-nums">
                        {ins.views.toLocaleString("pt-BR")}
                      </span>
                      <span className="text-muted-foreground font-medium hidden sm:inline">views</span>
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-whatsapp">
                      <MessageCircle className="h-3.5 w-3.5 fill-current" strokeWidth={0} />
                      <span className="tabular-nums">{ins.whatsappClicks}</span>
                      <span className="text-muted-foreground font-medium hidden sm:inline">msgs</span>
                    </span>
                    <span className="ml-auto text-[10px] font-bold tabular-nums text-muted-foreground">
                      {pct}%
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

interface TotalCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: string;
  ring: string;
}

function TotalCard({ label, value, icon, accent, ring }: TotalCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${ring} ${accent}`}>
        {icon}
      </div>
      <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-black tabular-nums leading-none sm:text-3xl ${accent}`}>
        {value.toLocaleString("pt-BR")}
      </p>
    </div>
  );
}
