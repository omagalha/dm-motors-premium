import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  Car,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Toaster } from "sonner";
import { isAuthenticated, logout } from "@/lib/auth";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Painel Admin — DM Motors Imports" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLayout,
});

const navItems = [
  { to: "/admin" as const, label: "Visão geral", icon: LayoutDashboard, exact: true },
  { to: "/admin/veiculos" as const, label: "Veículos", icon: Car, exact: false },
  { to: "/admin/insights" as const, label: "Insights", icon: BarChart3, exact: false },
];

function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authed, setAuthed] = useState<boolean | null>(null);

  // Auth guard: anything under /admin requires login, except /admin/login itself.
  useEffect(() => {
    const onLoginPage = location.pathname === "/admin/login";
    const ok = isAuthenticated();
    setAuthed(ok);
    if (!ok && !onLoginPage) {
      navigate({ to: "/admin/login" });
    }
  }, [location.pathname, navigate]);

  function isActive(to: string, exact: boolean) {
    if (exact) return location.pathname === to;
    return location.pathname === to || location.pathname.startsWith(to + "/");
  }

  function handleLogout() {
    logout();
    navigate({ to: "/admin/login" });
  }

  // Render the login route without the chrome (sidebar/topbar).
  if (location.pathname === "/admin/login") {
    return (
      <>
        <Toaster theme="dark" position="top-center" richColors />
        <Outlet />
      </>
    );
  }

  // While checking auth, don't flash protected content.
  if (authed === null || authed === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Verificando acesso…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster theme="dark" position="top-center" richColors />

      {/* Topbar */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-lg">
        <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-foreground md:hidden"
              aria-label="Menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link to="/admin" className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black tracking-tighter text-primary">DM</span>
              <span className="text-lg font-black tracking-tight text-foreground">MOTORS</span>
              <span className="ml-2 hidden rounded-md border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary sm:inline">
                Admin
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-primary hover:text-primary"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Ver site</span>
            </Link>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-destructive hover:text-destructive"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar — desktop */}
        <aside className="sticky top-[57px] hidden h-[calc(100vh-57px)] w-60 shrink-0 border-r border-border/60 bg-card/30 px-3 py-6 md:block">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Gestão
          </p>
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.to, item.exact);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? "bg-primary/15 text-foreground"
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`}
                  />
                  {item.label}
                  {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
                </Link>
              );
            })}
          </nav>

          <div className="mt-8 rounded-xl border border-border/60 bg-background/50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
              Backend
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              Configure <code className="rounded bg-secondary px-1 py-0.5 text-[10px] text-foreground">VITE_API_URL</code> para conectar a API real.
            </p>
          </div>

          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao site
          </Link>
        </aside>

        {/* Sidebar — mobile drawer */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <aside
              onClick={(e) => e.stopPropagation()}
              className="h-full w-72 border-r border-border bg-card px-3 pt-20 pb-6"
            >
              <nav className="flex flex-col gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.to, item.exact);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition ${
                        active
                          ? "bg-primary/15 text-foreground"
                          : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${active ? "text-primary" : ""}`} />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <button
                onClick={() => {
                  setMobileOpen(false);
                  handleLogout();
                }}
                className="mt-4 flex w-full items-center gap-2 rounded-lg px-3 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-destructive"
              >
                <LogOut className="h-3.5 w-3.5" /> Sair
              </button>
              <Link
                to="/"
                onClick={() => setMobileOpen(false)}
                className="mt-2 flex items-center gap-2 rounded-lg px-3 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao site
              </Link>
            </aside>
          </div>
        )}

        <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
