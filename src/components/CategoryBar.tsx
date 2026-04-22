import { Link } from "@tanstack/react-router";
import { ArrowRight, Car, LayoutGrid, Layers, Truck } from "lucide-react";
import type { Category } from "@/types/vehicle";

const categories: { label: string; icon: typeof LayoutGrid; value: Category | null }[] = [
  { label: "Todos", icon: LayoutGrid, value: null },
  { label: "SUV", icon: Truck, value: "SUV" },
  { label: "Sedan", icon: Car, value: "Sedan" },
  { label: "Hatch", icon: Car, value: "Hatch" },
  { label: "Picape", icon: Truck, value: "Picape" },
  { label: "Outros", icon: Layers, value: "Nao informado" },
];

export function CategoryBar() {
  return (
    <section className="relative overflow-hidden border-y border-white/6 bg-[linear-gradient(180deg,rgba(21,18,18,0.98)_0%,rgba(13,11,11,1)_100%)] py-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-10 top-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5">
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
              Explore o estoque
            </span>
            <h2 className="mt-3 text-[2rem] font-black uppercase leading-[0.95] text-foreground md:text-[2.8rem]">
              Escolha o perfil
              <br className="hidden sm:block" />
              do seu proximo carro
            </h2>
          </div>

          <Link
            to="/estoque"
            className="inline-flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-foreground transition hover:border-primary/40 hover:text-primary"
          >
            Ver estoque completo
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <nav
          aria-label="Categorias de veiculos"
          className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-hide"
        >
          {categories.map((category) => (
            <Link
              key={category.label}
              to="/estoque"
              search={category.value ? ({ category: category.value } as never) : ({} as never)}
              className="flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground transition hover:border-primary/40 hover:bg-primary/10 hover:text-foreground"
              activeProps={{ className: "border-primary/40 bg-primary/12 text-foreground" }}
            >
              <category.icon className="h-4 w-4 text-primary" />
              {category.label}
            </Link>
          ))}
        </nav>
      </div>
    </section>
  );
}
