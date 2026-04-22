import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Clock, MapPin } from "lucide-react";

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-card py-20 md:py-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-red opacity-12 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative mx-auto grid max-w-7xl gap-5 px-5 lg:grid-cols-[1.02fr_0.98fr]"
      >
        <div className="rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,oklch(0.14_0.01_20)_0%,oklch(0.10_0.008_20)_100%)] p-8 md:p-10">
          <span className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
            Atendimento direto
          </span>

          <h2 className="mt-4 max-w-[14ch] text-[2.2rem] font-black uppercase leading-[0.95] text-foreground md:text-[3.1rem]">
            Gostou de algum modelo?
            <br />
            Fale com a DM Motors.
          </h2>

          <p className="mt-5 max-w-[38rem] text-[15px] leading-[1.72] text-muted-foreground sm:text-base">
            Tire dúvidas, simule financiamento, envie seu usado para avaliação e receba um
            atendimento direto para fechar com mais agilidade.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <WhatsAppButton size="lg" label="Chamar no WhatsApp agora" />
            <Link
              to="/estoque"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background px-6 py-4 text-sm font-black uppercase tracking-[0.16em] text-foreground transition hover:border-primary hover:text-primary"
            >
              Ver estoque completo
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
          <div className="rounded-[30px] border border-white/8 bg-background p-7">
            <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-foreground">
              <MapPin className="h-4 w-4 text-primary" />
              Endereço da loja
            </p>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Estrada Pádua x Pirapetinga, KM 1
              <br />
              Santa Afra
              <br />
              Santo Antônio de Pádua - RJ
            </p>
          </div>

          <div className="rounded-[30px] border border-white/8 bg-background p-7">
            <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-foreground">
              <Clock className="h-4 w-4 text-primary" />
              Horário de atendimento
            </p>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Seg a Sex · 8h às 18h
              <br />
              Sáb · 8h às 12h
              <br />
              Dom · Fechado / Agendamentos
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
