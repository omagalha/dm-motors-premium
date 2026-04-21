import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import dmLogo from "@/assets/branding/dm-motors-logo-header.png";
import { whatsappLink } from "@/lib/whatsapp";

type HeaderLink =
  | {
      label: string;
      to: "/" | "/estoque";
      search?: unknown;
      href?: never;
    }
  | {
      label: string;
      href: string;
      to?: never;
      search?: never;
    };

export function Header() {
  const [open, setOpen] = useState(false);

  const links: HeaderLink[] = [
    { label: "Home", to: "/" as const, search: undefined },
    { label: "Estoque", to: "/estoque" as const, search: undefined },
    { label: "SUV", to: "/estoque" as const, search: { category: "SUV" } as const },
    {
      label: "Contato",
      href: whatsappLink("Ola! Vim pelo site e quero falar com a DM Motors Imports."),
    },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
        <Link
          to="/"
          className="flex items-center rounded-2xl py-1 pr-2 transition-transform duration-300 hover:scale-[1.01]"
          aria-label="DM Motors Imports - Home"
        >
          <img
            src={dmLogo}
            alt="DM Motors Imports"
            className="w-[172px] shrink-0 object-contain object-left sm:w-[210px] lg:w-[238px] drop-shadow-[0_0_18px_oklch(0.62_0.24_25/0.24)]"
          />
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {links.map((l) =>
            "href" in l ? (
              <a
                key={l.label}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
              >
                {l.label}
              </a>
            ) : (
              <Link
                key={l.label}
                to={l.to}
                search={l.search as never}
                className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
                activeProps={{ className: "text-foreground font-semibold" }}
              >
                {l.label}
              </Link>
            )
          )}
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
            {links.map((l) =>
              "href" in l ? (
                <a
                  key={l.label}
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-3 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                >
                  {l.label}
                </a>
              ) : (
                <Link
                  key={l.label}
                  to={l.to}
                  search={l.search as never}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-3 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                >
                  {l.label}
                </Link>
              )
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
