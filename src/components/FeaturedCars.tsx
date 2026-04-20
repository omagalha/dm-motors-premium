import { formatKm, formatPrice } from "@/data/cars";
import { useCars } from "@/data/carsStore";
import {
  getVehicleBadgeStyle,
  getVehiclePrimaryImage,
  getVehicleWhatsappNumber,
} from "@/lib/vehicles";
import { whatsappLink } from "@/lib/whatsapp";
import {
  MessageCircle,
  Eye,
  Flame,
  Gauge,
  Zap,
  BadgePercent,
  Tag,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";

function BadgeIcon({ icon }: { icon: ReturnType<typeof getVehicleBadgeStyle>["icon"] }) {
  if (icon === "flame") return <Flame className="h-3 w-3" />;
  if (icon === "gauge") return <Gauge className="h-3 w-3" />;
  if (icon === "zap") return <Zap className="h-3 w-3" />;
  if (icon === "badge-percent") return <BadgePercent className="h-3 w-3" />;
  return <Tag className="h-3 w-3" />;
}

export function FeaturedCars() {
  const cars = useCars().filter((car) => car.active && car.isFeatured).slice(0, 4);

  if (!cars.length) return null;

  return (
    <section id="estoque" className="relative bg-background py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-5">
        <div className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
              <Flame className="h-4 w-4" /> Destaques
            </span>
            <h2 className="mt-2 text-4xl font-black uppercase text-foreground md:text-5xl">
              Oportunidades<br className="md:hidden" /> da semana
            </h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Carros selecionados a dedo, com preco abaixo do mercado e prontos para entrega.
            </p>
          </div>
          <Link
            to="/estoque"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-xs font-bold uppercase tracking-wider text-foreground transition hover:border-primary hover:text-primary"
          >
            <Eye className="h-4 w-4" /> Ver estoque completo
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {cars.map((car, index) => {
            const badgeStyle = getVehicleBadgeStyle(car.badge);
            const primaryImage = getVehiclePrimaryImage(car);
            return (
              <motion.article
                key={car.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                whileHover={{ y: -6 }}
                className="group overflow-hidden rounded-2xl border border-border bg-card shadow-card transition hover:border-primary/50 hover:shadow-red"
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

                <div className="p-4">
                  <Link
                    to="/veiculo/$carId"
                    params={{ carId: car.id }}
                    className="text-sm font-semibold uppercase tracking-tight text-muted-foreground transition hover:text-primary"
                  >
                    {car.name} <span className="opacity-70">{car.year}</span>
                  </Link>
                  <p className="mt-2 text-3xl font-black tabular-nums text-primary">
                    {formatPrice(car.price)}
                  </p>
                  <p className="mt-1 text-[11px] font-medium text-muted-foreground">
                    {formatKm(car.mileage)}
                  </p>

                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {car.tags.slice(0, 3).map((tag) => (
                      <li
                        key={tag}
                        className="rounded-md bg-secondary px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 flex gap-2">
                    <a
                      href={whatsappLink(
                        `Ola! Vi o veiculo ${car.name} ${car.year} no site e tenho interesse. Ele ainda esta disponivel?`,
                        getVehicleWhatsappNumber(car)
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-whatsapp px-3 py-2.5 text-xs font-black uppercase text-whatsapp-foreground transition hover:brightness-110"
                    >
                      <MessageCircle className="h-3.5 w-3.5 fill-current" strokeWidth={0} />
                      Chamar no WhatsApp
                    </a>
                    <Link
                      to="/veiculo/$carId"
                      params={{ carId: car.id }}
                      aria-label="Ver detalhes"
                      className="flex items-center justify-center rounded-lg border border-border px-3 py-2.5 text-foreground transition hover:border-primary hover:text-primary"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
