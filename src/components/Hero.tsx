import dmLogo from "@/assets/dm-motors-logo.png";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Search } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-hero">
      {/* Glow blobs */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-red opacity-60 blur-3xl" />
      <div className="pointer-events-none absolute left-1/4 top-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute right-1/4 bottom-10 h-52 w-52 rounded-full bg-primary/10 blur-3xl" />

      {/* Subtle grid texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.97 0 0) 1px, transparent 1px), linear-gradient(90deg, oklch(0.97 0 0) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative mx-auto flex max-w-3xl flex-col items-center px-5 pb-16 pt-16 text-center md:pb-24 md:pt-24">
        <motion.img
          src={dmLogo}
          alt="DM Motors Imports"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="h-20 w-auto drop-shadow-[0_0_30px_oklch(0.62_0.24_25/0.55)] sm:h-28 md:h-32"
        />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="relative z-10 flex flex-col items-center"
        >
          <span className="mt-8 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
            Estoque renovado toda semana
          </span>

          <h1 className="mt-5 text-4xl font-black uppercase leading-[0.95] tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Oportunidades <span className="text-stroke">de verdade</span>
            <br />
            <span className="text-primary">todos os dias</span>
          </h1>

          <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
            Carros com procedência, revisados e com preço diferenciado.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/estoque"
              className="inline-flex items-center justify-center rounded-full bg-gradient-cta px-7 py-4 text-sm font-bold uppercase tracking-wide text-primary-foreground shadow-red transition hover:brightness-110"
            >
              Ver estoque
            </Link>
            <WhatsAppButton size="lg" label="📲 Chamar no WhatsApp" />
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              +500 clientes satisfeitos
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Procedência garantida
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Aceitamos troca
            </span>
          </div>
        </motion.div>
      </div>

      {/* Quick filter pills */}
      <div className="relative mx-auto max-w-7xl px-5 pb-10">
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Filtros rápidos:
          </span>
          {[
            { icon: <Search className="h-3.5 w-3.5" />, label: "Até R$ 50 mil" },
            { label: "Até R$ 80 mil" },
            { label: "SUV" },
            { label: "Automático" },
            { label: "Baixa KM" },
            { label: "0 km a 5 anos" },
          ].map((f, i) => (
            <button
              key={i}
              className="flex shrink-0 items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground transition hover:border-primary hover:bg-primary/10 hover:text-primary"
            >
              {f.icon}
              {f.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
