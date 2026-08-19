import { motion } from "framer-motion";
import { Key, MessageCircle, Search } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Search,
    title: "Escolha seu carro",
    desc: "Navegue pelo estoque com fotos, preço e informações essenciais para comparar com calma.",
  },
  {
    number: "02",
    icon: MessageCircle,
    title: "Fale no WhatsApp",
    desc: "Tire dúvidas, negocie, avalie troca e simule financiamento com atendimento direto.",
  },
  {
    number: "03",
    icon: Key,
    title: "Retire com segurança",
    desc: "Documentação orientada pela equipe e entrega preparada para sair dirigindo.",
  },
];

export function HowItWorks() {
  return (
    <section className="border-b border-white/[0.06] bg-[#0d0d0d] px-5 py-20 lg:px-10">
      <div className="mx-auto max-w-[1400px]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="mb-10"
        >
          <p className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.32em] text-primary">
            <span className="h-px w-8 bg-primary" />
            Como funciona
          </p>
          <h2 className="mt-4 font-display text-5xl font-black uppercase leading-[0.88] text-white md:text-7xl">
            Do interesse
            <br />
            <span className="text-primary">à entrega</span>
          </h2>
        </motion.div>

        <div className="grid gap-0.5 md:grid-cols-3">
          {steps.map((step, index) => (
            <motion.article
              key={step.number}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="relative overflow-hidden bg-card p-8 md:p-10"
            >
              <div className="pointer-events-none absolute -right-1 top-0 font-display text-[8rem] leading-none text-white/[0.025]">
                {step.number}
              </div>
              <p className="font-display text-xs tracking-[0.36em] text-primary">
                {step.number}
              </p>
              <div className="mt-8 flex h-11 w-11 items-center justify-center border border-white/10 text-primary">
                <step.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-7 text-lg font-bold uppercase tracking-[0.08em] text-white">
                {step.title}
              </h3>
              <p className="mt-4 text-sm leading-[1.8] text-white/44">{step.desc}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
