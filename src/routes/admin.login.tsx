import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock, Mail, ArrowRight, ShieldCheck, ArrowLeft } from "lucide-react";
import { isAuthenticated, login } from "@/lib/auth";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Acessar painel — DM Motors" },
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

  // If already logged in, jump straight to the dashboard
  useEffect(() => {
    if (isAuthenticated()) {
      navigate({ to: "/admin" });
    }
  }, [navigate]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const ok = login(email.trim(), password);
    setLoading(false);
    if (!ok) {
      setError("Senha incorreta. Tente novamente.");
      return;
    }
    navigate({ to: "/admin" });
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-5 py-10">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-gradient-red opacity-30 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
      </div>

      <Link
        to="/"
        className="absolute left-5 top-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar ao site
      </Link>

      <div className="relative w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="inline-flex items-baseline gap-1.5">
            <span className="text-3xl font-black tracking-tighter text-primary">DM</span>
            <span className="text-2xl font-black tracking-tight text-foreground">MOTORS</span>
          </div>
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-primary">
            <ShieldCheck className="h-3 w-3" /> Painel restrito
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8"
        >
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            Acessar painel
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
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
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@dmmotors.com.br"
                  autoComplete="email"
                  className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
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
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </label>

            {error && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-black uppercase tracking-wider text-primary-foreground shadow-red transition hover:brightness-110 disabled:opacity-60"
            >
              {loading ? "Entrando…" : "Entrar"}
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </button>
          </div>
        </form>

        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          Acesso provisório por senha mestre. Será substituído por autenticação completa quando o backend estiver conectado.
        </p>
      </div>
    </div>
  );
}
