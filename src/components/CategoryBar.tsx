import { Link } from "@tanstack/react-router";
import { LayoutGrid, Layers, Car, Truck } from "lucide-react";
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
    <div className="border-y border-border bg-card">
      <div className="mx-auto max-w-7xl overflow-x-auto scrollbar-hide">
        <nav
          aria-label="Categorias de veículos"
          className="flex items-center px-5"
        >
          {categories.map((cat) => (
            <Link
              key={cat.label}
              to="/estoque"
              search={cat.value ? ({ category: cat.value } as never) : ({} as never)}
              className="flex shrink-0 items-center gap-2 border-b-2 border-transparent px-4 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition hover:border-primary hover:text-foreground"
              activeProps={{ className: "border-primary text-foreground" }}
            >
              <cat.icon className="h-3.5 w-3.5" />
              {cat.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
