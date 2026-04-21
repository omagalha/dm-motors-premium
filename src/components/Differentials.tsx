import {
  Banknote,
  Building2,
  Clock3,
  RefreshCw,
  ShieldCheck,
  Star,
  Trophy,
  Users,
  Wrench,
} from "lucide-react";
import { motion } from "framer-motion";

const items = [
  {
    icon: ShieldCheck,
    title: "Procedencia garantida",
    desc: "Todos os veiculos passam por checagem de historico e apresentacao antes de entrar na vitrine.",
  },
  {
    icon: Wrench,
    title: "Revisao antes da entrega",
    desc: "Cada carro vai para a loja com padrao visual e mecanico mais alinhado ao perfil premium.",
  },
  {
    icon: Banknote,
    title: "Credito com agilidade",
    desc: "Financiamento com varios bancos para acelerar analise e melhorar as condicoes.",
  },
  {
    icon: RefreshCw,
    title: "Troca facilitada",
    desc: "Seu carro atual entra na conversa com avaliacao justa e menos atrito na negociacao.",
  },
];

const commitments = [
  "Loja fisica para ver, comparar e decidir com mais seguranca.",
  "Atendimento consultivo sem cara de pagina generica.",
  "Fotos fortes, preco claro e contato rapido no mesmo bloco.",
  "Padrao visual mais proximo de showroom premium como na referencia.",
];

const stats = [
  { icon: Users, value: "+500", label: "clientes atendidos" },
  { icon: Trophy, value: "+800", label: "veiculos vendidos" },
  { icon: Star, value: "4.9", label: "avaliacao Google" },
  { icon: Clock3, value: "7 dias", label: "de atendimento" },
];

export function Differentials() {
  return (
    <section className="relative overflow-hidden bg-background py-18 md:py-24">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-56 w-[48rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,oklch(0.62_0.24_25/0.14),transparent_68%)] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5">
        <div className="mb-10 grid gap-5 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] text-primary">
              <Building2 className="h-4 w-4" />
              Confianca antes da visita
            </span>
            <h2 className="mt-3 text-4xl font-black uppercase leading-[0.92] text-foreground md:text-5xl">
              Uma experiencia mais proxima de showroom.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">
              O que aproxima seu site da referencia nao e copiar layout. E passar peso de
              marca, clareza comercial e seguranca logo nas primeiras secoes. Esta parte da
              home foi puxada exatamente nessa direcao.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: index * 0.05 }}
                className="rounded-[26px] border border-white/8 bg-card px-5 py-5"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                    <stat.icon className={`h-5 w-5 ${stat.icon === Star ? "fill-current" : ""}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-black uppercase text-foreground">{stat.value}</p>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      {stat.label}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.02fr_0.98fr]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className="rounded-[32px] border border-white/8 bg-[linear-gradient(180deg,oklch(0.18_0.01_20)_0%,oklch(0.12_0.008_20)_100%)] p-7 md:p-9"
          >
            <span className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
              Padrao DM Motors
            </span>
            <h3 className="mt-3 text-3xl font-black uppercase leading-[0.94] text-foreground md:text-4xl">
              Menos cara de landing page.
              <br />
              Mais cara de loja desejada.
            </h3>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
              A home agora sustenta melhor a percepcao de marca: hero mais forte, vitrine mais
              autoritaria e argumentos comerciais melhor distribuidos ao longo da navegacao.
            </p>

            <div className="mt-7 grid gap-3">
              {commitments.map((commitment) => (
                <div
                  key={commitment}
                  className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white/78"
                >
                  {commitment}
                </div>
              ))}
            </div>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: index * 0.06 }}
                className="group rounded-[28px] border border-border bg-card p-6 transition hover:border-primary/35"
              >
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/14 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold uppercase tracking-[0.08em] text-foreground">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
