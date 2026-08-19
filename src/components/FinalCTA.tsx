import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export function FinalCTA() {
  return (
    <section className="relative flex min-h-[82vh] items-center justify-center overflow-hidden border-b border-white/[0.06] bg-[#030303] px-5 py-20 text-center lg:px-10">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02)_0%,transparent_36%,rgba(84,15,18,0.16)_100%)]" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative mx-auto max-w-5xl"
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-primary">
          Atendimento direto
        </p>

        <h2 className="mt-5 font-display text-6xl font-black uppercase leading-[0.86] text-white md:text-8xl">
          Pronto para
          <br />
          <span className="text-primary">negociar?</span>
        </h2>

        <p className="mx-auto mt-6 max-w-2xl text-sm leading-[1.9] text-white/38 md:text-base">
          Fale com a equipe, tire dúvidas, envie seu usado para avaliação ou agende
          uma visita ao showroom da DM Motors.
        </p>

        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <WhatsAppButton size="lg" label="Chamar no WhatsApp agora" />
          <Link
            to="/estoque"
            className="inline-flex items-center justify-center gap-2 border border-white/12 px-7 py-4 text-sm font-black uppercase tracking-[0.16em] text-white/74 transition hover:border-primary hover:text-white"
          >
            Ver estoque
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <p className="mt-6 text-xs text-white/20">
          (32) 99926-4848 / Seg-Sex 8h-18h / Sáb 8h-12h
        </p>
      </motion.div>
    </section>
  );
}
