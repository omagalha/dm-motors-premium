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
    <div className="space-y-5">
      <header>
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary">CRM</p>
        <h1 className="mt-1.5 text-2xl font-black tracking-tight text-foreground md:text-3xl">
          Relacionamento comercial
        </h1>
      </header>

      <nav className="flex flex-wrap gap-1.5 rounded-2xl border border-border/60 bg-card p-1.5">
        {crmTabs.map((tab) => {
          const Icon = tab.icon;
          const active = isTabActive(location.pathname, tab.to);

          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                active
                  ? "bg-primary text-primary-foreground shadow-red"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
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
