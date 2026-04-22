import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Clock, MapPin } from "lucide-react";

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,rgba(15,13,13,1)_0%,rgba(27,18,18,1)_100%)] py-20 md:py-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-red opacity-12 blur-3xl" />
        <div className="absolute right-0 top-12 h-52 w-52 rounded-full bg-whatsapp/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative mx-auto grid max-w-7xl gap-5 px-5 lg:grid-cols-[1.02fr_0.98fr]"
      >
        <div className="rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(14,12,12,0.94)_0%,rgba(9,8,8,0.98)_100%)] p-8 shadow-[0_30px_90px_-45px_rgba(0,0,0,0.9)] md:p-10">
          <span className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
            Atendimento direto
          </span>

          <h2 className="mt-4 max-w-[14ch] text-[2.2rem] font-black uppercase leading-[0.95] text-foreground md:text-[3.1rem]">
            Bora tirar essa ideia
            <br />
            do papel?
          </h2>

          <p className="mt-5 max-w-[38rem] text-[15px] leading-[1.72] text-muted-foreground sm:text-base">
            Se algum modelo fez sentido, a gente avanca rapido: tira duvidas, fala de
            financiamento, avalia troca e organiza a proxima etapa sem enrolacao.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white/72">
              Atendimento humano
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white/72">
              Resposta rapida
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white/72">
              Negociacao clara
            </span>
          </div>

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
          <div className="rounded-[30px] border border-white/8 bg-background/80 p-7 backdrop-blur-sm">
            <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-foreground">
              <MapPin className="h-4 w-4 text-primary" />
              Endereco da loja
            </p>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Estrada Padua x Pirapetinga, KM 1
              <br />
              Santa Afra
              <br />
              Santo Antonio de Padua - RJ
            </p>
          </div>

          <div className="rounded-[30px] border border-white/8 bg-background/80 p-7 backdrop-blur-sm">
            <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-foreground">
              <Clock className="h-4 w-4 text-primary" />
              Horario de atendimento
            </p>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Seg a Sex - 8h as 18h
              <br />
              Sab - 8h as 12h
              <br />
              Dom - Fechado / Agendamentos
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
