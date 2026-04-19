import { createFileRoute, Link } from "@tanstack/react-router";
import { allCars, formatPrice } from "@/data/cars";
import { getCarInsights } from "@/data/insights";
import { Eye, MessageCircle } from "lucide-react";

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
  const carInsights = getCarInsights();
  const ranked = [...allCars].sort(
    (a, b) => (carInsights[b.id]?.views ?? 0) - (carInsights[a.id]?.views ?? 0),
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
          Ordenado por veículos mais vistos · {ranked.length} veículos
        </p>
      </header>

      {/* Desktop table */}
      <section className="hidden overflow-hidden rounded-2xl border border-border bg-card shadow-card md:block">
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
                <tr key={car.id} className="border-t border-border transition hover:bg-secondary/30">
                  <td className="px-6 py-4">
                    <Link to="/veiculo/$carId" params={{ carId: car.id }} className="flex items-center gap-3">
                      <img src={car.image} alt={car.name} className="h-12 w-16 rounded-md object-cover" />
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
                    <span className="font-semibold text-whatsapp">{ins.whatsappClicks}</span>
                  </td>
                  <td className="px-6 py-4 text-right tabular-nums text-muted-foreground">
                    {conv.toFixed(1)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* Mobile cards */}
      <ul className="space-y-3 md:hidden">
        {ranked.map((car) => {
          const ins = carInsights[car.id];
          return (
            <li key={car.id} className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
              <Link to="/veiculo/$carId" params={{ carId: car.id }} className="flex gap-3 p-3">
                <img src={car.image} alt={car.name} className="h-16 w-20 flex-shrink-0 rounded-md object-cover" />
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
                      <span className="font-semibold tabular-nums">{ins.whatsappClicks}</span>
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
