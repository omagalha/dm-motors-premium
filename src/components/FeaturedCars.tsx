import { allCars, formatKm, formatPrice, type CarTag } from "@/data/cars";
import { whatsappLink } from "@/lib/whatsapp";
import { MessageCircle, Eye, Flame, Gauge, Zap, BadgePercent } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";

const tagStyles: Record<CarTag, { bg: string; icon: React.ReactNode }> = {
  OPORTUNIDADE: { bg: "bg-primary text-primary-foreground", icon: <Flame className="h-3 w-3" /> },
  "BAIXA KM": { bg: "bg-whatsapp text-whatsapp-foreground", icon: <Gauge className="h-3 w-3" /> },
  "VENDE RÁPIDO": { bg: "bg-amber-500 text-black", icon: <Zap className="h-3 w-3" /> },
  "ZERO ENTRADA": { bg: "bg-blue-500 text-white", icon: <BadgePercent className="h-3 w-3" /> },
};

export function FeaturedCars() {
  const cars = allCars.slice(0, 4);

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
              Carros selecionados a dedo, com preço abaixo do mercado e prontos para entrega.
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
          {cars.map((car, i) => {
            const style = tagStyles[car.tag];
            return (
              <motion.article
                key={car.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                whileHover={{ y: -6 }}
                className="group overflow-hidden rounded-2xl border border-border bg-card shadow-card transition hover:border-primary/50 hover:shadow-red"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  <img
                    src={car.image}
                    alt={car.name}
                    width={1024}
                    height={768}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                  <span
                    className={`absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${style.bg}`}
                  >
                    {style.icon}
                    {car.tag}
                  </span>
                  <span className="absolute right-3 top-3 rounded-full bg-background/80 px-2.5 py-1 text-xs font-bold text-foreground backdrop-blur">
                    {formatPrice(car.price)}
                  </span>
                </div>

                <div className="p-4">
                  <h3 className="text-lg font-bold uppercase tracking-tight text-foreground">
                    {car.name} <span className="text-muted-foreground">{car.year}</span>
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">{formatKm(car.km)}</p>

                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {car.highlights.map((h) => (
                      <li
                        key={h}
                        className="rounded-md bg-secondary px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
                      >
                        {h}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 flex gap-2">
                    <a
                      href={whatsappLink(`Olá! Tenho interesse no ${car.name} ${car.year}.`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-whatsapp px-3 py-2.5 text-xs font-bold uppercase text-whatsapp-foreground transition hover:brightness-110"
                    >
                      <MessageCircle className="h-3.5 w-3.5 fill-current" strokeWidth={0} />
                      Quero esse
                    </a>
                    <button className="flex items-center justify-center rounded-lg border border-border px-3 py-2.5 text-foreground transition hover:border-primary hover:text-primary">
                      <Eye className="h-4 w-4" />
                    </button>
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
