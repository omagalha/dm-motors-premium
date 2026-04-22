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
    <header className="sticky top-0 z-40 border-b border-white/6 bg-[rgba(10,9,9,0.82)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-5 py-3.5">
        <Link
          to="/"
          className="flex items-center gap-3 rounded-2xl pr-2 transition-transform duration-300 hover:scale-[1.01]"
          aria-label="DM Motors Imports - Home"
        >
          <img
            src={dmLogo}
            alt="DM Motors Imports"
            className="w-[172px] shrink-0 object-contain object-left sm:w-[210px] lg:w-[238px] drop-shadow-[0_0_18px_oklch(0.62_0.24_25/0.24)]"
          />
          <span className="hidden rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-primary xl:inline-flex">
            Showroom premium
          </span>
        </Link>

        <nav className="hidden items-center gap-2 lg:flex">
          {links.map((link) =>
            "href" in link ? (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-transparent px-4 py-2.5 text-sm font-semibold text-muted-foreground transition hover:border-white/8 hover:bg-white/[0.03] hover:text-foreground"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.label}
                to={link.to}
                search={link.search as never}
                className="rounded-full border border-transparent px-4 py-2.5 text-sm font-semibold text-muted-foreground transition hover:border-white/8 hover:bg-white/[0.03] hover:text-foreground"
                activeProps={{
                  className:
                    "border-white/10 bg-white/[0.05] text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
                }}
              >
                {link.label}
              </Link>
            ),
          )}
        </nav>

        <div className="ml-auto hidden items-center gap-3 md:flex">
          <div className="hidden rounded-full border border-white/8 bg-white/[0.03] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/62 xl:inline-flex">
            Estoque atualizado
          </div>
          <a
            href={whatsappLink("Ola! Quero falar com a DM Motors Imports agora.")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-primary-foreground transition hover:brightness-110"
          >
            Falar agora
          </a>
        </div>

        <button
          aria-label="Menu"
          onClick={() => setOpen((value) => !value)}
          className="ml-auto flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-foreground lg:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <nav className="border-t border-white/8 bg-[linear-gradient(180deg,rgba(18,14,14,0.98)_0%,rgba(10,9,9,0.98)_100%)] lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-4">
            {links.map((link) =>
              "href" in link ? (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-muted-foreground transition hover:border-primary/30 hover:text-foreground"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.label}
                  to={link.to}
                  search={link.search as never}
                  onClick={() => setOpen(false)}
                  className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-muted-foreground transition hover:border-primary/30 hover:text-foreground"
                >
                  {link.label}
                </Link>
              ),
            )}

            <a
              href={whatsappLink("Ola! Vim pelo site e quero atendimento da DM Motors Imports.")}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="mt-1 inline-flex items-center justify-center rounded-2xl bg-primary px-4 py-3 text-sm font-black uppercase tracking-[0.16em] text-primary-foreground transition hover:brightness-110"
            >
              Chamar no WhatsApp
            </a>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
