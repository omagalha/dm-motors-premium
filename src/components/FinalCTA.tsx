import { WhatsAppButton } from "@/components/WhatsAppButton";
import { motion } from "framer-motion";
import { MapPin, Clock } from "lucide-react";

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-background py-20 md:py-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-red opacity-15 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative mx-auto max-w-2xl px-5 text-center"
      >
        <span className="text-xs font-bold uppercase tracking-widest text-primary">
          Atendimento direto
        </span>

        <h2 className="mt-3 text-4xl font-black uppercase leading-tight text-foreground md:text-5xl">
          Achou o carro?
          <br />
          <span className="text-primary">Chama no WhatsApp</span>
          <br />
          e a gente fecha hoje.
        </h2>

        <p className="mx-auto mt-4 max-w-md text-base text-muted-foreground">
          Resposta rápida, condições especiais e atendimento direto com o vendedor.
        </p>

        <div className="mt-8 flex justify-center">
          <WhatsAppButton size="lg" label="Chamar no WhatsApp agora" />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-primary" />
            Seg–Sex 8h–19h · Sáb 8h–17h · Dom 9h–13h
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            Santo Antônio de Pádua — RJ
          </span>
        </div>
      </motion.div>
    </section>
  );
}
