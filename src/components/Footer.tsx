import { Facebook, Instagram, MapPin, Phone, Clock, ShieldCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";
import dmLogo from "@/assets/branding/dm-motors-logo-header.png";

export function Footer() {
  return (
    <footer className="border-t border-white/6 bg-[linear-gradient(180deg,rgba(14,12,12,1)_0%,rgba(9,8,8,1)_100%)]">
      <div className="border-b border-white/6 bg-black/20">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-3 px-5 py-5 text-xs text-muted-foreground sm:grid-cols-2 xl:grid-cols-4">
          <div className="flex items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
            <ShieldCheck className="h-4 w-4 text-primary" /> Procedencia validada
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
            <Clock className="h-4 w-4 text-primary" /> Atendimento consultivo
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
            <MapPin className="h-4 w-4 text-primary" /> Loja fisica
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
            <Phone className="h-4 w-4 text-primary" /> Resposta rapida no WhatsApp
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-5 py-12 md:grid-cols-[1.2fr_0.7fr_0.9fr_0.9fr]">
        <div>
          <img
            src={dmLogo}
            alt="DM Motors Imports"
            className="w-[220px] object-contain object-left"
          />
          <p className="mt-4 max-w-sm text-sm leading-[1.75] text-muted-foreground">
            Curadoria, atendimento direto e negociacao clara para quem quer comprar com
            mais seguranca e menos ruido.
          </p>

          <div className="mt-6 flex gap-3">
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
        </div>

        <div>
          <h4 className="text-sm font-bold uppercase tracking-widest text-foreground">Site</h4>
          <div className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground">
            <Link to="/" className="transition hover:text-primary">
              Home
            </Link>
            <Link to="/estoque" className="transition hover:text-primary">
              Estoque completo
            </Link>
            <Link to="/admin/login" className="transition hover:text-primary">
              Acesso restrito
            </Link>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-bold uppercase tracking-widest text-foreground">
            Localizacao
          </h4>
          <div className="mt-4 space-y-3 text-sm text-muted-foreground">
            <p className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>
                Estrada Padua x Pirapetinga, KM 1
                <br />
                Santa Afra - Santo Antonio de Padua - RJ
              </span>
            </p>
            <a
              href="https://maps.app.goo.gl/8srtyeiaNEm4eaxeA"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex text-xs font-semibold uppercase tracking-wider text-primary transition hover:underline"
            >
              Como chegar
            </a>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-bold uppercase tracking-widest text-foreground">
            Atendimento
          </h4>
          <div className="mt-4 space-y-3 text-sm text-muted-foreground">
            <p className="flex items-start gap-2">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>
                Seg a Sex - 8h as 18h
                <br />
                Sab - 8h as 12h
                <br />
                Dom - Fechado / Agendamentos
              </span>
            </p>
            <p className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" /> (32) 99926-4848
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl border-t border-border px-5 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} DM Motors Imports - Todos os direitos reservados.
      </div>
    </footer>
  );
}
