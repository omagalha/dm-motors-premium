import { ShieldCheck, Wrench, Banknote, RefreshCw, Star, Users, Trophy } from "lucide-react";
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
    <section className="bg-card py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-5">

        {/* Stats strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16 grid grid-cols-1 divide-y divide-border overflow-hidden rounded-2xl border border-border sm:grid-cols-3 sm:divide-x sm:divide-y-0"
        >
          {[
            { icon: Users, value: "+500", label: "Clientes satisfeitos", gold: false },
            { icon: Trophy, value: "+800", label: "Veículos vendidos", gold: false },
            { icon: Star,  value: "4,9",  label: "Avaliação no Google",  gold: true },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-4 bg-card p-6 md:p-8">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                  stat.gold ? "bg-amber-500/15 text-amber-400" : "bg-primary/15 text-primary"
                }`}
              >
                <stat.icon className={`h-5 w-5 ${stat.gold ? "fill-current" : ""}`} />
              </div>
              <div>
                <p className="text-2xl font-black tabular-nums text-foreground md:text-3xl">
                  {stat.value}
                </p>
                <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Header */}
        <div className="mb-10 text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">
            Por que comprar com a gente
          </span>
          <h2 className="mt-2 text-4xl font-black uppercase text-foreground md:text-5xl">
            Por que escolher a <span className="text-primary">DM Motors</span>?
          </h2>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="group rounded-2xl border border-border bg-background p-6 transition hover:border-primary/40"
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold uppercase tracking-tight text-foreground">
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
