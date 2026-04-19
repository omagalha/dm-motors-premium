import { Instagram, Facebook, MapPin, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card py-10">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-5 md:grid-cols-3">
        <div>
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

        <div>
          <h4 className="text-sm font-bold uppercase tracking-widest text-foreground">
            Contato
          </h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" /> (32) 99926-4848
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" /> Atendimento em todo Brasil
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-bold uppercase tracking-widest text-foreground">
            Redes
          </h4>
          <div className="mt-3 flex gap-3">
            <a
              href="#"
              aria-label="Instagram"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:border-primary hover:text-primary"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href="#"
              aria-label="Facebook"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:border-primary hover:text-primary"
            >
              <Facebook className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-7xl border-t border-border px-5 pt-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} DM Motors Imports — Todos os direitos reservados.
      </div>
    </footer>
  );
}
