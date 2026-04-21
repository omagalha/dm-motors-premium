import { motion } from "framer-motion";
import { Search, MessageCircle, Key } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Search,
    title: "Escolha seu carro",
    desc: "Navegue pelo estoque, filtre por modelo, preço ou categoria e encontre o ideal para você.",
  },
  {
    number: "02",
    icon: MessageCircle,
    title: "Chama no Zap",
    desc: "Fale direto com nosso time. Sem robô, sem espera. Tiramos todas as dúvidas na hora.",
  },
  {
    number: "03",
    icon: Key,
    title: "Leve hoje",
    desc: "Documentação rápida e financiamento aprovado na hora. Seu carro sai na mesma visita.",
  },
];

function StepPlate({ number }: { number: string }) {
  return (
    <div className="inline-flex flex-col overflow-hidden rounded-[3px] border border-white/15 shadow-card">
      <div className="bg-[#002868] px-3 py-[2px] text-center text-[6px] font-black tracking-[0.5em] text-yellow-300">
        ★ BR ★
      </div>
      <div className="bg-primary px-5 py-1.5">
        <span className="font-display text-2xl font-black tracking-[0.15em] text-white leading-none">
          {number}
        </span>
      </div>
    </div>
  );
}

export function HowItWorks() {
  return (
    <section className="bg-background py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-14 text-center"
        >
          <span className="inline-flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-primary">
            <span className="inline-block h-px w-10 bg-primary" />
            Como funciona
            <span className="inline-block h-px w-10 bg-primary" />
          </span>
          <h2 className="mt-3 text-4xl font-black uppercase text-foreground md:text-5xl">
            3 passos para
            <br />
            <span className="text-primary">o seu próximo carro</span>
          </h2>
        </motion.div>

        <div className="relative grid grid-cols-1 gap-6 md:grid-cols-3">
          <div
            aria-hidden="true"
            className="absolute left-[calc(16.67%+32px)] right-[calc(16.67%+32px)] top-[22px] hidden h-px bg-gradient-to-r from-primary/50 via-primary/20 to-primary/50 md:block"
          />

          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.13 }}
              className="group"
            >
              <div className="mb-5 flex items-center gap-4 md:justify-center">
                <StepPlate number={step.number} />
                {i < 2 && (
                  <div className="h-px flex-1 bg-border md:hidden" />
                )}
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 transition-colors group-hover:border-primary/40 md:text-center">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary transition group-hover:bg-primary group-hover:text-white">
                  <step.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-black uppercase tracking-tight text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
