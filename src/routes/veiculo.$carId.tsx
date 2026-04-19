import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FloatingWhatsApp } from "@/components/WhatsAppButton";
import { allCars, formatKm, formatPrice, type Car, type CarTag } from "@/data/cars";
import { getCarById } from "@/data/carsStore";
import { whatsappLink } from "@/lib/whatsapp";
import {
  MessageCircle,
  Phone,
  Calendar,
  Gauge,
  Fuel as FuelIcon,
  Settings2,
  Palette,
  Car as CarIcon,
  ShieldCheck,
  Wrench,
  Banknote,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Flame,
  Zap,
  BadgePercent,
  Check,
  Share2,
} from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/veiculo/$carId")({
  loader: ({ params }) => {
    const car = getCarById(params.carId) ?? allCars.find((c) => c.id === params.carId);
    if (!car) throw notFound();
    return { car };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Veículo — DM Motors Imports" }] };
    const { car } = loaderData;
    const title = `${car.name} ${car.year} — ${formatPrice(car.price)} | DM Motors Imports`;
    const description = `${car.name} ${car.year}, ${formatKm(car.km)}, ${car.transmission}, ${car.fuel}. ${car.highlights.join(", ")}. Fale agora no WhatsApp.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:image", content: car.image },
        { property: "og:type", content: "product" },
        { name: "twitter:image", content: car.image },
      ],
    };
  },
  notFoundComponent: NotFound,
  errorComponent: ErrorView,
  component: VehiclePage,
});

const tagStyles: Record<CarTag, { bg: string; icon: React.ReactNode }> = {
  OPORTUNIDADE: { bg: "bg-primary text-primary-foreground", icon: <Flame className="h-3.5 w-3.5" /> },
  "BAIXA KM": { bg: "bg-whatsapp text-whatsapp-foreground", icon: <Gauge className="h-3.5 w-3.5" /> },
  "VENDE RÁPIDO": { bg: "bg-amber-500 text-black", icon: <Zap className="h-3.5 w-3.5" /> },
  "ZERO ENTRADA": { bg: "bg-blue-500 text-white", icon: <BadgePercent className="h-3.5 w-3.5" /> },
};

function VehiclePage() {
  const { car } = Route.useLoaderData() as { car: Car };
  // Build a small gallery (placeholder: same image repeated — easy to swap later)
  const gallery = [car.image, car.image, car.image, car.image];
  const [activeImage, setActiveImage] = useState(0);

  const tag = tagStyles[car.tag];

  const whatsappMessage = `Olá! Vi o veículo ${car.name} ${car.year} no site e tenho interesse. Ele ainda está disponível?`;

  const specs = [
    { icon: Calendar, label: "Ano", value: String(car.year) },
    { icon: Gauge, label: "Km", value: formatKm(car.km) },
    { icon: Settings2, label: "Câmbio", value: car.transmission },
    { icon: FuelIcon, label: "Combustível", value: car.fuel },
    { icon: Palette, label: "Cor", value: car.color },
    { icon: CarIcon, label: "Categoria", value: car.category },
  ];

  // Normaliza features: aceita array já parseado ou strings com vírgula/quebra de linha
  const features = (car.features ?? [])
    .flatMap((f) => String(f).split(/[,\n]/))
    .map((f) => f.trim())
    .filter(Boolean);
  const description = car.description?.trim() ?? "";

  const related = allCars.filter((c) => c.id !== car.id).slice(0, 3);

  const next = () => setActiveImage((i) => (i + 1) % gallery.length);
  const prev = () => setActiveImage((i) => (i - 1 + gallery.length) % gallery.length);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Breadcrumb */}
      <div className="border-b border-border bg-card/50">
        <div className="mx-auto max-w-7xl px-5 py-3 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/estoque" className="hover:text-foreground">Estoque</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{car.name}</span>
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-5 py-6 md:py-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr_1fr]">
          {/* Gallery */}
          <div>
            <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-card">
              <motion.img
                key={activeImage}
                initial={{ opacity: 0.6, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                src={gallery[activeImage]}
                alt={`${car.name} - foto ${activeImage + 1}`}
                width={1024}
                height={768}
                className="aspect-[4/3] w-full object-cover"
              />

              {/* Tag */}
              <span
                className={`absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-wider ${tag.bg}`}
              >
                {tag.icon}
                {car.tag}
              </span>

              {/* Counter */}
              <span className="absolute right-4 top-4 rounded-full bg-background/80 px-3 py-1 text-xs font-bold text-foreground backdrop-blur">
                {activeImage + 1} / {gallery.length}
              </span>

              {/* Arrows */}
              <button
                aria-label="Foto anterior"
                onClick={prev}
                className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/70 text-foreground backdrop-blur transition hover:bg-primary hover:text-primary-foreground"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                aria-label="Próxima foto"
                onClick={next}
                className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/70 text-foreground backdrop-blur transition hover:bg-primary hover:text-primary-foreground"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Thumbs */}
            <div className="mt-3 grid grid-cols-4 gap-3">
              {gallery.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`overflow-hidden rounded-lg border-2 transition ${
                    activeImage === i
                      ? "border-primary opacity-100"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <img
                    src={src}
                    alt={`Miniatura ${i + 1}`}
                    width={256}
                    height={192}
                    loading="lazy"
                    className="aspect-[4/3] w-full object-cover"
                  />
                </button>
              ))}
            </div>

            {/* Description */}
            <div className="mt-8 rounded-2xl border border-border bg-card p-6">
              <h2 className="text-xl font-black uppercase tracking-tight text-foreground">
                Sobre este veículo
              </h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            </div>

            {/* Features */}
            <div className="mt-6 rounded-2xl border border-border bg-card p-6">
              <h2 className="text-xl font-black uppercase tracking-tight text-foreground">
                Itens e opcionais
              </h2>
              <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {car.brand} · {car.year}
              </p>
              <h1 className="mt-2 text-4xl font-black uppercase leading-[0.95] tracking-tight text-foreground sm:text-5xl md:text-6xl">
                {car.name}
              </h1>

              {/* Tags row */}
              <div className="mt-4 flex flex-wrap gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${tag.bg}`}
                >
                  {tag.icon}
                  {car.tag}
                </span>
                {car.highlights.map((h) => (
                  <span
                    key={h}
                    className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground"
                  >
                    {h}
                  </span>
                ))}
              </div>

              <div className="mt-5 border-t border-border pt-5">
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Preço à vista
                </p>
                <p className="text-4xl font-black text-primary md:text-5xl">
                  {formatPrice(car.price)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  ou em até 60x — financiamento facilitado
                </p>
              </div>

              {/* CTAs */}
              <div className="mt-5 space-y-2.5">
                <a
                  href={whatsappLink(whatsappMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="animate-pulse-whatsapp flex w-full items-center justify-center gap-2 rounded-full bg-whatsapp py-4 text-sm font-black uppercase tracking-wider text-whatsapp-foreground shadow-card transition hover:brightness-110"
                >
                  <MessageCircle className="h-5 w-5 fill-current" strokeWidth={0} />
                  📲 Chamar no WhatsApp
                </a>
                <a
                  href="tel:+5532999264848"
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-background py-3 text-xs font-bold uppercase tracking-wider text-foreground transition hover:border-primary hover:text-primary"
                >
                  <Phone className="h-4 w-4" /> Ligar agora
                </a>
                <button
                  onClick={() => {
                    if (typeof navigator !== "undefined" && navigator.share) {
                      navigator.share({
                        title: `${car.name} ${car.year}`,
                        text: `${car.name} ${car.year} por ${formatPrice(car.price)}`,
                        url: typeof window !== "undefined" ? window.location.href : "",
                      }).catch(() => {});
                    }
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-background py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground transition hover:border-primary hover:text-foreground"
                >
                  <Share2 className="h-4 w-4" /> Compartilhar
                </button>
              </div>
            </div>

            {/* Specs */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">
                Ficha técnica
              </h3>
              <dl className="mt-4 grid grid-cols-2 gap-4">
                {specs.map((s) => (
                  <div key={s.label}>
                    <dt className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <s.icon className="h-3.5 w-3.5 text-primary" />
                      {s.label}
                    </dt>
                    <dd className="mt-1 text-sm font-bold text-foreground">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Trust */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">
                Garantias DM Motors
              </h3>
              <ul className="mt-4 space-y-3 text-sm">
                {[
                  { icon: ShieldCheck, label: "Procedência garantida" },
                  { icon: Wrench, label: "Veículo revisado" },
                  { icon: Banknote, label: "Financiamento fácil" },
                  { icon: RefreshCw, label: "Aceitamos troca" },
                ].map((t) => (
                  <li key={t.label} className="flex items-center gap-3 text-foreground">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                      <t.icon className="h-4 w-4" />
                    </span>
                    {t.label}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </section>

      {/* Related */}
      <section className="mx-auto max-w-7xl px-5 pb-16">
        <h2 className="mb-6 text-2xl font-black uppercase text-foreground md:text-3xl">
          Veja também
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((r) => (
            <Link
              key={r.id}
              to="/veiculo/$carId"
              params={{ carId: r.id }}
              className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/50 hover:shadow-red"
            >
              <div className="aspect-[4/3] overflow-hidden bg-muted">
                <img
                  src={r.image}
                  alt={r.name}
                  width={1024}
                  height={768}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-4">
                <h3 className="text-base font-bold uppercase text-foreground">{r.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {r.year} · {formatKm(r.km)}
                </p>
                <p className="mt-2 text-xl font-black text-primary">{formatPrice(r.price)}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <Footer />

      {/* Spacer to prevent content being hidden behind fixed CTA on mobile */}
      <div className="h-24 lg:hidden" aria-hidden="true" />

      {/* Fixed full-width WhatsApp CTA (mobile, iFood-style) */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="mb-2 flex items-center justify-between">
          <p className="truncate text-[11px] font-semibold uppercase text-muted-foreground">
            {car.name}
          </p>
          <p className="text-base font-black text-primary">{formatPrice(car.price)}</p>
        </div>
        <a
          href={whatsappLink(whatsappMessage)}
          target="_blank"
          rel="noopener noreferrer"
          className="animate-pulse-whatsapp flex w-full items-center justify-center gap-2 rounded-full bg-whatsapp py-4 text-sm font-black uppercase tracking-wider text-whatsapp-foreground shadow-card"
        >
          <MessageCircle className="h-5 w-5 fill-current" strokeWidth={0} />
          📲 Chamar no WhatsApp
        </a>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-xl px-5 py-24 text-center">
        <h1 className="text-4xl font-black uppercase text-foreground">Veículo não encontrado</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Esse carro pode ter sido vendido. Veja outras oportunidades no nosso estoque.
        </p>
        <Link
          to="/estoque"
          className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-bold uppercase text-primary-foreground"
        >
          Ver estoque
        </Link>
      </div>
      <Footer />
    </div>
  );
}

function ErrorView({ error }: { error: Error }) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-xl px-5 py-24 text-center">
        <h1 className="text-3xl font-black uppercase text-foreground">Algo deu errado</h1>
        <p className="mt-3 text-sm text-muted-foreground">{error.message}</p>
        <Link
          to="/estoque"
          className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-bold uppercase text-primary-foreground"
        >
          Voltar ao estoque
        </Link>
      </div>
      <Footer />
    </div>
  );
}
