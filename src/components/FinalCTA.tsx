import { WhatsAppButton } from "@/components/WhatsAppButton";
import { motion } from "framer-motion";

function DecorativePlate() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
      <div className="rotate-[-6deg] scale-[5] opacity-[0.04]">
        <div className="inline-flex flex-col overflow-hidden rounded-[3px] border-2 border-white">
          <div className="bg-[#002868] px-8 py-1 text-center text-[4px] font-black tracking-[0.5em] text-yellow-300">
            ★ BRASIL ★
          </div>
          <div className="bg-primary px-8 py-2">
            <span className="font-display text-[10px] font-black tracking-[0.3em] text-white uppercase">
              DM · MOTORS
            </span>
          </div>
          <div className="bg-black px-8 py-1 text-center text-[4px] font-bold tracking-[0.4em] text-white/60 uppercase">
            Revendedor · Imports
          </div>
        </div>
      </div>
    </div>
  );
}

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-card py-20 md:py-28">
      <DecorativePlate />

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-red opacity-20 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="relative mx-auto max-w-3xl px-5 text-center"
      >
        {/* Mini plate badge */}
        <div className="mb-6 inline-flex flex-col overflow-hidden rounded-[3px] border border-white/20 shadow-[0_4px_20px_oklch(0.62_0.24_25/0.4)]">
          <div className="bg-[#002868] px-5 py-[3px] text-center text-[7px] font-black tracking-[0.6em] text-yellow-300">
            ★ BRASIL ★
          </div>
          <div className="bg-primary px-5 py-1.5">
            <span className="font-display text-[13px] font-black tracking-[0.25em] text-white uppercase leading-none">
              DM · MOTORS
            </span>
          </div>
          <div className="bg-[oklch(0.10_0.006_20)] px-5 py-[3px] text-center text-[7px] font-bold tracking-[0.35em] text-white/45 uppercase">
            Atendimento Agora
          </div>
        </div>

        <h2 className="text-4xl font-black uppercase leading-tight text-foreground md:text-6xl">
          Achou o carro?
          <br />
          <span className="text-primary">Chama no Zap</span> que a gente fecha hoje.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground">
          Resposta rápida, condições especiais e atendimento humanizado direto
          com o vendedor. Nada de robô.
        </p>

        <div className="mt-8 flex justify-center">
          <WhatsAppButton size="lg" label="📲 Chamar no WhatsApp agora" />
        </div>

        <p className="mt-5 text-xs text-muted-foreground">
          📍 Atendimento em horário comercial · Seg a Sáb
        </p>
      </motion.div>
    </section>
  );
}
