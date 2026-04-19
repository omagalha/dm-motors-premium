import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export function Header() {
  const [open, setOpen] = useState(false);

  const links = [
    { label: "Home", to: "/" as const },
    { label: "Estoque", to: "/estoque" as const },
    { label: "SUV", to: "/estoque" as const },
    { label: "Contato", to: "/" as const },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
        <Link to="/" className="flex items-baseline gap-1.5">
          <span className="text-3xl font-black tracking-tighter text-primary">DM</span>
          <span className="text-2xl font-black tracking-tight text-foreground">MOTORS</span>
          <span className="hidden text-[10px] font-semibold tracking-[0.3em] text-muted-foreground sm:inline">
            IMPORTS
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link
              key={l.label}
              to={l.to}
              className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
              activeProps={{ className: "text-foreground font-semibold" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <button
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-md border border-border text-foreground md:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <nav className="border-t border-border bg-background md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-5 py-3">
            {links.map((l) => (
              <Link
                key={l.label}
                to={l.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-3 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
