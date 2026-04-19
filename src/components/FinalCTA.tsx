import { WhatsAppButton } from "@/components/WhatsAppButton";
import { motion } from "framer-motion";

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-background py-20 md:py-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-red opacity-30 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="relative mx-auto max-w-3xl px-5 text-center"
      >
        <span className="text-xs font-bold uppercase tracking-widest text-primary">
          Atendimento agora
        </span>
        <h2 className="mt-3 text-4xl font-black uppercase leading-tight text-foreground md:text-6xl">
          Achou o carro?<br />
          <span className="text-primary">Chama no Zap</span> que a gente fecha hoje.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground">
          Resposta rápida, condições especiais e atendimento humanizado direto com o vendedor.
          Nada de robô.
        </p>

        <div className="mt-8 flex justify-center">
          <WhatsAppButton size="lg" label="Falar com a DM Motors agora" />
        </div>

        <p className="mt-5 text-xs text-muted-foreground">
          📍 Atendimento em horário comercial · Seg a Sáb
        </p>
      </motion.div>
    </section>
  );
}
