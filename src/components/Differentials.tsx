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
    <section className="relative overflow-hidden bg-background py-16 md:py-24">
      <div className="relative mx-auto max-w-7xl px-5">
        {/* Social proof strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16 grid grid-cols-1 gap-0 overflow-hidden rounded-2xl border border-primary/25 sm:grid-cols-3"
        >
          {[
            { icon: Users, value: "+500", label: "Clientes satisfeitos" },
            { icon: Trophy, value: "+800", label: "Veículos vendidos" },
            { icon: Star, value: "4,9", label: "Avaliação dos clientes", gold: true },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className={`flex items-center gap-4 bg-gradient-to-br from-primary/10 via-card to-card p-6 md:p-8 ${
                i < 2 ? "border-b border-primary/15 sm:border-b-0 sm:border-r" : ""
              }`}
            >
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                  stat.gold ? "bg-amber-500/20 text-amber-400" : "bg-primary/20 text-primary"
                }`}
              >
                <stat.icon className={`h-6 w-6 ${stat.gold ? "fill-current" : ""}`} />
              </div>
              <div>
                <p className="text-2xl font-black tabular-nums text-foreground md:text-3xl">
                  {stat.value}
                </p>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </motion.div>

        <div className="mb-12 text-center">
          <span className="inline-flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-primary">
            <span className="inline-block h-px w-10 bg-primary" />
            Por que comprar com a gente
            <span className="inline-block h-px w-10 bg-primary" />
          </span>
          <h2 className="mt-3 text-4xl font-black uppercase text-foreground md:text-5xl">
            Por que escolher a{" "}
            <span className="text-primary">DM Motors</span>?
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
              className="group relative overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/50"
            >
              <div className="h-[3px] w-full bg-gradient-to-r from-primary/0 via-primary/0 to-primary/0 transition-all duration-300 group-hover:from-primary group-hover:via-primary/80 group-hover:to-primary" />
              <div className="p-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold uppercase tracking-tight text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
