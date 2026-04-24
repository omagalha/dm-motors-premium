import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { useCars } from "@/data/carsStore";
import {
  createEmptyVehicleFinanceOverview,
  createVehicleFinanceEntry,
  deleteVehicleFinanceEntry,
  getDeals,
  getVehicleFinanceOverview,
} from "@/services/crmService";
import type { Deal, VehicleFinanceEntryInput, VehicleFinanceKind, VehicleFinanceOverview } from "@/types/crm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/crm/financeiro")({
  head: () => ({
    meta: [
      { title: "Financeiro Comercial - CRM DM Motors" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminCrmFinanceiroPage,
});

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function shiftMonth(month: string, offset: number) {
  const [yearString, monthString] = month.split("-");
  const year = Number(yearString);
  const monthIndex = Number(monthString) - 1;
  const date = new Date(year, monthIndex + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(month: string) {
  const [yearString, monthString] = month.split("-");
  const year = Number(yearString);
  const monthIndex = Number(monthString) - 1;
  const label = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, monthIndex, 1));

  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatShortDate(value: string) {
  if (!value) return "Sem data";

  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(parsed);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function buildEntryForm(): VehicleFinanceEntryInput {
  return {
    kind: "expense",
    category: "",
    amount: 0,
    entryDate: getTodayDate(),
    description: "",
    notes: "",
    source: "manual",
    vehicleId: "",
    dealId: "",
  };
}

function AdminCrmFinanceiroPage() {
  const cars = useCars();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [month, setMonth] = useState(getCurrentMonth);
  const [overview, setOverview] = useState<VehicleFinanceOverview>(() =>
    createEmptyVehicleFinanceOverview(getCurrentMonth()),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [entryForm, setEntryForm] = useState<VehicleFinanceEntryInput>(buildEntryForm);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    Promise.all([getVehicleFinanceOverview(month), getDeals("")])
      .then(([nextOverview, nextDeals]) => {
        if (!cancelled) {
          setOverview(nextOverview);
          setDeals(nextDeals);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setOverview(createEmptyVehicleFinanceOverview(month));
        setError(err instanceof Error ? err.message : "Não foi possível carregar o financeiro.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [month]);

  const totals = overview.totals;

  const positiveCategories = useMemo(
    () => overview.byCategory.filter((item) => item.income > 0 || item.expenses > 0),
    [overview.byCategory],
  );

  async function reload() {
    const nextOverview = await getVehicleFinanceOverview(month);
    setOverview(nextOverview);
  }

  async function handleCreateEntry(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);

    try {
      await createVehicleFinanceEntry(entryForm);
      await reload();
      setDialogOpen(false);
      setEntryForm(buildEntryForm());
      toast.success("Lançamento do CRM criado.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível criar o lançamento.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteEntry(id: string) {
    if (!window.confirm("Remover este lançamento do CRM?")) return;

    try {
      await deleteVehicleFinanceEntry(id);
      await reload();
      toast.success("Lançamento removido.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível remover o lançamento.");
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary">
            Financeiro Comercial
          </p>
          <h2 className="mt-1 text-3xl font-black tracking-tight text-foreground">
            Entradas e saidas por negociacao
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Visao comercial ligada a leads, propostas, negocios e custos de cada oportunidade.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-card">
          <button
            type="button"
            onClick={() => setMonth((current) => shiftMonth(current, -1))}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="min-w-[180px] px-3 text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
              Período
            </p>
            <p className="mt-1 text-lg font-black text-foreground">{formatMonthLabel(month)}</p>
          </div>
          <button
            type="button"
            onClick={() => setMonth((current) => shiftMonth(current, 1))}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </header>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-[2rem] border border-white/8 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-5 shadow-card">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
            Caixa comercial
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Controle de receitas e custos por oportunidade.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-black text-primary-foreground shadow-red transition hover:brightness-110"
        >
          <Plus className="h-4 w-4" />
          Novo lançamento
        </button>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Entradas"
          value={formatCurrency(totals.income)}
          hint="Receitas do CRM"
          icon={<ArrowUpRight className="h-5 w-5" />}
          accent="bg-primary/12 text-primary"
        />
        <MetricCard
          label="Saídas"
          value={formatCurrency(totals.expenses)}
          hint="Custos e repasses"
          icon={<ArrowDownRight className="h-5 w-5" />}
          accent="bg-red-500/12 text-red-400"
        />
        <MetricCard
          label="Saldo"
          value={formatCurrency(totals.balance)}
          hint="Entradas menos saídas"
          icon={<Wallet className="h-5 w-5" />}
          accent="bg-emerald-500/12 text-emerald-400"
        />
        <MetricCard
          label="Movimentos"
          value={String(totals.entriesCount)}
          hint="Lançamentos no período"
          icon={<Wallet className="h-5 w-5" />}
          accent="bg-white/8 text-foreground"
        />
      </section>

      {error && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {error}
        </div>
      )}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_360px]">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-card md:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-foreground">Movimentações</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Lançamentos vinculados ao CRM no mês selecionado.
              </p>
            </div>
            {loading && (
              <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                Atualizando
              </span>
            )}
          </div>

          {overview.movements.length ? (
            <div className="space-y-3">
              {overview.movements.map((entry) => (
                <article
                  key={entry.id}
                  className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/70 bg-background/45 p-4"
                >
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                      entry.kind === "income"
                        ? "bg-primary/12 text-primary"
                        : "bg-red-500/12 text-red-400"
                    }`}
                  >
                    {entry.kind === "income" ? (
                      <ArrowUpRight className="h-5 w-5" />
                    ) : (
                      <ArrowDownRight className="h-5 w-5" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-lg font-bold text-foreground">
                      {entry.description}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {entry.category || "Sem categoria"} · {formatShortDate(entry.entryDate)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {entry.vehicle?.name || "Sem veículo"} · {entry.deal?.name || "Sem negócio"}
                    </p>
                  </div>

                  <div className="ml-auto flex items-center gap-3">
                    <div className="text-right">
                      <p
                        className={`text-xl font-black ${
                          entry.kind === "income" ? "text-primary" : "text-red-400"
                        }`}
                      >
                        {entry.kind === "income" ? "+" : "-"}
                        {formatCurrency(entry.amount)}
                      </p>
                      {entry.notes && (
                        <p className="max-w-[220px] truncate text-xs text-muted-foreground">
                          {entry.notes}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => void handleDeleteEntry(entry.id)}
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition hover:border-red-500/40 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Nenhum lançamento no CRM"
              description="As entradas e saídas do módulo comercial aparecerão aqui."
            />
          )}
        </div>

        <div className="space-y-6">
          <SummaryBox
            title="Por categoria"
            subtitle="Totais por categoria no período"
            items={positiveCategories.map((item) => ({
              id: item.category,
              label: item.category,
              meta: `Entradas ${formatCurrency(item.income)} · Saídas ${formatCurrency(item.expenses)}`,
            }))}
            emptyTitle="Sem categorias ainda"
            emptyDescription="Cadastre lançamentos para visualizar o agrupamento."
          />

          <SummaryBox
            title="Por veículo"
            subtitle="Fluxo vinculado a veículos do funil"
            items={overview.byVehicle.map((item) => ({
              id: item.vehicleId,
              label: item.vehicleName,
              meta: `Entradas ${formatCurrency(item.income)} · Saídas ${formatCurrency(item.expenses)}`,
            }))}
            emptyTitle="Sem veículos vinculados"
            emptyDescription="Vincule um veículo ao lançar receitas ou despesas do CRM."
          />
        </div>
      </section>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[88vh] overflow-hidden border-border bg-card text-foreground sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Novo lançamento do CRM</DialogTitle>
            <DialogDescription>
              Registre uma entrada ou saída vinculada ao comercial.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleCreateEntry}
            className="max-h-[calc(88vh-8.5rem)] space-y-4 overflow-y-auto pr-1"
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Tipo">
                <select
                  value={entryForm.kind}
                  onChange={(event) =>
                    setEntryForm((current) => ({
                      ...current,
                      kind: event.target.value as VehicleFinanceKind,
                    }))
                  }
                  className="adm-input"
                >
                  <option value="income">Entrada</option>
                  <option value="expense">Saída</option>
                </select>
              </Field>
              <Field label="Valor">
                <input
                  type="number"
                  value={entryForm.amount}
                  onChange={(event) =>
                    setEntryForm((current) => ({
                      ...current,
                      amount: Number(event.target.value) || 0,
                    }))
                  }
                  className="adm-input"
                  min={0}
                  step="0.01"
                />
              </Field>
              <Field label="Data">
                <input
                  type="date"
                  value={entryForm.entryDate}
                  onChange={(event) =>
                    setEntryForm((current) => ({ ...current, entryDate: event.target.value }))
                  }
                  className="adm-input"
                />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Descrição">
                <input
                  value={entryForm.description}
                  onChange={(event) =>
                    setEntryForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  className="adm-input"
                  required
                />
              </Field>
              <Field label="Categoria">
                <input
                  value={entryForm.category ?? ""}
                  onChange={(event) =>
                    setEntryForm((current) => ({ ...current, category: event.target.value }))
                  }
                  className="adm-input"
                />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Veículo">
                <select
                  value={entryForm.vehicleId ?? ""}
                  onChange={(event) =>
                    setEntryForm((current) => ({ ...current, vehicleId: event.target.value }))
                  }
                  className="adm-input"
                >
                  <option value="">Não vincular</option>
                  {cars.map((car) => (
                    <option key={car.id} value={car.id}>
                      {car.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Negócio">
                <select
                  value={entryForm.dealId ?? ""}
                  onChange={(event) =>
                    setEntryForm((current) => ({ ...current, dealId: event.target.value }))
                  }
                  className="adm-input"
                >
                  <option value="">Não vincular</option>
                  {deals.map((deal) => (
                    <option key={deal.id} value={deal.id}>
                      {deal.title}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Observações">
              <textarea
                value={entryForm.notes ?? ""}
                onChange={(event) =>
                  setEntryForm((current) => ({ ...current, notes: event.target.value }))
                }
                className="adm-input min-h-[110px] resize-y"
                rows={5}
              />
            </Field>

            <DialogFooter>
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="rounded-lg border border-border px-4 py-2.5 text-sm font-bold text-foreground transition hover:bg-secondary"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-red transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Salvando..." : "Criar lançamento"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <style>{`
        .adm-input {
          width: 100%;
          background: var(--color-input);
          border: 1px solid var(--color-border);
          color: var(--color-foreground);
          border-radius: 0.875rem;
          padding: 0.75rem 0.9rem;
          font-size: 0.875rem;
          transition: border-color 0.15s;
        }
        .adm-input:focus {
          outline: none;
          border-color: var(--color-primary);
        }
      `}</style>
    </div>
  );
}

function MetricCard({
  label,
  value,
  hint,
  icon,
  accent,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="rounded-[1.75rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-5 shadow-card">
      <div
        className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 ${accent}`}
      >
        {icon}
      </div>
      <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-4xl font-black tracking-tight text-foreground">{value}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{hint}</p>
    </div>
  );
}

function SummaryBox({
  title,
  subtitle,
  items,
  emptyTitle,
  emptyDescription,
}: {
  title: string;
  subtitle: string;
  items: Array<{ id: string; label: string; meta: string }>;
  emptyTitle: string;
  emptyDescription: string;
}) {
  return (
    <section className="rounded-[1.75rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5 shadow-card md:p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-black text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>

      {items.length ? (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-[1.35rem] border border-white/8 bg-background/45 px-4 py-3"
            >
              <p className="text-sm font-bold text-foreground">{item.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{item.meta}</p>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title={emptyTitle} description={emptyDescription} compact />
      )}
    </section>
  );
}

function EmptyState({
  title,
  description,
  compact = false,
}: {
  title: string;
  description: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`rounded-[1.75rem] border border-dashed border-white/10 bg-background/40 text-center ${
        compact ? "px-4 py-10" : "px-5 py-16"
      }`}
    >
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-2 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

