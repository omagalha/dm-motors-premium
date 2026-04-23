import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { BadgeDollarSign, KanbanSquare, Users2 } from "lucide-react";

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
  { to: "/admin/crm/funil" as const, label: "Funil", icon: KanbanSquare },
  { to: "/admin/crm/financeiro" as const, label: "Financeiro", icon: BadgeDollarSign },
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
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary">CRM</p>
          <h1 className="mt-1.5 text-3xl font-black tracking-tight text-foreground md:text-4xl">
            Relacionamento e operacao comercial
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Leads, funil, tarefas e financeiro vinculado a negociacoes.
          </p>
        </div>
      </header>

      <nav className="flex flex-wrap gap-2 rounded-2xl border border-border bg-card p-2 shadow-card">
        {crmTabs.map((tab) => {
          const Icon = tab.icon;
          const active = isTabActive(location.pathname, tab.to);

          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                active
                  ? "bg-primary text-primary-foreground shadow-red"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
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
