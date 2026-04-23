import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CalendarClock, CheckSquare, Phone, Plus, Search, Trash2, Users2 } from "lucide-react";
import { toast } from "sonner";
import { useCars } from "@/data/carsStore";
import {
  createLead,
  createTask,
  deleteLead,
  deleteTask,
  getLeads,
  getTasks,
  updateLead,
  updateTask,
} from "@/services/crmService";
import type {
  Lead,
  LeadInput,
  LeadPriority,
  LeadStage,
  Task,
  TaskInput,
  TaskPriority,
  TaskStatus,
} from "@/types/crm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/crm/leads")({
  head: () => ({
    meta: [
      { title: "CRM Leads - Admin DM Motors" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminCrmLeadsPage,
});

const LEAD_STAGE_OPTIONS: Array<{ value: LeadStage; label: string }> = [
  { value: "novo", label: "Novo" },
  { value: "em_contato", label: "Em contato" },
  { value: "qualificado", label: "Qualificado" },
  { value: "proposta", label: "Proposta" },
  { value: "negociacao", label: "Negociação" },
  { value: "convertido", label: "Convertido" },
  { value: "perdido", label: "Perdido" },
];

const LEAD_PRIORITY_OPTIONS: Array<{ value: LeadPriority; label: string }> = [
  { value: "low", label: "Baixa" },
  { value: "medium", label: "Média" },
  { value: "high", label: "Alta" },
];

const TASK_STATUS_OPTIONS: Array<{ value: TaskStatus; label: string }> = [
  { value: "todo", label: "A fazer" },
  { value: "in_progress", label: "Em andamento" },
  { value: "done", label: "Concluída" },
  { value: "cancelled", label: "Cancelada" },
];

const TASK_PRIORITY_OPTIONS: Array<{ value: TaskPriority; label: string }> = [
  { value: "low", label: "Baixa" },
  { value: "medium", label: "Média" },
  { value: "high", label: "Alta" },
];

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
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

function buildLeadForm(): LeadInput {
  return {
    name: "",
    phone: "",
    email: "",
    source: "site",
    stage: "novo",
    priority: "medium",
    assignedTo: "",
    budget: 0,
    tags: "",
    notes: "",
    lastContactAt: "",
    nextFollowUpAt: "",
    interestVehicleId: "",
  };
}

function buildTaskForm(): TaskInput {
  return {
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    dueDate: getTodayDate(),
    assignedTo: "",
    leadId: "",
    dealId: "",
  };
}

function AdminCrmLeadsPage() {
  const cars = useCars();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [leadDialogOpen, setLeadDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [submittingLead, setSubmittingLead] = useState(false);
  const [submittingTask, setSubmittingTask] = useState(false);
  const [leadForm, setLeadForm] = useState<LeadInput>(buildLeadForm);
  const [taskForm, setTaskForm] = useState<TaskInput>(buildTaskForm);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    Promise.all([getLeads(search), getTasks({ scope: "open" })])
      .then(([nextLeads, nextTasks]) => {
        if (!cancelled) {
          setLeads(nextLeads);
          setTasks(nextTasks);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Não foi possível carregar o CRM.");
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [search]);

  const overdueTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          task.dueDate &&
          task.dueDate < getTodayDate() &&
          task.status !== "done" &&
          task.status !== "cancelled",
      ),
    [tasks],
  );

  const hotLeads = useMemo(
    () => leads.filter((lead) => lead.priority === "high" || lead.stage === "negociacao"),
    [leads],
  );

  async function reload() {
    const [nextLeads, nextTasks] = await Promise.all([getLeads(search), getTasks({ scope: "open" })]);
    setLeads(nextLeads);
    setTasks(nextTasks);
  }

  async function handleCreateLead(event: React.FormEvent) {
    event.preventDefault();
    setSubmittingLead(true);

    try {
      await createLead(leadForm);
      await reload();
      setLeadDialogOpen(false);
      setLeadForm(buildLeadForm());
      toast.success("Lead criado no CRM.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível criar o lead.");
    } finally {
      setSubmittingLead(false);
    }
  }

  async function handleCreateTask(event: React.FormEvent) {
    event.preventDefault();
    setSubmittingTask(true);

    try {
      await createTask(taskForm);
      await reload();
      setTaskDialogOpen(false);
      setTaskForm(buildTaskForm());
      toast.success("Tarefa criada.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível criar a tarefa.");
    } finally {
      setSubmittingTask(false);
    }
  }

  async function handleLeadStageChange(lead: Lead, stage: LeadStage) {
    try {
      const updated = await updateLead(lead.id, { stage });
      setLeads((current) => current.map((item) => (item.id === lead.id ? updated : item)));
      toast.success("Etapa do lead atualizada.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível atualizar o lead.");
    }
  }

  async function handleTaskStatusChange(task: Task, status: TaskStatus) {
    try {
      const updated = await updateTask(task.id, { status });
      setTasks((current) => current.map((item) => (item.id === task.id ? updated : item)));
      toast.success("Status da tarefa atualizado.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível atualizar a tarefa.");
    }
  }

  async function handleDeleteLead(lead: Lead) {
    if (!window.confirm(`Remover o lead "${lead.name}"?`)) return;

    try {
      await deleteLead(lead.id);
      await reload();
      toast.success("Lead removido.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível remover o lead.");
    }
  }

  async function handleDeleteTask(task: Task) {
    if (!window.confirm(`Remover a tarefa "${task.title}"?`)) return;

    try {
      await deleteTask(task.id);
      await reload();
      toast.success("Tarefa removida.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível remover a tarefa.");
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar lead por nome, telefone, e-mail ou veículo"
            className="adm-input pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setTaskDialogOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-black text-foreground transition hover:border-primary/40 hover:text-primary"
          >
            <CheckSquare className="h-4 w-4" />
            Nova tarefa
          </button>
          <button
            type="button"
            onClick={() => setLeadDialogOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-black text-primary-foreground shadow-red transition hover:brightness-110"
          >
            <Plus className="h-4 w-4" />
            Novo lead
          </button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Leads"
          value={String(leads.length)}
          hint="Leads carregados no CRM"
          icon={<Users2 className="h-5 w-5" />}
          accent="bg-primary/12 text-primary"
        />
        <MetricCard
          label="Quentes"
          value={String(hotLeads.length)}
          hint="Prioridade alta ou em negociação"
          icon={<Phone className="h-5 w-5" />}
          accent="bg-amber-500/12 text-amber-300"
        />
        <MetricCard
          label="Tarefas abertas"
          value={String(tasks.length)}
          hint="Follow-ups ainda em andamento"
          icon={<CheckSquare className="h-5 w-5" />}
          accent="bg-white/8 text-foreground"
        />
        <MetricCard
          label="Atrasadas"
          value={String(overdueTasks.length)}
          hint="Tarefas vencidas até hoje"
          icon={<CalendarClock className="h-5 w-5" />}
          accent="bg-red-500/12 text-red-400"
        />
      </section>

      {error && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {error}
        </div>
      )}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_380px]">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-card md:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-foreground">Base de leads</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Cadastro comercial com etapa, prioridade e interesse.
              </p>
            </div>
            {loading && (
              <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                Atualizando
              </span>
            )}
          </div>

          {leads.length ? (
            <div className="space-y-3">
              {leads.map((lead) => (
                <article
                  key={lead.id}
                  className="rounded-2xl border border-border/70 bg-background/45 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-lg font-bold text-foreground">{lead.name}</h3>
                        <span className="rounded-full bg-white/6 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                          {lead.source || "origem"}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${
                            lead.priority === "high"
                              ? "bg-red-500/12 text-red-400"
                              : lead.priority === "medium"
                                ? "bg-amber-500/12 text-amber-300"
                                : "bg-white/8 text-muted-foreground"
                          }`}
                        >
                          {lead.priority === "high"
                            ? "Alta"
                            : lead.priority === "medium"
                              ? "Média"
                              : "Baixa"}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {lead.phone || "Sem telefone"} · {lead.email || "Sem e-mail"}
                      </p>
                      <p className="mt-2 text-sm text-foreground/85">
                        {lead.interestVehicle?.name || "Sem veículo vinculado"}
                        {lead.budget > 0 ? ` · orçamento ${formatCurrency(lead.budget)}` : ""}
                      </p>
                      {lead.notes && (
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                          {lead.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={lead.stage}
                        onChange={(event) =>
                          void handleLeadStageChange(lead, event.target.value as LeadStage)
                        }
                        className="adm-input min-w-[170px] bg-card"
                      >
                        {LEAD_STAGE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => void handleDeleteLead(lead)}
                        className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition hover:border-red-500/40 hover:text-red-400"
                        aria-label="Remover lead"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span>Responsável: {lead.assignedTo || "Não definido"}</span>
                    <span>Último contato: {formatShortDate(lead.lastContactAt)}</span>
                    <span>Próximo follow-up: {formatShortDate(lead.nextFollowUpAt)}</span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Nenhum lead encontrado"
              description="Cadastre o primeiro lead para começar a organizar o CRM."
            />
          )}
        </div>

        <aside className="rounded-3xl border border-border bg-card p-5 shadow-card md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-foreground">Tarefas abertas</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Follow-ups vinculados ao comercial.
              </p>
            </div>
          </div>

          {tasks.length ? (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-2xl border border-border/70 bg-background/45 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-foreground">{task.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {task.lead?.name || task.deal?.name || "Sem vínculo"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleDeleteTask(task)}
                      className="text-muted-foreground transition hover:text-red-400"
                      aria-label="Remover tarefa"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-3 grid gap-2">
                    <select
                      value={task.status}
                      onChange={(event) =>
                        void handleTaskStatusChange(task, event.target.value as TaskStatus)
                      }
                      className="adm-input bg-card text-sm"
                    >
                      {TASK_STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>Vence: {formatShortDate(task.dueDate)}</span>
                    <span>
                      Prioridade:{" "}
                      {task.priority === "high"
                        ? "Alta"
                        : task.priority === "medium"
                          ? "Média"
                          : "Baixa"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Nenhuma tarefa aberta"
              description="As próximas ações do time vão aparecer aqui."
              compact
            />
          )}
        </aside>
      </section>

      <Dialog open={leadDialogOpen} onOpenChange={setLeadDialogOpen}>
        <DialogContent className="border-border bg-card text-foreground sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Novo lead</DialogTitle>
            <DialogDescription>
              Cadastre o contato inicial para acompanhar no funil comercial.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateLead} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nome">
                <input
                  value={leadForm.name ?? ""}
                  onChange={(event) => setLeadForm((current) => ({ ...current, name: event.target.value }))}
                  className="adm-input"
                  required
                />
              </Field>
              <Field label="Telefone">
                <input
                  value={leadForm.phone ?? ""}
                  onChange={(event) =>
                    setLeadForm((current) => ({ ...current, phone: event.target.value }))
                  }
                  className="adm-input"
                />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="E-mail">
                <input
                  type="email"
                  value={leadForm.email ?? ""}
                  onChange={(event) =>
                    setLeadForm((current) => ({ ...current, email: event.target.value }))
                  }
                  className="adm-input"
                />
              </Field>
              <Field label="Origem">
                <input
                  value={leadForm.source ?? ""}
                  onChange={(event) =>
                    setLeadForm((current) => ({ ...current, source: event.target.value }))
                  }
                  className="adm-input"
                  placeholder="site, instagram, showroom..."
                />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Etapa">
                <select
                  value={leadForm.stage ?? "novo"}
                  onChange={(event) =>
                    setLeadForm((current) => ({
                      ...current,
                      stage: event.target.value as LeadStage,
                    }))
                  }
                  className="adm-input"
                >
                  {LEAD_STAGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Prioridade">
                <select
                  value={leadForm.priority ?? "medium"}
                  onChange={(event) =>
                    setLeadForm((current) => ({
                      ...current,
                      priority: event.target.value as LeadPriority,
                    }))
                  }
                  className="adm-input"
                >
                  {LEAD_PRIORITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Orçamento">
                <input
                  type="number"
                  value={leadForm.budget ?? 0}
                  onChange={(event) =>
                    setLeadForm((current) => ({
                      ...current,
                      budget: Number(event.target.value) || 0,
                    }))
                  }
                  className="adm-input"
                  min={0}
                  step="0.01"
                />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Responsável">
                <input
                  value={leadForm.assignedTo ?? ""}
                  onChange={(event) =>
                    setLeadForm((current) => ({ ...current, assignedTo: event.target.value }))
                  }
                  className="adm-input"
                />
              </Field>
              <Field label="Veículo de interesse">
                <select
                  value={leadForm.interestVehicleId ?? ""}
                  onChange={(event) =>
                    setLeadForm((current) => ({
                      ...current,
                      interestVehicleId: event.target.value,
                    }))
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
              <Field label="Último contato">
                <input
                  type="date"
                  value={leadForm.lastContactAt ?? ""}
                  onChange={(event) =>
                    setLeadForm((current) => ({
                      ...current,
                      lastContactAt: event.target.value,
                    }))
                  }
                  className="adm-input"
                />
              </Field>
              <Field label="Próximo follow-up">
                <input
                  type="date"
                  value={leadForm.nextFollowUpAt ?? ""}
                  onChange={(event) =>
                    setLeadForm((current) => ({
                      ...current,
                      nextFollowUpAt: event.target.value,
                    }))
                  }
                  className="adm-input"
                />
              </Field>
            </div>

            <Field label="Tags">
              <input
                value={String(leadForm.tags ?? "")}
                onChange={(event) =>
                  setLeadForm((current) => ({ ...current, tags: event.target.value }))
                }
                className="adm-input"
                placeholder="premium, repasse, troca"
              />
            </Field>

            <Field label="Observações">
              <textarea
                value={leadForm.notes ?? ""}
                onChange={(event) =>
                  setLeadForm((current) => ({ ...current, notes: event.target.value }))
                }
                className="adm-input min-h-[110px] resize-y"
                rows={5}
              />
            </Field>

            <DialogFooter>
              <button
                type="button"
                onClick={() => setLeadDialogOpen(false)}
                className="rounded-lg border border-border px-4 py-2.5 text-sm font-bold text-foreground transition hover:bg-secondary"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submittingLead}
                className="rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-red transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submittingLead ? "Salvando..." : "Criar lead"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent className="border-border bg-card text-foreground sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Nova tarefa</DialogTitle>
            <DialogDescription>
              Agende um follow-up para o time comercial não perder timing.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateTask} className="space-y-4">
            <Field label="Título">
              <input
                value={taskForm.title ?? ""}
                onChange={(event) => setTaskForm((current) => ({ ...current, title: event.target.value }))}
                className="adm-input"
                required
              />
            </Field>

            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Status">
                <select
                  value={taskForm.status ?? "todo"}
                  onChange={(event) =>
                    setTaskForm((current) => ({
                      ...current,
                      status: event.target.value as TaskStatus,
                    }))
                  }
                  className="adm-input"
                >
                  {TASK_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Prioridade">
                <select
                  value={taskForm.priority ?? "medium"}
                  onChange={(event) =>
                    setTaskForm((current) => ({
                      ...current,
                      priority: event.target.value as TaskPriority,
                    }))
                  }
                  className="adm-input"
                >
                  {TASK_PRIORITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Vencimento">
                <input
                  type="date"
                  value={taskForm.dueDate ?? ""}
                  onChange={(event) =>
                    setTaskForm((current) => ({ ...current, dueDate: event.target.value }))
                  }
                  className="adm-input"
                />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Responsável">
                <input
                  value={taskForm.assignedTo ?? ""}
                  onChange={(event) =>
                    setTaskForm((current) => ({ ...current, assignedTo: event.target.value }))
                  }
                  className="adm-input"
                />
              </Field>
              <Field label="Lead vinculado">
                <select
                  value={taskForm.leadId ?? ""}
                  onChange={(event) =>
                    setTaskForm((current) => ({ ...current, leadId: event.target.value }))
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
            </div>

            <Field label="Descrição">
              <textarea
                value={taskForm.description ?? ""}
                onChange={(event) =>
                  setTaskForm((current) => ({ ...current, description: event.target.value }))
                }
                className="adm-input min-h-[110px] resize-y"
                rows={5}
              />
            </Field>

            <DialogFooter>
              <button
                type="button"
                onClick={() => setTaskDialogOpen(false)}
                className="rounded-lg border border-border px-4 py-2.5 text-sm font-bold text-foreground transition hover:bg-secondary"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submittingTask}
                className="rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-red transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submittingTask ? "Salvando..." : "Criar tarefa"}
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
    <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
      <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${accent}`}>
        {icon}
      </div>
      <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-4xl font-black tracking-tight text-foreground">{value}</p>
      <p className="mt-2 text-sm text-muted-foreground">{hint}</p>
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
      className={`rounded-3xl border border-dashed border-border bg-background/40 text-center ${
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
