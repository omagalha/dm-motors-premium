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
import { isAuthenticated, logout, restoreSession } from "@/lib/auth";
import { subscribeToAdminSessionChanges } from "@/lib/adminSession";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Painel Admin - DM Motors Imports" },
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

const DM_MOTORS_AI_URL =
  "https://chatgpt.com/g/g-69e6b81647748191a69b23543a815db3-dm-motors-ia";

function ChatAiMark({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M7 9.2C7 6.33 9.33 4 12.2 4h3.6A5.2 5.2 0 0 1 21 9.2v2.6A5.2 5.2 0 0 1 15.8 17H12l-4.2 3v-4.08A5.15 5.15 0 0 1 7 13.8V9.2Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11 10.5h.01M14 10.5h.01M17 10.5h.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.4 5.2 7.9 6.4 9.1 6.9 7.9 7.4 7.4 8.6 6.9 7.4 5.7 6.9 6.9 6.4 7.4 5.2Z"
        fill="currentColor"
      />
    </svg>
  );
}

function DmMotorsAiLink({
  className = "",
  compact = false,
  onClick,
}: {
  className?: string;
  compact?: boolean;
  onClick?: () => void;
}) {
  return (
    <a
      href={DM_MOTORS_AI_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      className={`group flex items-center gap-3 rounded-2xl border border-white/8 bg-gradient-to-br from-white/[0.07] via-white/[0.04] to-transparent text-foreground transition hover:border-white/15 hover:bg-white/[0.08] ${className}`}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-white shadow-[0_0_24px_rgba(255,255,255,0.08)]">
        <ChatAiMark className="h-4.5 w-4.5" />
      </span>
      {!compact && (
        <>
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
              Chat
            </span>
            <span className="block truncate text-sm font-semibold text-foreground">
              DM Motors IA
            </span>
          </span>
          <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition group-hover:text-foreground" />
        </>
      )}
    </a>
  );
}

function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkAccess() {
      const onLoginPage = location.pathname === "/admin/login";

      if (onLoginPage) {
        setAuthed(true);
        return;
      }

      setAuthed(null);

      const session = isAuthenticated() ? await restoreSession() : null;
      if (cancelled) return;

      if (!session) {
        setAuthed(false);
        navigate({ to: "/admin/login" });
        return;
      }

      setAuthed(true);
    }

    void checkAccess();

    return () => {
      cancelled = true;
    };
  }, [location.pathname, navigate]);

  useEffect(() => {
    return subscribeToAdminSessionChanges(() => {
      if (location.pathname === "/admin/login") return;

      const ok = isAuthenticated();
      setAuthed(ok);

      if (!ok) {
        navigate({ to: "/admin/login" });
      }
    });
  }, [location.pathname, navigate]);

  function isActive(to: string, exact: boolean) {
    if (exact) return location.pathname === to;
    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  }

  async function handleLogout() {
    await logout();
    navigate({ to: "/admin/login" });
  }

  if (location.pathname === "/admin/login") {
    return (
      <>
        <Toaster theme="dark" position="top-center" richColors />
        <Outlet />
      </>
    );
  }

  if (authed === null || authed === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Verificando acesso...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster theme="dark" position="top-center" richColors />

      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-lg">
        <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen((value) => !value)}
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
              onClick={() => void handleLogout()}
              className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-destructive hover:text-destructive"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
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
                    className={`h-4 w-4 ${
                      active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    }`}
                  />
                  {item.label}
                  {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
                </Link>
              );
            })}
          </nav>

          <DmMotorsAiLink className="mt-8 px-4 py-3" />

          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao site
          </Link>
        </aside>

        {mobileOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <aside
              onClick={(event) => event.stopPropagation()}
              className="h-full w-72 border-r border-border bg-card px-3 pb-6 pt-20"
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
              <DmMotorsAiLink
                className="mt-5 px-3 py-3"
                onClick={() => setMobileOpen(false)}
              />
              <button
                onClick={() => {
                  setMobileOpen(false);
                  void handleLogout();
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
