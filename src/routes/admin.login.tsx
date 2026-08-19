import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Lock, Mail, ShieldCheck } from "lucide-react";
import { login, restoreSession } from "@/lib/auth";
import dmLogo from "@/assets/branding/dm-motors-logo-premium-transparent.png";
import heroCar from "@/assets/hero-home.jpg";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Acessar painel - DM Motors" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      const session = await restoreSession();
      if (!cancelled && session) {
        navigate({ to: "/admin" });
      }
    }

    void checkSession();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email.trim(), password);
      navigate({ to: "/admin" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível entrar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative grid min-h-screen bg-[#060606] lg:grid-cols-[1.05fr_0.95fr]">
      <Link
        to="/"
        className="absolute left-5 top-5 z-20 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/46 transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar ao site
      </Link>

      <section className="relative hidden overflow-hidden lg:block">
        <img
          src={heroCar}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover opacity-62"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.28)_0%,rgba(0,0,0,0.92)_100%)]" />
        <div className="absolute bottom-12 left-12 right-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-primary">
            Área administrativa
          </p>
          <h1 className="mt-4 font-display text-7xl font-black uppercase leading-[0.88] text-white">
            Gestão
            <br />
            premium
          </h1>
          <p className="mt-5 max-w-lg text-sm leading-[1.85] text-white/44">
            Estoque, leads e métricas comerciais reunidos em um painel reservado para a
            operação DM Motors.
          </p>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-16">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <img src={dmLogo} alt="DM Motors Imports" className="brand-logo-glow h-auto w-64 object-contain" />
            <p className="mt-5 inline-flex items-center gap-2 border border-primary/30 bg-primary/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.25em] text-primary">
              <ShieldCheck className="h-3 w-3" /> Painel restrito
            </p>
          </div>

          <form onSubmit={handleSubmit} className="border border-white/[0.07] bg-card p-6 shadow-card sm:p-8">
            <h1 className="font-display text-4xl font-black uppercase leading-none text-foreground">
              Acessar painel
            </h1>
            <p className="mt-3 text-sm leading-[1.7] text-muted-foreground">
              Entre com suas credenciais para gerenciar o estoque.
            </p>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  E-mail
                </span>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="admin@dmmotors.com.br"
                    autoComplete="email"
                    required
                    className="w-full rounded-none border border-white/10 bg-background py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  Senha
                </span>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="********"
                    autoComplete="current-password"
                    required
                    className="w-full rounded-none border border-white/10 bg-background py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </label>

              {error && (
                <div className="border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-2 bg-primary py-3 text-sm font-black uppercase tracking-wider text-primary-foreground shadow-red transition hover:brightness-110 disabled:opacity-60"
              >
                {loading ? "Entrando..." : "Entrar"}
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </button>
            </div>
          </form>

          <p className="mt-5 text-center text-[11px] text-muted-foreground">
            Login protegido por token com sessão persistida no navegador.
          </p>
        </div>
      </section>
    </div>
  );
}
