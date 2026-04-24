import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { BadgeDollarSign, ContactRound, KanbanSquare, Users2 } from "lucide-react";

export const Route = createFileRoute("/admin/crm")({
  head: () => ({
    meta: [
      { title: "CRM - Admin DM Motors" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminCrmLayout,
});

const crmTabs = [
  { to: "/admin/crm/leads" as const, label: "Leads", icon: Users2 },
  { to: "/admin/crm/contatos" as const, label: "Contatos", icon: ContactRound },
  { to: "/admin/crm/funil" as const, label: "Funil", icon: KanbanSquare },
  {
    to: "/admin/crm/financeiro" as const,
    label: "Financeiro Comercial",
    icon: BadgeDollarSign,
  },
];

function isTabActive(pathname: string, tabTo: (typeof crmTabs)[number]["to"]) {
  if (tabTo === "/admin/crm/leads") {
    return (
      pathname === tabTo ||
      pathname.startsWith("/admin/crm/leads/") ||
      pathname.startsWith("/admin/crm/lead/")
    );
  }

  return pathname === tabTo || pathname.startsWith(`${tabTo}/`);
}

function AdminCrmLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname === "/admin/crm") {
      navigate({ to: "/admin/crm/leads", replace: true });
    }
  }, [location.pathname, navigate]);

  return (
    <div className="space-y-6">
      <header className="overflow-hidden rounded-[2rem] border border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_35%),linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6 shadow-card md:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary">CRM</p>
            <h1 className="mt-2 text-3xl font-black tracking-[0.02em] text-foreground md:text-5xl">
              Relacionamento e operacao comercial
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-[15px]">
              Leads, contatos, funil, tarefas e financeiro comercial organizados em um fluxo mais
              claro, elegante e orientado a fechamento.
            </p>
          </div>
          <div className="rounded-3xl border border-white/8 bg-black/10 px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
              Modulo ativo
            </p>
            <p className="mt-2 text-lg font-black tracking-[0.08em] text-foreground">CRM DM Motors</p>
          </div>
        </div>
      </header>

      <nav className="flex flex-wrap gap-2 rounded-3xl border border-white/8 bg-card/90 p-2 shadow-card backdrop-blur">
        {crmTabs.map((tab) => {
          const Icon = tab.icon;
          const active = isTabActive(location.pathname, tab.to);

          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition ${
                active
                  ? "bg-primary text-primary-foreground shadow-red"
                  : "text-muted-foreground hover:bg-white/6 hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <Outlet />
    </div>
  );
}
