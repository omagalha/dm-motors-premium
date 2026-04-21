import heroCar from "@/assets/hero-home.jpg";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Sparkles, Repeat } from "lucide-react";
import type { ReactNode } from "react";

interface HeroProps {
  activeCarCount?: number;
}

function DealerPlateBadge() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="inline-flex flex-col overflow-hidden rounded-[3px] border border-white/20 shadow-[0_4px_32px_oklch(0.62_0.24_25/0.5)]"
    >
      <div className="bg-[#002868] px-7 py-[3px] text-center text-[7px] font-black tracking-[0.6em] text-yellow-300">
        ★ BRASIL ★
      </div>
      <div className="bg-primary px-7 py-1.5">
        <span className="block text-center font-display text-[15px] font-black tracking-[0.3em] text-white uppercase leading-none">
          DM · MOTORS
        </span>
      </div>
      <div className="bg-[oklch(0.10_0.006_20)] px-7 py-[3px] text-center text-[7px] font-bold tracking-[0.4em] text-white/45 uppercase">
        Revendedor · Imports
      </div>
    </motion.div>
  );
}

function InventoryCard({ count }: { count?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
      className="hidden xl:block absolute right-14 top-1/2 -translate-y-1/2 z-10"
    >
      <div className="relative w-60 rounded-2xl border border-white/10 bg-background/75 p-6 backdrop-blur-xl shadow-[0_24px_64px_oklch(0_0_0/0.7)]">
        <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
        <div className="absolute left-0 top-0 h-full w-[3px] rounded-l-2xl bg-primary" />

        <div className="mb-5 inline-flex flex-col overflow-hidden rounded-[3px] border border-white/15 shadow-red">
          <div className="bg-[#002868] px-3 py-[2px] text-center text-[6px] font-black tracking-[0.5em] text-yellow-300">
            ★ BR ★
          </div>
          <div className="bg-primary px-4 py-[5px]">
            <span className="font-display text-[13px] font-black tracking-[0.25em] text-white uppercase">
              DM·MOTORS
            </span>
          </div>
          <div className="bg-[oklch(0.10_0.006_20)] px-3 py-[2px] text-center text-[6px] font-bold tracking-[0.3em] text-white/40 uppercase">
            IMPORTS
          </div>
        </div>

        <div className="flex items-end gap-2">
          <span className="text-5xl font-black tabular-nums text-foreground leading-none">
            {count ?? "–"}
          </span>
          <div className="mb-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground leading-tight">
              carros
            </p>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground leading-tight">
              disponíveis
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
          </span>
          <span className="text-[11px] font-semibold text-green-400">
            Estoque atualizado
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export function Hero({ activeCarCount }: HeroProps) {
  return (
    <section className="relative isolate overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <img
          src={heroCar}
          alt=""
          aria-hidden="true"
          width={1920}
          height={1080}
          className="absolute inset-0 h-full w-full object-cover object-[82%_center] opacity-30 md:opacity-45"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,oklch(0.13_0.008_20)_0%,oklch(0.13_0.008_20/0.96)_40%,oklch(0.13_0.008_20/0.72)_66%,transparent_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,oklch(0.16_0.01_20/0.55)_0%,transparent_26%,transparent_74%,oklch(0.13_0.008_20)_100%)]" />
        <div className="absolute right-[-5%] top-1/2 h-[700px] w-[700px] -translate-y-1/2 rounded-full bg-gradient-red opacity-[0.22] blur-3xl" />
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(oklch(0.97 0 0) 1px, transparent 1px), linear-gradient(90deg, oklch(0.97 0 0) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative mx-auto flex min-h-[700px] max-w-7xl flex-col items-center justify-center px-5 py-24 text-center md:min-h-[780px] md:py-32 lg:items-start lg:text-left">
        <InventoryCard count={activeCarCount} />

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
          className="flex max-w-2xl flex-col items-center lg:items-start will-change-transform"
        >
          <DealerPlateBadge />

          <h1 className="mt-8 text-5xl font-black uppercase leading-[0.88] tracking-tight text-foreground sm:text-6xl md:text-7xl lg:text-[5.5rem]">
            Seu próximo
            <br />
            carro está
            <br />
            <span className="bg-gradient-to-r from-primary to-[oklch(0.70_0.26_25)] bg-clip-text text-transparent">
              aqui.
            </span>
          </h1>

          <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
            Importados selecionados, procedência garantida e negociação
            direta — sem robô, sem enrolação.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <Link
              to="/estoque"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-cta px-8 py-4 text-sm font-bold uppercase tracking-wide text-primary-foreground shadow-red transition hover:brightness-110 active:scale-95"
            >
              Ver estoque completo
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <WhatsAppButton size="lg" label="Chamar no WhatsApp" />
          </div>

          <div className="mt-10 grid w-full max-w-xl grid-cols-1 gap-2 sm:grid-cols-3">
            <TrustItem
              icon={<Sparkles className="h-3.5 w-3.5" />}
              label="+500 clientes satisfeitos"
            />
            <TrustItem
              icon={<ShieldCheck className="h-3.5 w-3.5" />}
              label="Procedência garantida"
            />
            <TrustItem
              icon={<Repeat className="h-3.5 w-3.5" />}
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
    <div className="flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-semibold text-foreground/80 backdrop-blur-sm lg:justify-start">
      <span className="text-primary">{icon}</span>
      {label}
    </div>
  );
}
