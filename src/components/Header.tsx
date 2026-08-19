import { Link } from "@tanstack/react-router";
import { Menu, MessageCircle, X } from "lucide-react";
import { useState } from "react";
import dmLogo from "@/assets/branding/dm-motors-logo-premium-transparent.png";
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
      href: whatsappLink("Olá! Vim pelo site e quero falar com a DM Motors Imports."),
    },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#060606]/92 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-5 py-3 lg:px-10">
        <Link
          to="/"
          className="flex items-center py-1 pr-2 transition-opacity hover:opacity-85"
          aria-label="DM Motors Imports - Home"
        >
          <img
            src={dmLogo}
            alt="DM Motors Imports"
            className="brand-logo-glow w-[164px] shrink-0 object-contain object-left sm:w-[204px] lg:w-[232px]"
          />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) =>
            "href" in l ? (
              <a
                key={l.label}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/42 transition hover:text-white"
              >
                {l.label}
              </a>
            ) : (
              <Link
                key={l.label}
                to={l.to}
                search={l.search as never}
                className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/42 transition hover:text-white"
                activeProps={{ className: "text-white" }}
              >
                {l.label}
              </Link>
            )
          )}
        </nav>

        <a
          href={whatsappLink("Olá! Vim pelo site e quero falar com a DM Motors Imports.")}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden items-center justify-center gap-2 border border-primary/70 bg-primary px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.18em] text-primary-foreground transition hover:bg-transparent hover:text-white lg:flex"
        >
          <MessageCircle className="h-4 w-4 fill-current" strokeWidth={0} />
          WhatsApp
        </a>

        <button
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center border border-white/10 text-foreground md:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <nav className="border-t border-white/10 bg-[#060606] md:hidden">
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
