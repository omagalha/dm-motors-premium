import heroCar from "@/assets/hero-home.jpg";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";

interface HeroProps {
  activeCarCount?: number;
}

function DealerPlateBadge() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="inline-flex flex-col overflow-hidden rounded-[3px] border border-white/20 shadow-card"
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
          className="absolute inset-0 h-full w-full object-cover object-[82%_center] opacity-35 md:opacity-50"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,oklch(0.13_0.008_20)_0%,oklch(0.13_0.008_20/0.96)_42%,oklch(0.13_0.008_20/0.70)_68%,transparent_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,oklch(0.13_0.008_20/0.4)_0%,transparent_20%,transparent_80%,oklch(0.13_0.008_20)_100%)]" />
      </div>

      <div className="relative mx-auto flex min-h-[620px] max-w-7xl flex-col items-center justify-center px-5 py-20 text-center md:min-h-[700px] md:py-28 lg:items-start lg:text-left">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex max-w-2xl flex-col items-center lg:items-start will-change-transform"
        >
          <DealerPlateBadge />

          <h1 className="mt-7 text-5xl font-black uppercase leading-[0.9] tracking-tight text-foreground sm:text-6xl md:text-7xl lg:text-[5.5rem]">
            Seu próximo carro
            <br />
            <span className="bg-gradient-to-r from-primary to-[oklch(0.70_0.26_25)] bg-clip-text text-transparent">
              começa aqui.
            </span>
          </h1>

          <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
            Importados e nacionais selecionados com procedência garantida.
            Financiamento em todos os bancos, troca na hora.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <Link
              to="/estoque"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-cta px-8 py-4 text-sm font-bold uppercase tracking-wide text-primary-foreground shadow-red transition hover:brightness-110 active:scale-95"
            >
              Ver estoque completo
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <WhatsAppButton size="lg" label="Chamar no WhatsApp" />
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            {activeCarCount != null && activeCarCount > 0 && (
              <TrustItem label={`${activeCarCount} veículos disponíveis`} />
            )}
            <TrustItem icon={<ShieldCheck className="h-3.5 w-3.5" />} label="Procedência garantida" />
            <TrustItem icon={<RefreshCw className="h-3.5 w-3.5" />} label="Aceitamos troca" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function TrustItem({ icon, label }: { icon?: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
      {icon && <span className="text-primary">{icon}</span>}
      {label}
    </div>
  );
}
