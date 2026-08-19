import { Instagram, Facebook, MapPin, Phone, Clock, ShieldCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";
import dmLogo from "@/assets/branding/dm-motors-logo-premium-transparent.png";

const trust = [
  "Procedência garantida",
  "Atendimento consultivo",
  "Loja física em Santo Antônio de Pádua",
  "Resposta rápida no WhatsApp",
];

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#030303]">
      <div className="border-b border-white/[0.06] bg-[#080808] px-5 py-3 lg:px-10">
        <div className="mx-auto flex max-w-[1400px] flex-wrap justify-center gap-x-8 gap-y-2">
          {trust.map((item) => (
            <div key={item} className="flex items-center gap-2 text-xs text-white/24">
              <span className="h-1 w-1 bg-primary" />
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-10 px-5 py-14 md:grid-cols-4 lg:px-10">
        <div>
          <img
            src={dmLogo}
            alt="DM Motors Imports"
            className="brand-logo-glow w-64 max-w-full object-contain object-left"
          />
          <p className="mt-4 max-w-xs text-sm leading-[1.75] text-white/34">
            Veículos selecionados, negociação clara e atendimento próximo para comprar
            com confiança.
          </p>
        </div>

        <div>
          <h4 className="text-[11px] font-bold uppercase tracking-[0.26em] text-white">
            Localização
          </h4>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-white/34">
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>
                Estrada Pádua x Pirapetinga, KM 1
                <br />
                Santa Afra / Santo Antônio de Pádua - RJ
              </span>
            </li>
            <li>
              <a
                href="https://maps.app.goo.gl/8srtyeiaNEm4eaxeA"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary transition hover:text-white"
              >
                Como chegar
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-[11px] font-bold uppercase tracking-[0.26em] text-white">
            Atendimento
          </h4>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-white/34">
            <li className="flex items-start gap-2">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>
                Seg a Sex / 8h às 18h
                <br />
                Sáb / 8h às 12h
                <br />
                Dom / Agendamentos
              </span>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" /> (22) 99731-3229
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-[11px] font-bold uppercase tracking-[0.26em] text-white">
            DM Motors
          </h4>
          <div className="mt-4 flex gap-3">
            <a
              href="https://instagram.com/dmmotorsimports"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram DM Motors"
              className="flex h-10 w-10 items-center justify-center border border-white/10 text-white/34 transition hover:border-primary hover:text-primary"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href="https://facebook.com/dmmotorsimports"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook DM Motors"
              className="flex h-10 w-10 items-center justify-center border border-white/10 text-white/34 transition hover:border-primary hover:text-primary"
            >
              <Facebook className="h-4 w-4" />
            </a>
          </div>

          <div className="mt-7 flex flex-col gap-2 text-xs text-white/30">
            <Link to="/estoque" className="transition hover:text-primary">
              Estoque completo
            </Link>
            <Link to="/admin/login" className="transition hover:text-primary">
              Acesso restrito
            </Link>
            <span className="mt-2 flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Compra assistida
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] border-t border-white/[0.06] px-5 py-5 text-center text-xs text-white/22 lg:px-10">
        <p>© {new Date().getFullYear()} DM Motors Imports - Todos os direitos reservados.</p>
        <p className="mt-1">
          Made by{" "}
          <a
            href="https://instagram.com/usecarvys"
            target="_blank"
            rel="noopener noreferrer"
            className="transition hover:text-primary"
          >
            @usecarvys
          </a>
        </p>
      </div>
    </footer>
  );
}
