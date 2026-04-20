import heroCar from "@/assets/hero-home.jpg";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Sparkles, Repeat } from "lucide-react";
import type { ReactNode } from "react";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <img
          src={heroCar}
          alt=""
          aria-hidden="true"
          width={1920}
          height={1080}
          className="absolute inset-0 h-full w-full object-cover object-[82%_center] opacity-30 blur-[2px] md:opacity-45"
        />

        <div className="absolute inset-0 bg-[linear-gradient(90deg,oklch(0.13_0.008_20)_0%,oklch(0.13_0.008_20/0.92)_42%,oklch(0.13_0.008_20/0.68)_68%,transparent_100%)]" />

        <div className="absolute inset-0 bg-[linear-gradient(180deg,oklch(0.16_0.01_20/0.55)_0%,transparent_28%,transparent_72%,oklch(0.13_0.008_20)_100%)]" />

        <div className="absolute right-[-8%] top-1/2 h-[680px] w-[680px] -translate-y-1/2 rounded-full bg-gradient-red opacity-30 blur-3xl" />

        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(oklch(0.97 0 0) 1px, transparent 1px), linear-gradient(90deg, oklch(0.97 0 0) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
      </div>

      <div className="relative mx-auto flex min-h-[640px] max-w-7xl flex-col items-center justify-center px-5 py-20 text-center md:min-h-[720px] md:py-28 lg:items-start lg:text-left">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="flex max-w-2xl flex-col items-center lg:items-start will-change-transform"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-primary backdrop-blur-sm">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
            Curadoria DM Motors
          </span>

          <h1 className="mt-6 text-5xl font-black uppercase leading-[0.92] tracking-tight text-foreground sm:text-6xl md:text-7xl lg:text-[5.5rem]">
            Seu próximo carro
            <br />
            <span className="bg-gradient-to-r from-primary to-[oklch(0.70_0.26_25)] bg-clip-text text-transparent">
              começa aqui.
            </span>
          </h1>

          <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
            Importados selecionados, procedência garantida e negociação transparente.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <Link
              to="/estoque"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-cta px-8 py-4 text-sm font-bold uppercase tracking-wide text-primary-foreground shadow-red transition hover:brightness-110"
            >
              Ver estoque
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>

            <WhatsAppButton size="lg" label="Chamar no WhatsApp" />
          </div>

          <div className="mt-10 grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
            <TrustItem
              icon={<Sparkles className="h-4 w-4" />}
              label="+500 clientes satisfeitos"
            />
            <TrustItem
              icon={<ShieldCheck className="h-4 w-4" />}
              label="Procedência garantida"
            />
            <TrustItem
              icon={<Repeat className="h-4 w-4" />}
              label="Aceitamos troca"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function TrustItem({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-full border border-border/60 bg-card/50 px-4 py-2.5 text-xs font-semibold text-foreground/90 backdrop-blur-sm lg:justify-start">
      <span className="text-primary">{icon}</span>
      {label}
    </div>
  );
}