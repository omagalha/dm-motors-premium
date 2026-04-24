import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { KanbanSquare, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useCars } from "@/data/carsStore";
import { createDeal, deleteDeal, getDeals, getLeads, updateDeal } from "@/services/crmService";
import type { Deal, DealInput, DealStage, Lead } from "@/types/crm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/crm/funil")({
  head: () => ({
    meta: [
      { title: "CRM Funil - Admin DM Motors" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminCrmFunilPage,
});

const STAGES: Array<{ value: DealStage; label: string }> = [
  { value: "novo", label: "Novo" },
  { value: "qualificacao", label: "Qualificação" },
  { value: "proposta", label: "Proposta" },
  { value: "negociacao", label: "Negociação" },
  { value: "fechado_ganho", label: "Fechado ganho" },
  { value: "fechado_perdido", label: "Fechado perdido" },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
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

function buildDealForm(): DealInput {
  return {
    title: "",
    stage: "novo",
    value: 0,
    probability: 20,
    expectedCloseDate: "",
    owner: "",
    source: "crm",
    notes: "",
    lostReason: "",
    leadId: "",
    vehicleId: "",
  };
}

function AdminCrmFunilPage() {
  const cars = useCars();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dealForm, setDealForm] = useState<DealInput>(buildDealForm);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    Promise.all([getDeals(search), getLeads("")])
      .then(([nextDeals, nextLeads]) => {
        if (!cancelled) {
          setDeals(nextDeals);
          setLeads(nextLeads);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Não foi possível carregar o funil.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [search]);

  const stageGroups = useMemo(
    () =>
      Object.fromEntries(
        STAGES.map((stage) => [stage.value, deals.filter((deal) => deal.stage === stage.value)]),
      ) as Record<DealStage, Deal[]>,
    [deals],
  );

  const openDeals = useMemo(
    () =>
      deals.filter(
        (deal) => deal.stage !== "fechado_ganho" && deal.stage !== "fechado_perdido",
      ),
    [deals],
  );

  const wonDeals = useMemo(
    () => deals.filter((deal) => deal.stage === "fechado_ganho"),
    [deals],
  );

  const lostDeals = useMemo(
    () => deals.filter((deal) => deal.stage === "fechado_perdido"),
    [deals],
  );

  async function reload() {
    const [nextDeals, nextLeads] = await Promise.all([getDeals(search), getLeads("")]);
    setDeals(nextDeals);
    setLeads(nextLeads);
  }

  async function handleCreateDeal(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);

    try {
      await createDeal(dealForm);
      await reload();
      setDialogOpen(false);
      setDealForm(buildDealForm());
      toast.success("Negócio criado no funil.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível criar o negócio.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStageChange(deal: Deal, stage: DealStage) {
    try {
      const updated = await updateDeal(deal.id, { stage });
      setDeals((current) => current.map((item) => (item.id === deal.id ? updated : item)));
      toast.success("Etapa do negócio atualizada.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível atualizar o negócio.");
    }
  }

  async function handleDeleteDeal(deal: Deal) {
    if (!window.confirm(`Remover o negócio "${deal.title}"?`)) return;

    try {
      await deleteDeal(deal.id);
      await reload();
      toast.success("Negócio removido.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível remover o negócio.");
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-[2rem] border border-white/8 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-5 shadow-card">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por negócio, lead ou veículo"
          className="adm-input max-w-sm"
        />

        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-black text-primary-foreground shadow-red transition hover:brightness-110"
        >
          <Plus className="h-4 w-4" />
          Novo negócio
        </button>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Em aberto"
          value={String(openDeals.length)}
          hint="Negócios ainda no pipeline"
          icon={<KanbanSquare className="h-5 w-5" />}
          accent="bg-primary/12 text-primary"
        />
        <MetricCard
          label="Pipeline"
          value={formatCurrency(openDeals.reduce((sum, deal) => sum + deal.value, 0))}
          hint="Valor total em aberto"
          icon={<KanbanSquare className="h-5 w-5" />}
          accent="bg-white/8 text-foreground"
        />
        <MetricCard
          label="Ganhos"
          value={formatCurrency(wonDeals.reduce((sum, deal) => sum + deal.value, 0))}
          hint={`${wonDeals.length} negócio(s) fechados`}
          icon={<KanbanSquare className="h-5 w-5" />}
          accent="bg-emerald-500/12 text-emerald-400"
        />
        <MetricCard
          label="Perdidos"
          value={String(lostDeals.length)}
          hint="Negócios fora do radar"
          icon={<KanbanSquare className="h-5 w-5" />}
          accent="bg-red-500/12 text-red-400"
        />
      </section>

      {error && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {error}
        </div>
      )}

      <section className="grid gap-4 xl:grid-cols-3 2xl:grid-cols-6">
        {STAGES.map((stage) => {
          const items = stageGroups[stage.value] ?? [];

          return (
            <div
              key={stage.value}
              className="rounded-3xl border border-border bg-card p-4 shadow-card"
            >
              <div className="mb-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                  {stage.label}
                </p>
                <p className="mt-1 text-2xl font-black text-foreground">{items.length}</p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(items.reduce((sum, deal) => sum + deal.value, 0))}
                </p>
              </div>

              {loading ? (
                <EmptyState
                  title="Atualizando"
                  description="Carregando negócios..."
                  compact
                />
              ) : items.length ? (
                <div className="space-y-3">
                  {items.map((deal) => (
                    <article
                      key={deal.id}
                      className="rounded-2xl border border-border/70 bg-background/45 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-foreground">
                            {deal.title}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {deal.lead?.name || "Sem lead"} · {deal.vehicle?.name || "Sem veículo"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleDeleteDeal(deal)}
                          className="text-muted-foreground transition hover:text-red-400"
                          aria-label="Remover negócio"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <p className="mt-3 text-lg font-black text-primary">
                        {formatCurrency(deal.value)}
                      </p>

                      <div className="mt-3 space-y-2">
                        <select
                          value={deal.stage}
                          onChange={(event) =>
                            void handleStageChange(deal, event.target.value as DealStage)
                          }
                          className="adm-input bg-card text-sm"
                        >
                          {STAGES.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span>{deal.probability}% chance</span>
                        <span>Fecha: {formatShortDate(deal.expectedCloseDate)}</span>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="Sem negócios"
                  description="Os cards desta etapa aparecerão aqui."
                  compact
                />
              )}
            </div>
          );
        })}
      </section>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-hidden border-border bg-card text-foreground sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Novo negócio</DialogTitle>
            <DialogDescription>
              Cadastre uma oportunidade para acompanhar no funil comercial.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleCreateDeal}
            className="max-h-[calc(90vh-8.5rem)] space-y-4 overflow-y-auto pr-1"
          >
            <Field label="Título">
              <input
                value={dealForm.title ?? ""}
                onChange={(event) =>
                  setDealForm((current) => ({ ...current, title: event.target.value }))
                }
                className="adm-input"
                required
              />
            </Field>

            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Etapa">
                <select
                  value={dealForm.stage ?? "novo"}
                  onChange={(event) =>
                    setDealForm((current) => ({
                      ...current,
                      stage: event.target.value as DealStage,
                    }))
                  }
                  className="adm-input"
                >
                  {STAGES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Valor">
                <input
                  type="number"
                  value={dealForm.value ?? 0}
                  onChange={(event) =>
                    setDealForm((current) => ({
                      ...current,
                      value: Number(event.target.value) || 0,
                    }))
                  }
                  className="adm-input"
                  min={0}
                  step="0.01"
                />
              </Field>
              <Field label="Probabilidade">
                <input
                  type="number"
                  value={dealForm.probability ?? 0}
                  onChange={(event) =>
                    setDealForm((current) => ({
                      ...current,
                      probability: Number(event.target.value) || 0,
                    }))
                  }
                  className="adm-input"
                  min={0}
                  max={100}
                  step="1"
                />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Lead">
                <select
                  value={dealForm.leadId ?? ""}
                  onChange={(event) =>
                    setDealForm((current) => ({ ...current, leadId: event.target.value }))
                  }
                  className="adm-input"
                >
                  <option value="">Não vincular</option>
                  {leads.map((lead) => (
                    <option key={lead.id} value={lead.id}>
                      {lead.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Veículo">
                <select
                  value={dealForm.vehicleId ?? ""}
                  onChange={(event) =>
                    setDealForm((current) => ({ ...current, vehicleId: event.target.value }))
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
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Responsável">
                <input
                  value={dealForm.owner ?? ""}
                  onChange={(event) =>
                    setDealForm((current) => ({ ...current, owner: event.target.value }))
                  }
                  className="adm-input"
                />
              </Field>
              <Field label="Previsão de fechamento">
                <input
                  type="date"
                  value={dealForm.expectedCloseDate ?? ""}
                  onChange={(event) =>
                    setDealForm((current) => ({
                      ...current,
                      expectedCloseDate: event.target.value,
                    }))
                  }
                  className="adm-input"
                />
              </Field>
            </div>

            <Field label="Observações">
              <textarea
                value={dealForm.notes ?? ""}
                onChange={(event) =>
                  setDealForm((current) => ({ ...current, notes: event.target.value }))
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
                {submitting ? "Salvando..." : "Criar negócio"}
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
    <div className="rounded-[1.75rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-5 shadow-card">
      <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ring-1 ring-white/6 ${accent}`}>
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
