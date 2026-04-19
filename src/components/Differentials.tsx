import { ShieldCheck, Wrench, Banknote, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

const items = [
  {
    icon: ShieldCheck,
    title: "Procedência garantida",
    desc: "Todos os veículos checados em laudo cautelar e histórico limpo.",
  },
  {
    icon: Wrench,
    title: "Veículos revisados",
    desc: "Cada carro passa por revisão completa antes de ir para a loja.",
  },
  {
    icon: Banknote,
    title: "Financiamento fácil",
    desc: "Aprovação rápida nos principais bancos, parcelas que cabem no bolso.",
  },
  {
    icon: RefreshCw,
    title: "Aceitamos troca",
    desc: "Avaliação justa do seu carro na hora, sem burocracia.",
  },
];

export function Differentials() {
  return (
    <section className="relative overflow-hidden bg-card py-16 md:py-24">
      <div className="pointer-events-none absolute -left-20 top-0 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-5">
        <div className="mb-12 text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">
            Por que comprar com a gente
          </span>
          <h2 className="mt-2 text-4xl font-black uppercase text-foreground md:text-5xl">
            Por que escolher a <span className="text-primary">DM Motors</span>?
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group relative overflow-hidden rounded-2xl border border-border bg-background p-6 transition hover:border-primary/50"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                <item.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold uppercase tracking-tight text-foreground">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
