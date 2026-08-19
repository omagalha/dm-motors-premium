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
  Gauge,
  MessageCircle,
  Tag,
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

function EditorialCard({ car, large = false }: { car: Vehicle; large?: boolean }) {
  const badgeStyle = getVehicleBadgeStyle(car.badge);
  const image = getVehiclePrimaryImage(car);

  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55 }}
      className={`group relative overflow-hidden bg-[#0a0a0a] ${
        large ? "min-h-[480px] lg:col-span-2 lg:row-span-2" : "min-h-[340px]"
      }`}
    >
      <Link to="/veiculo/$carId" params={{ carId: car.id }} className="absolute inset-0">
        <img
          src={image}
          alt={car.name}
          width={large ? 1400 : 900}
          height={large ? 1000 : 680}
          loading={large ? "eager" : "lazy"}
          className="h-full w-full object-cover opacity-58 transition duration-700 group-hover:scale-105 group-hover:opacity-72"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08)_0%,rgba(0,0,0,0.42)_46%,rgba(0,0,0,0.94)_100%)]" />
      </Link>

      <div className="pointer-events-none absolute left-4 top-4 flex flex-wrap gap-2">
        {car.badge && (
          <span
            className={`pointer-events-auto inline-flex items-center gap-1 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] ${badgeStyle.bg}`}
          >
            <BadgeIcon icon={badgeStyle.icon} />
            {car.badge}
          </span>
        )}
        <span className="border border-white/12 bg-black/50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-white/72">
          {car.year}
        </span>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/42">
          {car.brand} / {car.category}
        </p>
        <h3
          className={`mt-2 max-w-xl font-display font-black uppercase leading-[0.9] text-white ${
            large ? "text-5xl md:text-6xl" : "text-3xl"
          }`}
        >
          {car.name}
        </h3>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-display text-3xl font-black leading-none text-primary md:text-4xl">
              {formatPrice(car.price)}
            </p>
            <p className="mt-2 text-xs font-semibold text-white/42">
              {formatKm(car.mileage)} / {car.transmission}
            </p>
          </div>

          <div className="flex gap-2">
            <a
              href={whatsappLink(
                `Olá! Vi o veículo ${car.name} ${car.year} no site e tenho interesse. Ele ainda está disponível?`,
                getVehicleWhatsappNumber(car),
              )}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                void trackVehicleWhatsappClick(car.id, { source: "featured-editorial" });
              }}
              className="relative z-10 inline-flex h-11 w-11 items-center justify-center bg-whatsapp text-whatsapp-foreground transition hover:brightness-110"
              aria-label={`Chamar no WhatsApp sobre ${car.name}`}
            >
              <MessageCircle className="h-5 w-5 fill-current" strokeWidth={0} />
            </a>
            <Link
              to="/veiculo/$carId"
              params={{ carId: car.id }}
              className="relative z-10 inline-flex h-11 w-11 items-center justify-center border border-white/14 bg-black/45 text-white transition hover:border-primary hover:text-primary"
              aria-label={`Ver detalhes de ${car.name}`}
            >
              <Eye className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

export function FeaturedCars({ initialCars }: FeaturedCarsProps) {
  const featuredCars = useCars(initialCars)
    .filter((car) => car.active && car.isFeatured)
    .sort((a, b) => Number(b.isSpotlight) - Number(a.isSpotlight) || b.price - a.price)
    .slice(0, 7);

  if (!featuredCars.length) return null;

  const [mainCar, ...rest] = featuredCars;

  return (
    <section id="estoque" className="border-y border-white/[0.06] bg-[#0d0d0d] px-5 py-20 lg:px-10">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-10 flex flex-col items-start justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.32em] text-primary">
              <span className="h-px w-8 bg-primary" />
              Destaques
            </p>
            <h2 className="mt-4 font-display text-5xl font-black uppercase leading-[0.88] text-white md:text-7xl">
              Estoque
              <br />
              <span className="text-primary">selecionado</span>
            </h2>
          </div>

          <div className="max-w-md">
            <p className="text-sm leading-[1.8] text-white/44">
              Uma vitrine enxuta com modelos escolhidos para quem busca apresentação,
              procedência e negociação conduzida de perto.
            </p>
            <Link
              to="/estoque"
              className="mt-5 inline-flex items-center gap-2 border border-white/12 px-5 py-3 text-[11px] font-black uppercase tracking-[0.22em] text-white/74 transition hover:border-primary hover:text-white"
            >
              Ver estoque completo
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="grid gap-0.5 md:grid-cols-2 xl:grid-cols-4">
          <EditorialCard car={mainCar} large />
          {rest.map((car) => (
            <EditorialCard key={car.id} car={car} />
          ))}
        </div>
      </div>
    </section>
  );
}
