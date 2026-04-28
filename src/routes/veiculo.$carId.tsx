import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FloatingWhatsApp } from "@/components/WhatsAppButton";
import { formatKm, formatPrice } from "@/data/cars";
import { useCars } from "@/data/carsStore";
import {
  getVehicleBadgeStyle,
  getVehicleGallery,
  getVehicleImageUrl,
  getVehiclePrimaryImage,
  getVehicleWhatsappNumber,
} from "@/lib/vehicles";
import { whatsappLink } from "@/lib/whatsapp";
import { trackVehicleView, trackVehicleWhatsappClick } from "@/services/analyticsService";
import { createPublicLead } from "@/services/crmService";
import { getVehicleById, getVehicles } from "@/services/vehicleService";
import type { Vehicle } from "@/types/vehicle";
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
  MapPin,
  Tag,
  Send,
} from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/veiculo/$carId")({
  loader: async ({ params }) => {
    const cars = await getVehicles();
    const car = cars.find((item) => item.id === params.carId) ?? (await getVehicleById(params.carId));
    if (!car) throw notFound();
    return {
      car,
      cars: cars.some((item) => item.id === car.id) ? cars : [car, ...cars],
    };
  },
  staleTime: 0,
  shouldReload: () => true,
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Veículo - DM Motors Imports" }] };
    const { car } = loaderData;
    const title = `${car.name} ${car.year} - ${formatPrice(car.price)} | DM Motors Imports`;
    const description = `${car.name} ${car.year}, ${formatKm(car.mileage)}, ${car.transmission}, ${car.fuel}. ${car.city}.`;
    const image = getVehiclePrimaryImage(car);
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:image", content: image },
        { property: "og:type", content: "product" },
        { name: "twitter:image", content: image },
      ],
    };
  },
  notFoundComponent: NotFound,
  errorComponent: ErrorView,
  component: VehiclePage,
});

function BadgeIcon({ icon }: { icon: ReturnType<typeof getVehicleBadgeStyle>["icon"] }) {
  if (icon === "flame") return <Flame className="h-3.5 w-3.5" />;
  if (icon === "gauge") return <Gauge className="h-3.5 w-3.5" />;
  if (icon === "zap") return <Zap className="h-3.5 w-3.5" />;
  if (icon === "badge-percent") return <BadgePercent className="h-3.5 w-3.5" />;
  return <Tag className="h-3.5 w-3.5" />;
}

const SIMULATION_TERMS = [12, 24, 36, 48, 60];
const SIMULATION_MONTHLY_RATE = 0.0145;

function calculateMonthlyPayment(financedValue: number, term: number) {
  if (financedValue <= 0 || term <= 0) return 0;

  const factor = (1 + SIMULATION_MONTHLY_RATE) ** term;
  return (financedValue * SIMULATION_MONTHLY_RATE * factor) / (factor - 1);
}

function formatSimulationCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.max(0, value));
}

function VehiclePage() {
  const { car: loaderCar, cars: initialCars } = Route.useLoaderData() as {
    car: Vehicle;
    cars: Vehicle[];
  };
  const cars = useCars(initialCars);
  const car = cars.find((item) => item.id === loaderCar.id) ?? loaderCar;
  const gallery = getVehicleGallery(car);
  const galleryStateKey = useMemo(
    () =>
      gallery
        .map(
          (image, index) =>
            `${image.publicId ?? image.url}-${image.isCover ? "cover" : "image"}-${index}`
        )
        .join("|"),
    [gallery]
  );
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    const coverIndex = gallery.findIndex((image) => image.isCover);
    setActiveImage(coverIndex >= 0 ? coverIndex : 0);
  }, [car.id, galleryStateKey]);

  useEffect(() => {
    void trackVehicleView(car.id, { source: "detail" });
  }, [car.id]);

  const badgeStyle = getVehicleBadgeStyle(car.badge);
  const whatsappMessage = `Olá! Vi o veículo ${car.name} ${car.year} no site e tenho interesse. Ele ainda está disponível?`;
  const handleWhatsappClick = () => {
    void trackVehicleWhatsappClick(car.id, { source: "detail" });
  };

  const specs = [
    { icon: Calendar, label: "Ano", value: String(car.year) },
    { icon: Gauge, label: "Km", value: formatKm(car.mileage) },
    { icon: Settings2, label: "Câmbio", value: car.transmission },
    { icon: FuelIcon, label: "Combustível", value: car.fuel },
    { icon: Palette, label: "Cor", value: car.color || "Não informado" },
    { icon: CarIcon, label: "Categoria", value: car.category },
    { icon: MapPin, label: "Cidade", value: car.city || "Não informado" },
  ];

  const related = cars.filter((item) => item.id !== car.id && item.active).slice(0, 3);

  const next = () => setActiveImage((index) => (index + 1) % gallery.length);
  const prev = () => setActiveImage((index) => (index - 1 + gallery.length) % gallery.length);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="border-b border-border bg-card/50">
        <div className="mx-auto max-w-7xl px-5 py-3 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link to="/estoque" className="hover:text-foreground">
            Estoque
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{car.name}</span>
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-5 py-6 md:py-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-card">
              <motion.img
                key={activeImage}
                initial={{ opacity: 0.6, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                src={getVehicleImageUrl(gallery[activeImage])}
                alt={`${car.name} - foto ${activeImage + 1}`}
                width={1024}
                height={768}
                className="aspect-[4/3] w-full object-cover"
              />

              {car.badge && (
                <span
                  className={`absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-wider ${badgeStyle.bg}`}
                >
                  <BadgeIcon icon={badgeStyle.icon} />
                  {car.badge}
                </span>
              )}

              <span className="absolute right-4 top-4 rounded-full bg-background/80 px-3 py-1 text-xs font-bold text-foreground backdrop-blur">
                {activeImage + 1} / {gallery.length}
              </span>

              {gallery.length > 1 && (
                <>
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
                </>
              )}
            </div>

            <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {gallery.map((image, index) => (
                <button
                  key={`${image.url}-${index}`}
                  onClick={() => setActiveImage(index)}
                  className={`overflow-hidden rounded-lg border-2 transition ${
                    activeImage === index
                      ? "border-primary opacity-100"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <img
                    src={getVehicleImageUrl(image)}
                    alt={`Miniatura ${index + 1}`}
                    width={256}
                    height={192}
                    loading="lazy"
                    className="aspect-[4/3] w-full object-cover"
                  />
                </button>
              ))}
            </div>

            {car.description && (
              <div className="mt-8 rounded-2xl border border-border bg-card p-6">
                <h2 className="text-xl font-black uppercase tracking-tight text-foreground">
                  Sobre este veículo
                </h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {car.description}
                </p>
              </div>
            )}

            {car.features.length > 0 && (
              <div className="mt-6 rounded-2xl border border-border bg-card p-6">
                <h2 className="text-xl font-black uppercase tracking-tight text-foreground">
                  Itens e opcionais
                </h2>
                <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {car.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="h-4 w-4 shrink-0 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {car.brand} - {car.year}
              </p>
              <h1 className="mt-2 text-4xl font-black uppercase leading-[0.95] tracking-tight text-foreground sm:text-5xl md:text-6xl">
                {car.name}
              </h1>

              <div className="mt-4 flex flex-wrap gap-2">
                {car.badge && (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${badgeStyle.bg}`}
                  >
                    <BadgeIcon icon={badgeStyle.icon} />
                    {car.badge}
                  </span>
                )}
                {car.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground"
                  >
                    {tag}
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
                  ou em até 60x - financiamento facilitado
                </p>
              </div>

              <div className="mt-5 space-y-2.5">
                <a
                  href={whatsappLink(whatsappMessage, getVehicleWhatsappNumber(car))}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleWhatsappClick}
                  className="animate-pulse-whatsapp flex w-full items-center justify-center gap-2 rounded-full bg-whatsapp py-4 text-sm font-black uppercase tracking-wider text-whatsapp-foreground shadow-card transition hover:brightness-110"
                >
                  <MessageCircle className="h-5 w-5 fill-current" strokeWidth={0} />
                  Chamar no WhatsApp
                </a>
                <a
                  href={`tel:+${getVehicleWhatsappNumber(car)}`}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-background py-3 text-xs font-bold uppercase tracking-wider text-foreground transition hover:border-primary hover:text-primary"
                >
                  <Phone className="h-4 w-4" /> Ligar agora
                </a>
                <button
                  onClick={() => {
                    if (typeof navigator !== "undefined" && navigator.share) {
                      navigator
                        .share({
                          title: `${car.name} ${car.year}`,
                          text: `${car.name} ${car.year} por ${formatPrice(car.price)}`,
                          url: typeof window !== "undefined" ? window.location.href : "",
                        })
                        .catch(() => {});
                    }
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-background py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground transition hover:border-primary hover:text-foreground"
                >
                  <Share2 className="h-4 w-4" /> Compartilhar
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">
                Ficha técnica
              </h3>
              <dl className="mt-4 grid grid-cols-2 gap-4">
                {specs.map((spec) => (
                  <div key={spec.label}>
                    <dt className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <spec.icon className="h-3.5 w-3.5 text-primary" />
                      {spec.label}
                    </dt>
                    <dd className="mt-1 text-sm font-bold text-foreground">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

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
                ].map((item) => (
                  <li key={item.label} className="flex items-center gap-3 text-foreground">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                      <item.icon className="h-4 w-4" />
                    </span>
                    {item.label}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </section>

      <VehicleSimulationForm car={car} />

      <section className="mx-auto max-w-7xl px-5 pb-16">
        <h2 className="mb-6 text-2xl font-black uppercase text-foreground md:text-3xl">
          Veja também
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((relatedVehicle) => (
            <Link
              key={relatedVehicle.id}
              to="/veiculo/$carId"
              params={{ carId: relatedVehicle.id }}
              className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/50 hover:shadow-red"
            >
              <div className="aspect-[4/3] overflow-hidden bg-muted">
                <img
                  src={getVehiclePrimaryImage(relatedVehicle)}
                  alt={relatedVehicle.name}
                  width={1024}
                  height={768}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-4">
                <h3 className="text-base font-bold uppercase text-foreground">
                  {relatedVehicle.name}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {relatedVehicle.year} - {formatKm(relatedVehicle.mileage)}
                </p>
                <p className="mt-2 text-xl font-black text-primary">
                  {formatPrice(relatedVehicle.price)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <Footer />
      <FloatingWhatsApp />

      <div className="h-24 lg:hidden" aria-hidden="true" />

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="mb-2 flex items-center justify-between">
          <p className="truncate text-[11px] font-semibold uppercase text-muted-foreground">
            {car.name}
          </p>
          <p className="text-base font-black text-primary">{formatPrice(car.price)}</p>
        </div>
        <a
          href={whatsappLink(whatsappMessage, getVehicleWhatsappNumber(car))}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleWhatsappClick}
          className="animate-pulse-whatsapp flex w-full items-center justify-center gap-2 rounded-full bg-whatsapp py-4 text-sm font-black uppercase tracking-wider text-whatsapp-foreground shadow-card"
        >
          <MessageCircle className="h-5 w-5 fill-current" strokeWidth={0} />
          Chamar no WhatsApp
        </a>
      </div>
    </div>
  );
}

function VehicleSimulationForm({ car }: { car: Vehicle }) {
  const defaultDownPayment = Math.round(car.price * 0.2);
  const [downPayment, setDownPayment] = useState(String(defaultDownPayment));
  const [term, setTerm] = useState(48);
  const [form, setForm] = useState({
    name: "",
    whatsapp: "",
    cpf: "",
    birthDate: "",
    hasDriverLicense: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setDownPayment(String(Math.round(car.price * 0.2)));
    setTerm(48);
    setSuccessMessage("");
    setErrorMessage("");
  }, [car.id, car.price]);

  const parsedDownPayment = Number(downPayment) || 0;
  const clampedDownPayment = Math.min(Math.max(parsedDownPayment, 0), car.price);
  const financedValue = Math.max(car.price - clampedDownPayment, 0);
  const monthlyPayment = calculateMonthlyPayment(financedValue, term);
  const entryPercent = car.price > 0 ? Math.round((clampedDownPayment / car.price) * 100) : 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");

    if (!form.name.trim() || !form.whatsapp.trim()) {
      setErrorMessage("Informe nome completo e WhatsApp para receber a simulacao.");
      return;
    }

    setSubmitting(true);

    try {
      await createPublicLead({
        name: form.name,
        phone: form.whatsapp,
        source: "simulacao_carro_site",
        stage: "novo",
        priority: "high",
        budget: car.price,
        interestVehicleId: car.id,
        interestVehicleName: `${car.name} ${car.year}`,
        tags: ["simulacao", "site", "financiamento"],
        notes: [
          "Solicitacao de simulacao de financiamento pelo site.",
          `Veiculo: ${car.name} ${car.year}`,
          `Preco a vista: ${formatSimulationCurrency(car.price)}`,
          `Entrada informada: ${formatSimulationCurrency(clampedDownPayment)} (${entryPercent}% do valor)`,
          `Valor financiado: ${formatSimulationCurrency(financedValue)}`,
          `Prazo: ${term} meses`,
          `Parcela estimada: ${formatSimulationCurrency(monthlyPayment)}`,
          form.cpf ? `CPF: ${form.cpf}` : "",
          form.birthDate ? `Data de nascimento: ${form.birthDate}` : "",
          form.hasDriverLicense ? `Tem CNH: ${form.hasDriverLicense === "yes" ? "Sim" : "Nao"}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
      });

      setSuccessMessage("Sua simulação será entregue em até 30 minutos.");
      setForm({ name: "", whatsapp: "", cpf: "", birthDate: "", hasDriverLicense: "" });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Nao foi possivel enviar sua simulacao agora.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-5 pb-16">
      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-border bg-card p-5 shadow-card md:p-8"
      >
        <div className="border-b border-white/10 pb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
              Parcela indicativa em {term}x
            </p>
            <p className="mt-1 text-4xl font-black text-primary md:text-5xl">
              {formatSimulationCurrency(monthlyPayment)}
            </p>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              O valor final depende da taxa aprovada na analise de credito.
            </p>
          </div>
        </div>

        <div className="mt-7 space-y-7">
          <div>
            <div className="mb-3 flex items-center justify-between text-sm font-semibold text-muted-foreground">
              <span>Entrada</span>
              <span>{entryPercent}% do valor</span>
            </div>
            <input
              type="range"
              min={0}
              max={car.price}
              step={500}
              value={clampedDownPayment}
              onChange={(event) => setDownPayment(event.target.value)}
              className="simulation-range"
              aria-label="Entrada"
            />
            <div className="mt-4 flex items-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
              <span className="mr-2 text-sm font-semibold text-muted-foreground">R$</span>
              <input
                type="number"
                min={0}
                max={car.price}
                step={500}
                value={downPayment}
                onChange={(event) => setDownPayment(event.target.value)}
                className="w-full bg-transparent text-base font-semibold text-foreground outline-none"
              />
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold text-muted-foreground">Prazo</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {SIMULATION_TERMS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setTerm(option)}
                  className={`rounded-2xl border px-4 py-3 text-sm font-black transition ${
                    term === option
                      ? "border-primary bg-primary text-primary-foreground shadow-red"
                      : "border-border bg-background/35 text-muted-foreground hover:border-primary/45 hover:text-foreground"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Valor financiado</dt>
                <dd className="font-black text-foreground">{formatSimulationCurrency(financedValue)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Prazo</dt>
                <dd className="font-black text-foreground">{term} meses</dd>
              </div>
            </dl>
          </div>

          <div className="border-t border-white/10 pt-7">
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
              Seus dados para contato
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Nome completo"
                className="simulation-input md:col-span-2"
                required
              />
              <input
                value={form.whatsapp}
                onChange={(event) =>
                  setForm((current) => ({ ...current, whatsapp: event.target.value }))
                }
                placeholder="WhatsApp (com DDD)"
                className="simulation-input"
                required
              />
              <input
                value={form.cpf}
                onChange={(event) => setForm((current) => ({ ...current, cpf: event.target.value }))}
                placeholder="CPF"
                className="simulation-input"
              />
              <label className="md:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-muted-foreground">
                  Data de nascimento
                </span>
                <input
                  type="date"
                  value={form.birthDate}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, birthDate: event.target.value }))
                  }
                  className="simulation-input"
                />
              </label>

              <fieldset className="md:col-span-2">
                <legend className="mb-3 text-sm font-semibold text-muted-foreground">
                  Tem CNH?
                </legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { value: "yes", label: "Sim" },
                    { value: "no", label: "Nao" },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={`flex cursor-pointer items-center justify-center rounded-2xl border px-4 py-3 text-sm font-black transition ${
                        form.hasDriverLicense === option.value
                          ? "border-primary bg-primary text-primary-foreground shadow-red"
                          : "border-border bg-background/35 text-muted-foreground hover:border-primary/45 hover:text-foreground"
                      }`}
                    >
                      <input
                        type="radio"
                        name="hasDriverLicense"
                        value={option.value}
                        checked={form.hasDriverLicense === option.value}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            hasDriverLicense: event.target.value,
                          }))
                        }
                        className="sr-only"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
                {form.hasDriverLicense === "yes" && (
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                    Em caso de aprovacao, a financeira podera solicitar uma foto da CNH para
                    validar o cadastro.
                  </p>
                )}
              </fieldset>
            </div>
          </div>

          {successMessage && (
            <div className="rounded-2xl border border-primary/35 bg-primary/10 px-4 py-3 text-sm font-bold text-primary">
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="rounded-2xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 text-sm font-black uppercase tracking-[0.18em] text-primary-foreground shadow-red transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            {submitting ? "Enviando..." : "Solicitar simulação"}
          </button>
        </div>

        <style>{`
          .simulation-input {
            width: 100%;
            border-radius: 1rem;
            border: 1px solid rgba(255, 255, 255, 0.1);
            background: rgba(255, 255, 255, 0.04);
            padding: 0.95rem 1rem;
            color: var(--color-foreground);
            font-size: 0.95rem;
            font-weight: 600;
            outline: none;
            transition: border-color 0.15s, background 0.15s;
          }
          .simulation-input:focus {
            border-color: var(--color-primary);
            background: rgba(255, 255, 255, 0.06);
          }
          .simulation-range {
            width: 100%;
            accent-color: var(--color-primary);
          }
        `}</style>
      </form>
    </section>
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
