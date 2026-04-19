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
    <section className="relative overflow-hidden bg-card py-16 md:py-24">
      <div className="pointer-events-none absolute -left-20 top-0 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-5">
        {/* Social proof strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12 grid grid-cols-1 gap-4 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-6 sm:grid-cols-3 md:p-8"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-black tabular-nums text-foreground md:text-3xl">+500</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Clientes satisfeitos
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-black tabular-nums text-foreground md:text-3xl">+800</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Veículos vendidos
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
              <Star className="h-6 w-6 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-1 text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
                <span className="ml-1 text-lg font-black text-foreground">4,9</span>
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Avaliação dos clientes
              </p>
            </div>
          </div>
        </motion.div>

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
