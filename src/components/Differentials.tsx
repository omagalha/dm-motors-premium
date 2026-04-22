import {
  Banknote,
  Building2,
  Clock3,
  MessagesSquare,
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
    title: "Procedencia validada",
    desc: "Historico, apresentacao e criterio comercial antes de cada carro entrar na vitrine.",
  },
  {
    icon: Wrench,
    title: "Entrega preparada",
    desc: "A compra segue com mais cuidado na reta final, para voce receber o carro com mais confianca.",
  },
  {
    icon: Banknote,
    title: "Credito agil",
    desc: "Analise com mais de um banco para buscar condicoes mais alinhadas ao seu momento.",
  },
  {
    icon: RefreshCw,
    title: "Troca simplificada",
    desc: "Seu usado entra na conversa com avaliacao clara, contexto real e negociacao objetiva.",
  },
];

const process = [
  {
    title: "Atendimento direto",
    description: "Voce fala com a loja sem ruido, com resposta rapida e conversa objetiva.",
  },
  {
    title: "Escolha com contexto",
    description: "Ficha tecnica, fotos fortes e apoio comercial para comparar com mais seguranca.",
  },
  {
    title: "Negociacao clara",
    description: "Financiamento, troca e condicoes entram na mesa de forma simples e transparente.",
  },
  {
    title: "Entrega sem surpresa",
    description: "A reta final segue com revisao e alinhamento para a experiencia continuar boa.",
  },
];

const stats = [
  { icon: Users, value: "+500", label: "clientes atendidos" },
  { icon: Trophy, value: "+800", label: "veiculos vendidos" },
  { icon: Star, value: "4.9", label: "avaliacao Google" },
  { icon: Clock3, value: "Seg-Sab", label: "rotina de loja" },
];

export function Differentials() {
  return (
    <section className="relative overflow-hidden bg-background py-18 md:py-24">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-56 w-[48rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,oklch(0.62_0.24_25/0.14),transparent_68%)] blur-3xl" />
        <div className="absolute right-0 top-16 h-48 w-48 rounded-full bg-whatsapp/8 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5">
        <div className="mb-10 flex flex-col gap-4 lg:max-w-3xl">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] text-primary">
            <Building2 className="h-4 w-4" />
            O jeito DM Motors
          </span>
          <h2 className="text-[2.2rem] font-black uppercase leading-[0.95] text-foreground md:text-[3.2rem]">
            Um showroom para facilitar
            <br className="hidden md:block" />
            a decisao de ponta a ponta.
          </h2>
          <p className="max-w-[44rem] text-sm leading-[1.75] text-muted-foreground md:text-base">
            A nova home precisava vender mais confianca, nao so mais carros. Por isso esta
            secao puxa a sensacao de atendimento premium, clareza comercial e operacao bem
            resolvida.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.04fr_0.96fr]">
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className="rounded-[34px] border border-white/8 bg-[linear-gradient(180deg,rgba(28,21,21,0.96)_0%,rgba(13,11,11,1)_100%)] p-7 shadow-[0_30px_90px_-45px_rgba(0,0,0,0.9)] md:p-9"
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/12 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
                <MessagesSquare className="h-3.5 w-3.5" />
                Atendimento consultivo
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/68">
                Loja fisica em Santo Antonio de Padua
              </span>
            </div>

            <h3 className="mt-5 text-[2rem] font-black uppercase leading-[0.96] text-foreground md:text-[2.7rem]">
              Como a experiencia
              <br />
              deve acontecer.
            </h3>

            <p className="mt-4 max-w-2xl text-sm leading-[1.72] text-muted-foreground md:text-base">
              Em vez de uma secao generica de beneficios, aqui a gente explica o ritmo da
              compra: conversa, escolha, negociacao e entrega.
            </p>

            <div className="mt-8 grid gap-3">
              {process.map((step, index) => (
                <div
                  key={step.title}
                  className="grid gap-4 rounded-[26px] border border-white/8 bg-white/[0.035] px-4 py-4 md:grid-cols-[auto_1fr] md:items-start md:px-5"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-sm font-black text-primary">
                    0{index + 1}
                  </div>
                  <div>
                    <h4 className="text-[15px] font-bold uppercase tracking-[0.08em] text-foreground">
                      {step.title}
                    </h4>
                    <p className="mt-2 text-sm leading-[1.68] text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.article>

          <div className="grid gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: index * 0.05 }}
                  className="rounded-[28px] border border-white/8 bg-card px-5 py-5 shadow-card"
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

            <div className="grid gap-4 sm:grid-cols-2">
              {items.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: index * 0.06 }}
                  className="group rounded-[28px] border border-border bg-card p-6 transition hover:border-primary/35 hover:shadow-[0_24px_70px_-42px_oklch(0.62_0.24_25/0.75)]"
                >
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/14 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-[15px] font-bold uppercase tracking-[0.08em] text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-[1.65] text-muted-foreground">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
