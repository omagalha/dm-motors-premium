import { Instagram, Facebook, MapPin, Phone, Clock, ShieldCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      {/* Trust strip */}
      <div className="border-b border-border/60 bg-background/40">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-3 px-5 py-5 text-xs text-muted-foreground sm:grid-cols-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" /> Procedência garantida
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" /> Atendimento 7 dias
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" /> Loja física
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-primary" /> Resposta rápida no WhatsApp
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-5 py-12 md:grid-cols-4">
        {/* Brand */}
        <div className="md:col-span-1">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black tracking-tighter text-primary">DM</span>
            <span className="text-2xl font-black tracking-tight text-foreground">MOTORS</span>
            <span className="text-[10px] font-semibold tracking-[0.3em] text-muted-foreground">
              IMPORTS
            </span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Carros impecáveis com procedência e preço diferenciado. Sua próxima conquista
            começa aqui.
          </p>
        </div>

        {/* Localização */}
        <div>
          <h4 className="text-sm font-bold uppercase tracking-widest text-foreground">
            Localização
          </h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>
                Estrada Pádua x Pirapetinga, KM 1
                <br />
                Santa Afra · Santo Antônio de Pádua - RJ
              </span>
            </li>
            <li>
              <a
                href="https://maps.app.goo.gl/8srtyeiaNEm4eaxeA"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold uppercase tracking-wider text-primary transition hover:underline"
              >
                Como chegar →
              </a>
            </li>
          </ul>
        </div>

        {/* Horário + contato */}
        <div>
          <h4 className="text-sm font-bold uppercase tracking-widest text-foreground">
            Horário
          </h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>
                Seg a Sex · 8h às 18h
                <br />
                Sáb · 8h às 12h
                <br />
                Dom · Fechado / Agendamentos
              </span>
            </li>
            <li className="flex items-center gap-2 pt-1">
              <Phone className="h-4 w-4 text-primary" /> (32) 99926-4848
            </li>
          </ul>
        </div>

        {/* Redes + atalhos */}
        <div>
          <h4 className="text-sm font-bold uppercase tracking-widest text-foreground">
            Siga a DM
          </h4>
          <div className="mt-3 flex gap-3">
            <a
              href="https://instagram.com/dmmotorsimports"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram DM Motors"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:border-primary hover:text-primary"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href="https://facebook.com/dmmotorsimports"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook DM Motors"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:border-primary hover:text-primary"
            >
              <Facebook className="h-4 w-4" />
            </a>
          </div>

          <div className="mt-6 flex flex-col gap-1.5 text-xs">
            <Link
              to="/estoque"
              className="text-muted-foreground transition hover:text-primary"
            >
              Estoque completo
            </Link>
            <Link
              to="/admin/login"
              className="text-muted-foreground/60 transition hover:text-primary"
            >
              Acesso restrito
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl border-t border-border px-5 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} DM Motors Imports - Todos os direitos reservados.
      </div>
    </footer>
  );
}
