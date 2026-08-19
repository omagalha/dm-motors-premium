import { Banknote, Building2, MessageCircle, RefreshCw, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import heroCar from "@/assets/hero-car.jpg";

const commitments = [
  ["01", "Seleção rigorosa", "Inspeção criteriosa antes de cada veículo entrar no estoque."],
  ["02", "Procedência garantida", "Histórico, documentação e apresentação tratados com transparência."],
  ["03", "Atendimento direto", "Você fala com quem entende do carro e pode conduzir a negociação."],
  ["04", "Financiamento ágil", "Simulação com múltiplos bancos para buscar uma condição viável."],
];

const pillars = [
  {
    icon: ShieldCheck,
    title: "Procedência validada",
    desc: "Histórico e documentação conferidos antes do anúncio.",
  },
  {
    icon: MessageCircle,
    title: "Negociação consultiva",
    desc: "Atendimento pelo WhatsApp com informação clara e retorno rápido.",
  },
  {
    icon: RefreshCw,
    title: "Troca facilitada",
    desc: "Avaliação do seu usado para compor uma proposta objetiva.",
  },
  {
    icon: Banknote,
    title: "Crédito assistido",
    desc: "Financiamento conduzido com bancos parceiros e acompanhamento da equipe.",
  },
];

export function Differentials() {
  return (
    <section className="grid min-h-[720px] border-b border-white/[0.06] bg-background lg:grid-cols-2">
      <div className="relative min-h-[420px] overflow-hidden lg:min-h-full">
        <img
          src={heroCar}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover opacity-64"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.12)_0%,rgba(0,0,0,0.74)_100%)]" />
        <div className="absolute bottom-8 left-5 right-5 lg:left-10 lg:right-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-primary">
            DM Motors Imports
          </p>
          <p className="mt-3 max-w-lg text-2xl font-semibold leading-tight text-white md:text-4xl">
            Uma compra premium começa antes da visita ao showroom.
          </p>
        </div>
      </div>

      <div className="flex items-center px-5 py-16 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="w-full"
        >
          <p className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.32em] text-primary">
            <Building2 className="h-4 w-4" />
            Sobre a experiência
          </p>
          <h2 className="mt-5 font-display text-5xl font-black uppercase leading-[0.9] text-white md:text-7xl">
            Confiança
            <br />
            <span className="text-primary">sem ruído</span>
          </h2>
          <p className="mt-6 max-w-xl text-sm leading-[1.9] text-white/46 md:text-base">
            A proposta é simples: apresentar veículos bem selecionados, com informação
            honesta, atendimento próximo e negociação conduzida com clareza até a entrega.
          </p>

          <div className="mt-8 grid gap-0.5 sm:grid-cols-2">
            {commitments.map(([number, title, desc]) => (
              <div key={number} className="bg-card p-6">
                <p className="font-display text-xs tracking-[0.36em] text-primary">{number}</p>
                <h3 className="mt-4 text-sm font-bold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-[1.7] text-white/42">{desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <WhatsAppButton label="Falar com a equipe" />
            {pillars.slice(0, 2).map((pillar) => (
              <div
                key={pillar.title}
                className="flex items-center gap-2 border border-white/10 px-3 py-2 text-xs font-semibold text-white/54"
              >
                <pillar.icon className="h-4 w-4 text-primary" />
                {pillar.title}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
