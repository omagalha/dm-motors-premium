import { formatKm, formatPrice } from "@/data/cars";
import { useCars } from "@/data/carsStore";
import {
  getVehicleBadgeStyle,
  getVehiclePrimaryImage,
  getVehicleWhatsappNumber,
} from "@/lib/vehicles";
import { whatsappLink } from "@/lib/whatsapp";
import { trackVehicleWhatsappClick } from "@/services/analyticsService";
import type { Vehicle } from "@/types/vehicle";
import {
  ArrowRight,
  BadgePercent,
  Eye,
  Flame,
  Fuel,
  Gauge,
  MapPin,
  MessageCircle,
  Tag,
  TimerReset,
  Zap,
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

interface FeaturedCarsProps {
  initialCars?: Vehicle[];
}

function SpotlightInfo({ label }: { label: string }) {
  return (
    <li className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm font-medium text-muted-foreground">
      {label}
    </li>
  );
}

export function FeaturedCars({ initialCars }: FeaturedCarsProps) {
  const featuredCars = useCars(initialCars)
    .filter((car) => car.active && car.isFeatured)
    .sort((a, b) => b.price - a.price)
    .slice(0, 7);

  if (!featuredCars.length) return null;

  const [spotlightCar, ...gridCars] = featuredCars;
  const spotlightImage = getVehiclePrimaryImage(spotlightCar);
  const spotlightBadge = getVehicleBadgeStyle(spotlightCar.badge);

  return (
    <section id="estoque" className="relative bg-card py-18 md:py-24">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,oklch(0.62_0.24_25/0.10),transparent_55%)]" />

      <div className="mx-auto max-w-7xl px-5">
        <div className="mb-9 flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] text-primary">
              <Flame className="h-4 w-4" />
              Showroom em destaque
            </span>
            <h2 className="mt-3 text-[2.15rem] font-black uppercase leading-[0.95] text-foreground md:text-[3rem]">
              Estoque
            </h2>
            <p className="mt-3 max-w-[38rem] text-sm leading-[1.68] text-muted-foreground md:text-base">
              Modelos escolhidos para quem busca procedencia, boa apresentacao e negociacao
              objetiva.
            </p>
          </div>

          <Link
            to="/estoque"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-foreground transition hover:border-primary hover:text-primary"
          >
            Ver estoque completo
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <motion.article
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,oklch(0.15_0.01_20)_0%,oklch(0.11_0.008_20)_100%)] shadow-[0_30px_90px_-45px_rgba(0,0,0,0.9)]"
        >
          <div className="grid lg:grid-cols-[1.08fr_0.92fr]">
            <Link
              to="/veiculo/$carId"
              params={{ carId: spotlightCar.id }}
              className="relative block min-h-[320px] overflow-hidden bg-muted lg:min-h-[480px]"
            >
              <img
                src={spotlightImage}
                alt={spotlightCar.name}
                width={1280}
                height={960}
                className="h-full w-full object-cover transition duration-700 hover:scale-105"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,transparent_46%,rgba(0,0,0,0.72)_100%)]" />

              <div className="absolute left-5 top-5 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/12 bg-black/45 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-white">
                  Veiculo em destaque
                </span>
                {spotlightCar.badge && (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${spotlightBadge.bg}`}
                  >
                    <BadgeIcon icon={spotlightBadge.icon} />
                    {spotlightCar.badge}
                  </span>
                )}
              </div>

              <div className="absolute bottom-5 left-5 right-5 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/72">
                    {spotlightCar.brand}
                  </p>
                  <h3 className="mt-2 text-[1.9rem] font-black uppercase leading-[0.96] text-white md:text-[2.4rem]">
                    {spotlightCar.name}
                  </h3>
                </div>
                <div className="rounded-2xl border border-white/12 bg-black/45 px-4 py-3 backdrop-blur-sm">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">
                    Valor
                  </p>
                  <p className="mt-1 text-2xl font-black text-white">
                    {formatPrice(spotlightCar.price)}
                  </p>
                </div>
              </div>
            </Link>

            <div className="p-6 md:p-8 lg:p-10">
              <span className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
                Destaque da semana
              </span>

              <p className="mt-4 text-[15px] leading-[1.72] text-muted-foreground sm:text-base">
                {spotlightCar.description ||
                  "Um dos modelos mais interessantes do nosso estoque, com boa apresentacao e negociacao direta."}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <SpotlightInfo label={`${spotlightCar.year} / ${spotlightCar.transmission}`} />
                <SpotlightInfo label={`${spotlightCar.fuel} / ${formatKm(spotlightCar.mileage)}`} />
                <SpotlightInfo label={spotlightCar.city || "Atendimento sob consulta"} />
                <SpotlightInfo label={spotlightCar.category || "Perfil premium"} />
              </div>

              {!!spotlightCar.features.length && (
                <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                  {spotlightCar.features.slice(0, 4).map((feature) => (
                    <li
                      key={feature}
                      className="rounded-2xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground"
                    >
                      {feature}
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-7 flex flex-wrap gap-2">
                {spotlightCar.tags.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white/72"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href={whatsappLink(
                    `Ola! Vi o veiculo ${spotlightCar.name} ${spotlightCar.year} no site e tenho interesse. Ele ainda esta disponivel?`,
                    getVehicleWhatsappNumber(spotlightCar)
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    void trackVehicleWhatsappClick(spotlightCar.id, { source: "featured-spotlight" });
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-whatsapp px-6 py-3.5 text-sm font-black uppercase tracking-[0.16em] text-whatsapp-foreground transition hover:brightness-110"
                >
                  <MessageCircle className="h-4 w-4 fill-current" strokeWidth={0} />
                  Chamar no WhatsApp
                </a>

                <Link
                  to="/veiculo/$carId"
                  params={{ carId: spotlightCar.id }}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background px-6 py-3.5 text-sm font-black uppercase tracking-[0.16em] text-foreground transition hover:border-primary hover:text-primary"
                >
                  Ver detalhes
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </motion.article>

        {gridCars.length > 0 && (
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {gridCars.map((car, index) => {
              const badgeStyle = getVehicleBadgeStyle(car.badge);
              const primaryImage = getVehiclePrimaryImage(car);

              return (
                <motion.article
                  key={car.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.45, delay: index * 0.06 }}
                  className="group overflow-hidden rounded-[28px] border border-border bg-background shadow-card transition hover:border-primary/40 hover:shadow-[0_24px_70px_-42px_oklch(0.62_0.24_25/0.75)]"
                >
                  <Link
                    to="/veiculo/$carId"
                    params={{ carId: car.id }}
                    className="relative block aspect-[16/11] overflow-hidden bg-muted"
                  >
                    <img
                      src={primaryImage}
                      alt={car.name}
                      width={1024}
                      height={704}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,transparent_55%,rgba(0,0,0,0.68)_100%)]" />

                    <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
                      {car.badge && (
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${badgeStyle.bg}`}
                        >
                          <BadgeIcon icon={badgeStyle.icon} />
                          {car.badge}
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/65">
                          {car.brand}
                        </p>
                        <h3 className="mt-2 text-[1.55rem] font-black uppercase leading-[0.98] text-white">
                          {car.name}
                        </h3>
                      </div>
                      <div className="rounded-2xl border border-white/12 bg-black/35 px-3 py-2 text-right backdrop-blur-sm">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/60">
                          Valor
                        </p>
                        <p className="mt-1 text-lg font-black text-white">
                          {formatPrice(car.price)}
                        </p>
                      </div>
                    </div>
                  </Link>

                  <div className="space-y-4 p-5">
                    <div className="grid grid-cols-2 gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      <div className="flex items-center gap-2 rounded-2xl border border-border px-3 py-2">
                        <TimerReset className="h-3.5 w-3.5 text-primary" />
                        {car.year}
                      </div>
                      <div className="flex items-center gap-2 rounded-2xl border border-border px-3 py-2">
                        <Gauge className="h-3.5 w-3.5 text-primary" />
                        {formatKm(car.mileage)}
                      </div>
                      <div className="flex items-center gap-2 rounded-2xl border border-border px-3 py-2">
                        <Fuel className="h-3.5 w-3.5 text-primary" />
                        {car.fuel}
                      </div>
                      <div className="flex items-center gap-2 rounded-2xl border border-border px-3 py-2">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        {car.city || "RJ"}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {car.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-secondary px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <a
                        href={whatsappLink(
                          `Ola! Vi o veiculo ${car.name} ${car.year} no site e tenho interesse. Ele ainda esta disponivel?`,
                          getVehicleWhatsappNumber(car)
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                          void trackVehicleWhatsappClick(car.id, { source: "featured-grid" });
                        }}
                        className="flex flex-1 items-center justify-center gap-2 rounded-full bg-whatsapp px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-whatsapp-foreground transition hover:brightness-110"
                      >
                        <MessageCircle className="h-3.5 w-3.5 fill-current" strokeWidth={0} />
                        WhatsApp
                      </a>

                      <Link
                        to="/veiculo/$carId"
                        params={{ carId: car.id }}
                        aria-label={`Ver detalhes de ${car.name}`}
                        className="flex items-center justify-center rounded-full border border-border px-4 py-3 text-foreground transition hover:border-primary hover:text-primary"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
