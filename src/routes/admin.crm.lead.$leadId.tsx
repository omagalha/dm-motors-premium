import { createFileRoute, Link } from "@tanstack/react-router";
import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarClock,
  Car,
  CheckSquare,
  CircleDollarSign,
  Clock3,
  Mail,
  Phone,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { useCars } from "@/data/carsStore";
import {
  createDeal,
  createTask,
  deleteDeal,
  deleteTask,
  getLeadProfile,
  updateDeal,
  updateLead,
  updateTask,
} from "@/services/crmService";
import type {
  Deal,
  DealInput,
  DealStage,
  LeadPriority,
  LeadProfile,
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

export const Route = createFileRoute("/admin/crm/lead/$leadId")({
  head: () => ({
    meta: [
      { title: "Perfil do Lead - CRM DM Motors" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminCrmLeadProfilePage,
});

const LEAD_STAGE_OPTIONS: Array<{ value: LeadStage; label: string }> = [
  { value: "novo", label: "Novo" },
  { value: "em_contato", label: "Em contato" },
  { value: "qualificado", label: "Qualificado" },
  { value: "proposta", label: "Proposta" },
  { value: "negociacao", label: "Negociacao" },
  { value: "convertido", label: "Convertido" },
  { value: "perdido", label: "Perdido" },
];

const LEAD_PRIORITY_OPTIONS: Array<{ value: LeadPriority; label: string }> = [
  { value: "low", label: "Baixa" },
  { value: "medium", label: "Media" },
  { value: "high", label: "Alta" },
];

const TASK_STATUS_OPTIONS: Array<{ value: TaskStatus; label: string }> = [
  { value: "todo", label: "A fazer" },
  { value: "in_progress", label: "Em andamento" },
  { value: "done", label: "Concluida" },
  { value: "cancelled", label: "Cancelada" },
];

const TASK_PRIORITY_OPTIONS: Array<{ value: TaskPriority; label: string }> = [
  { value: "low", label: "Baixa" },
  { value: "medium", label: "Media" },
  { value: "high", label: "Alta" },
];

const DEAL_STAGE_OPTIONS: Array<{ value: DealStage; label: string }> = [
  { value: "novo", label: "Novo" },
  { value: "qualificacao", label: "Qualificacao" },
  { value: "proposta", label: "Proposta" },
  { value: "negociacao", label: "Negociacao" },
  { value: "fechado_ganho", label: "Fechado ganho" },
  { value: "fechado_perdido", label: "Fechado perdido" },
];

interface LeadProfileForm {
  name: string;
  phone: string;
  email: string;
  source: string;
  stage: LeadStage;
  priority: LeadPriority;
  assignedTo: string;
  budget: number;
  tagsText: string;
  lastContactAt: string;
  nextFollowUpAt: string;
  interestVehicleId: string;
  notes: string;
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function buildLeadForm(profile: LeadProfile | null): LeadProfileForm {
  const lead = profile?.lead;

  return {
    name: lead?.name ?? "",
    phone: lead?.phone ?? "",
    email: lead?.email ?? "",
    source: lead?.source ?? "site",
    stage: lead?.stage ?? "novo",
    priority: lead?.priority ?? "medium",
    assignedTo: lead?.assignedTo ?? "",
    budget: lead?.budget ?? 0,
    tagsText: lead?.tags?.join(", ") ?? "",
    lastContactAt: lead?.lastContactAt ?? "",
    nextFollowUpAt: lead?.nextFollowUpAt ?? "",
    interestVehicleId: lead?.interestVehicle?.id ?? "",
    notes: lead?.notes ?? "",
  };
}

function buildTaskForm(leadId = ""): TaskInput {
  return {
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    dueDate: getTodayDate(),
    assignedTo: "",
    leadId,
  };
}

function buildProposalForm(profile: LeadProfile | null): DealInput {
  const lead = profile?.lead;

  return {
    title: lead?.name ? `Negocio ${lead.name}` : "",
    stage: "proposta",
    value: lead?.budget ?? 0,
    probability: 50,
    expectedCloseDate: "",
    owner: lead?.assignedTo ?? "",
    source: "crm",
    notes: "",
    lostReason: "",
    leadId: lead?.id ?? "",
    vehicleId: lead?.interestVehicle?.id ?? "",
  };
}

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

function formatLongDate(value: string) {
  if (!value) return "Sem data";

  const parsed = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: value.length > 10 ? "2-digit" : undefined,
    minute: value.length > 10 ? "2-digit" : undefined,
  }).format(parsed);
}

function getLeadStageLabel(stage: LeadStage) {
  return LEAD_STAGE_OPTIONS.find((option) => option.value === stage)?.label ?? stage;
}

function getLeadPriorityLabel(priority: LeadPriority) {
  return LEAD_PRIORITY_OPTIONS.find((option) => option.value === priority)?.label ?? priority;
}

function getTaskStatusLabel(status: TaskStatus) {
  return TASK_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;
}

function getTaskPriorityLabel(priority: TaskPriority) {
  return TASK_PRIORITY_OPTIONS.find((option) => option.value === priority)?.label ?? priority;
}

function getDealStageLabel(stage: DealStage | "") {
  if (!stage) return "Sem proposta ativa";
  return DEAL_STAGE_OPTIONS.find((option) => option.value === stage)?.label ?? stage;
}

function getHistoryTone(type: LeadProfile["history"][number]["type"]) {
  switch (type) {
    case "lead_created":
      return "bg-primary/12 text-primary";
    case "contact_logged":
    case "follow_up_scheduled":
      return "bg-amber-500/12 text-amber-300";
    case "task_created":
    case "task_completed":
      return "bg-white/8 text-foreground";
    case "proposal_created":
    case "proposal_closed":
      return "bg-emerald-500/12 text-emerald-400";
    default:
      return "bg-white/8 text-foreground";
  }
}

function AdminCrmLeadProfilePage() {
  const { leadId } = Route.useParams();
  const cars = useCars();
  const [profile, setProfile] = useState<LeadProfile | null>(null);
  const [leadForm, setLeadForm] = useState<LeadProfileForm>(() => buildLeadForm(null));
  const [leadFormDirty, setLeadFormDirty] = useState(false);
  const [taskForm, setTaskForm] = useState<TaskInput>(() => buildTaskForm(""));
  const [proposalForm, setProposalForm] = useState<DealInput>(() => buildProposalForm(null));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [proposalDialogOpen, setProposalDialogOpen] = useState(false);
  const [submittingTask, setSubmittingTask] = useState(false);
  const [submittingProposal, setSubmittingProposal] = useState(false);

  const pendingTasks = useMemo(
    () =>
      (profile?.tasks ?? []).filter((task) => task.status === "todo" || task.status === "in_progress"),
    [profile?.tasks],
  );

  const linkedVehicle = useMemo(() => {
    const vehicleId = profile?.lead.interestVehicle?.id;
    if (!vehicleId) return null;
    return cars.find((car) => car.id === vehicleId) ?? null;
  }, [cars, profile?.lead.interestVehicle?.id]);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    getLeadProfile(leadId)
      .then((nextProfile) => {
        if (cancelled) return;
        syncProfile(nextProfile);
      })
      .catch((err) => {
        if (cancelled) return;
        setProfile(null);
        setError(err instanceof Error ? err.message : "Nao foi possivel carregar o lead.");
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [leadId]);

  function syncProfile(nextProfile: LeadProfile, options?: { preserveLeadDraft?: boolean }) {
    setProfile(nextProfile);
    setTaskForm(buildTaskForm(nextProfile.lead.id));
    setProposalForm(buildProposalForm(nextProfile));

    if (options?.preserveLeadDraft) return;

    setLeadForm(buildLeadForm(nextProfile));
    setLeadFormDirty(false);
  }

  async function reload(options?: { preserveLeadDraft?: boolean }) {
    const nextProfile = await getLeadProfile(leadId);
    syncProfile(nextProfile, options);
  }

  function updateLeadForm<K extends keyof LeadProfileForm>(key: K, value: LeadProfileForm[K]) {
    setLeadForm((current) => ({ ...current, [key]: value }));
    setLeadFormDirty(true);
  }

  async function handleSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) return;

    setSavingProfile(true);

    try {
      await updateLead(profile.lead.id, {
        name: leadForm.name,
        phone: leadForm.phone,
        email: leadForm.email,
        source: leadForm.source,
        stage: leadForm.stage,
        priority: leadForm.priority,
        assignedTo: leadForm.assignedTo,
        budget: leadForm.budget,
        tags: leadForm.tagsText,
        lastContactAt: leadForm.lastContactAt,
        nextFollowUpAt: leadForm.nextFollowUpAt,
        interestVehicleId: leadForm.interestVehicleId,
        notes: leadForm.notes,
      });
      await reload();
      toast.success("Perfil do lead atualizado.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nao foi possivel salvar o perfil.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleCreateTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) return;

    setSubmittingTask(true);

    try {
      await createTask({ ...taskForm, leadId: profile.lead.id });
      await reload({ preserveLeadDraft: leadFormDirty });
      setTaskDialogOpen(false);
      setTaskForm(buildTaskForm(profile.lead.id));
      toast.success("Tarefa criada para o lead.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nao foi possivel criar a tarefa.");
    } finally {
      setSubmittingTask(false);
    }
  }

  async function handleCreateProposal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) return;

    setSubmittingProposal(true);

    try {
      await createDeal({ ...proposalForm, leadId: profile.lead.id });
      await reload({ preserveLeadDraft: leadFormDirty });
      setProposalDialogOpen(false);
      setProposalForm(buildProposalForm(profile));
      toast.success("Proposta criada para o lead.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nao foi possivel criar a proposta.");
    } finally {
      setSubmittingProposal(false);
    }
  }

  async function handleTaskStatusChange(task: Task, status: TaskStatus) {
    try {
      await updateTask(task.id, { status });
      await reload({ preserveLeadDraft: leadFormDirty });
      toast.success("Status da tarefa atualizado.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nao foi possivel atualizar a tarefa.");
    }
  }

  async function handleProposalStageChange(proposal: Deal, stage: DealStage) {
    try {
      await updateDeal(proposal.id, { stage });
      await reload({ preserveLeadDraft: leadFormDirty });
      toast.success("Etapa da proposta atualizada.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nao foi possivel atualizar a proposta.");
    }
  }

  async function handleDeleteTask(task: Task) {
    if (!window.confirm(`Remover a tarefa "${task.title}"?`)) return;

    try {
      await deleteTask(task.id);
      await reload({ preserveLeadDraft: leadFormDirty });
      toast.success("Tarefa removida.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nao foi possivel remover a tarefa.");
    }
  }

  async function handleDeleteProposal(proposal: Deal) {
    if (!window.confirm(`Remover a proposta "${proposal.title}"?`)) return;

    try {
      await deleteDeal(proposal.id);
      await reload({ preserveLeadDraft: leadFormDirty });
      toast.success("Proposta removida.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nao foi possivel remover a proposta.");
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            to="/admin/crm/leads"
            className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para leads
          </Link>
          <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.25em] text-primary">
            Perfil do lead
          </p>
          <h2 className="mt-1 text-3xl font-black tracking-tight text-foreground md:text-4xl">
            {profile?.lead.name || "Lead"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {profile
              ? `${profile.lead.phone || "Sem telefone"} · ${profile.lead.email || "Sem e-mail"} · ${profile.lead.source || "crm"}`
              : "Dados do cliente, historico, tarefas e propostas em uma so tela."}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setTaskDialogOpen(true)}
            disabled={!profile}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-black text-foreground transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            <CheckSquare className="h-4 w-4" />
            Nova tarefa
          </button>
          <button
            type="button"
            onClick={() => setProposalDialogOpen(true)}
            disabled={!profile}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-black text-foreground transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            Nova proposta
          </button>
          <button
            type="submit"
            form="lead-profile-form"
            disabled={!profile || savingProfile}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-black text-primary-foreground shadow-red transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {savingProfile ? "Salvando..." : "Salvar perfil"}
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {error}
        </div>
      )}

      {loading ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Perfil"
            value="..."
            hint="Carregando dados do lead"
            icon={<ShieldCheck className="h-5 w-5" />}
            accent="bg-primary/12 text-primary"
          />
          <MetricCard
            label="Tarefas"
            value="..."
            hint="Lendo follow-ups"
            icon={<CheckSquare className="h-5 w-5" />}
            accent="bg-white/8 text-foreground"
          />
          <MetricCard
            label="Pipeline"
            value="..."
            hint="Buscando propostas"
            icon={<CircleDollarSign className="h-5 w-5" />}
            accent="bg-emerald-500/12 text-emerald-400"
          />
          <MetricCard
            label="Historico"
            value="..."
            hint="Montando timeline"
            icon={<Clock3 className="h-5 w-5" />}
            accent="bg-amber-500/12 text-amber-300"
          />
        </section>
      ) : profile ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Etapa"
              value={getLeadStageLabel(profile.status.stage)}
              hint={`Prioridade ${getLeadPriorityLabel(profile.status.priority).toLowerCase()}`}
              icon={<ShieldCheck className="h-5 w-5" />}
              accent="bg-primary/12 text-primary"
            />
            <MetricCard
              label="Tarefas abertas"
              value={String(profile.status.openTasksCount)}
              hint={`${profile.status.overdueTasksCount} atrasada(s)`}
              icon={<CheckSquare className="h-5 w-5" />}
              accent="bg-white/8 text-foreground"
            />
            <MetricCard
              label="Pipeline"
              value={formatCurrency(profile.status.pipelineValue)}
              hint={`${profile.status.openProposalsCount} proposta(s) em aberto`}
              icon={<CircleDollarSign className="h-5 w-5" />}
              accent="bg-emerald-500/12 text-emerald-400"
            />
            <MetricCard
              label="Historico"
              value={String(profile.history.length)}
              hint="Interacoes registradas no CRM"
              icon={<Clock3 className="h-5 w-5" />}
              accent="bg-amber-500/12 text-amber-300"
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_360px]">
            <form id="lead-profile-form" onSubmit={handleSaveProfile} className="space-y-6">
              <div className="rounded-[1.75rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5 shadow-card md:p-6">
                <div className="mb-5">
                  <h3 className="text-2xl font-black text-foreground">Dados do cliente</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Contato principal, responsavel comercial e contexto do lead.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <Field label="Nome">
                    <input
                      value={leadForm.name}
                      onChange={(event) => updateLeadForm("name", event.target.value)}
                      className="adm-input"
                      required
                    />
                  </Field>
                  <Field label="Telefone">
                    <input
                      value={leadForm.phone}
                      onChange={(event) => updateLeadForm("phone", event.target.value)}
                      className="adm-input"
                    />
                  </Field>
                  <Field label="E-mail">
                    <input
                      type="email"
                      value={leadForm.email}
                      onChange={(event) => updateLeadForm("email", event.target.value)}
                      className="adm-input"
                    />
                  </Field>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <Field label="Origem">
                    <input
                      value={leadForm.source}
                      onChange={(event) => updateLeadForm("source", event.target.value)}
                      className="adm-input"
                      placeholder="site, instagram, showroom..."
                    />
                  </Field>
                  <Field label="Responsavel">
                    <input
                      value={leadForm.assignedTo}
                      onChange={(event) => updateLeadForm("assignedTo", event.target.value)}
                      className="adm-input"
                    />
                  </Field>
                  <Field label="Orcamento">
                    <input
                      type="number"
                      value={leadForm.budget}
                      onChange={(event) =>
                        updateLeadForm("budget", Number(event.target.value) || 0)
                      }
                      className="adm-input"
                      min={0}
                      step="0.01"
                    />
                  </Field>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <Field label="Etapa">
                    <select
                      value={leadForm.stage}
                      onChange={(event) =>
                        updateLeadForm("stage", event.target.value as LeadStage)
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
                      value={leadForm.priority}
                      onChange={(event) =>
                        updateLeadForm("priority", event.target.value as LeadPriority)
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
                  <Field label="Carro de interesse">
                    <select
                      value={leadForm.interestVehicleId}
                      onChange={(event) => updateLeadForm("interestVehicleId", event.target.value)}
                      className="adm-input"
                    >
                      <option value="">Sem vinculo</option>
                      {cars.map((car) => (
                        <option key={car.id} value={car.id}>
                          {car.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Field label="Ultimo contato">
                    <input
                      type="date"
                      value={leadForm.lastContactAt}
                      onChange={(event) => updateLeadForm("lastContactAt", event.target.value)}
                      className="adm-input"
                    />
                  </Field>
                  <Field label="Proximo follow-up">
                    <input
                      type="date"
                      value={leadForm.nextFollowUpAt}
                      onChange={(event) => updateLeadForm("nextFollowUpAt", event.target.value)}
                      className="adm-input"
                    />
                  </Field>
                </div>

                <div className="mt-3">
                  <Field label="Tags">
                    <input
                      value={leadForm.tagsText}
                      onChange={(event) => updateLeadForm("tagsText", event.target.value)}
                      className="adm-input"
                      placeholder="premium, hatch, financiamento"
                    />
                  </Field>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5 shadow-card md:p-6">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-2xl font-black text-foreground">Observacoes</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Contexto do atendimento, objeções e proximos passos.
                    </p>
                  </div>
                  {leadFormDirty && (
                    <span className="rounded-full bg-amber-500/12 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-amber-300">
                      Alteracoes pendentes
                    </span>
                  )}
                </div>

                <textarea
                  value={leadForm.notes}
                  onChange={(event) => updateLeadForm("notes", event.target.value)}
                  className="adm-input min-h-[180px] resize-y"
                  rows={8}
                  placeholder="Registre o historico da conversa, objeções, urgencia, condicoes e proxima abordagem."
                />
              </div>
            </form>

            <div className="space-y-6">
              <div className="rounded-[1.75rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5 shadow-card md:p-6">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-2xl font-black text-foreground">Carro de interesse</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Veiculo atualmente associado ao lead.
                    </p>
                  </div>
                  <Car className="h-5 w-5 text-primary" />
                </div>

                {profile.lead.interestVehicle ? (
                  <div className="rounded-[1.35rem] border border-white/8 bg-background/45 p-4">
                    <p className="text-lg font-black text-foreground">
                      {profile.lead.interestVehicle.name}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {linkedVehicle
                        ? "Veiculo localizado no catalogo da DM Motors."
                        : "Veiculo vinculado somente dentro do CRM."}
                    </p>

                    {linkedVehicle && (
                      <Link
                        to="/veiculo/$carId"
                        params={{ carId: linkedVehicle.id }}
                        className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-primary transition hover:brightness-110"
                      >
                        Abrir pagina do veiculo
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                ) : (
                  <EmptyState
                    title="Sem carro vinculado"
                    description="Vincule um veiculo no perfil para orientar as propostas."
                    compact
                  />
                )}
              </div>

              <div className="rounded-[1.75rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5 shadow-card md:p-6">
                <div className="mb-4">
                  <h3 className="text-2xl font-black text-foreground">Status da negociacao</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Resumo rapido do momento comercial deste lead.
                  </p>
                </div>

                <div className="space-y-3 text-sm">
                  <StatusRow label="Etapa atual" value={getLeadStageLabel(profile.status.stage)} />
                  <StatusRow
                    label="Prioridade"
                    value={getLeadPriorityLabel(profile.status.priority)}
                  />
                  <StatusRow
                    label="Proposta atual"
                    value={profile.status.currentProposalTitle || "Nenhuma proposta ativa"}
                  />
                  <StatusRow
                    label="Etapa da proposta"
                    value={getDealStageLabel(profile.status.currentProposalStage)}
                  />
                  <StatusRow
                    label="Propostas abertas"
                    value={String(profile.status.openProposalsCount)}
                  />
                  <StatusRow
                    label="Ganhos / perdidos"
                    value={`${profile.status.wonProposalsCount} / ${profile.status.lostProposalsCount}`}
                  />
                  <StatusRow
                    label="Pipeline em aberto"
                    value={formatCurrency(profile.status.pipelineValue)}
                  />
                  <StatusRow
                    label="Valor ganho"
                    value={formatCurrency(profile.status.closedValue)}
                  />
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5 shadow-card md:p-6">
                <div className="mb-4">
                  <h3 className="text-2xl font-black text-foreground">Contato</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Dados basicos para o time seguir o atendimento.
                  </p>
                </div>

                <div className="space-y-3">
                  <QuickInfo icon={<Phone className="h-4 w-4" />} text={profile.lead.phone || "Sem telefone"} />
                  <QuickInfo icon={<Mail className="h-4 w-4" />} text={profile.lead.email || "Sem e-mail"} />
                  <QuickInfo
                    icon={<UserRound className="h-4 w-4" />}
                    text={profile.lead.assignedTo || "Sem responsavel definido"}
                  />
                  <QuickInfo
                    icon={<CalendarClock className="h-4 w-4" />}
                    text={`Follow-up: ${formatShortDate(profile.lead.nextFollowUpAt)}`}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_380px]">
            <div className="rounded-[1.75rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5 shadow-card md:p-6">
              <div className="mb-4">
                <h3 className="text-2xl font-black text-foreground">Historico de atendimento</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Timeline com criacao do lead, follow-ups, tarefas e propostas.
                </p>
              </div>

              {profile.history.length ? (
                <div className="space-y-3">
                  {profile.history.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-[1.35rem] border border-white/8 bg-background/45 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${getHistoryTone(item.type)}`}
                        >
                          <Clock3 className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-foreground">{item.title}</p>
                              {item.description && (
                                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                                  {item.description}
                                </p>
                              )}
                            </div>
                            <span className="rounded-full bg-white/6 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                              {formatLongDate(item.date)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="Sem historico consolidado"
                  description="As interacoes deste lead vao aparecer aqui."
                />
              )}
            </div>

            <aside className="rounded-[1.75rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5 shadow-card md:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-2xl font-black text-foreground">Tarefas pendentes</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Proximas acoes do atendimento deste lead.
                  </p>
                </div>
                <span className="rounded-full bg-primary/12 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
                  {pendingTasks.length}
                </span>
              </div>

              {pendingTasks.length ? (
                <div className="space-y-3">
                  {pendingTasks.map((task) => (
                    <article
                      key={task.id}
                      className="rounded-[1.35rem] border border-white/8 bg-background/45 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-foreground">{task.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {task.deal?.name || "Sem proposta vinculada"}
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

                      {task.description && (
                        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                          {task.description}
                        </p>
                      )}

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
                        <span>Prioridade: {getTaskPriorityLabel(task.priority)}</span>
                        <span>Status: {getTaskStatusLabel(task.status)}</span>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="Nada pendente"
                  description="Nao ha tarefas abertas para este lead."
                  compact
                />
              )}
            </aside>
          </section>

          <section className="rounded-[1.75rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5 shadow-card md:p-6">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 className="text-2xl font-black text-foreground">Propostas</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Negocios vinculados a este lead, com etapa, valor e previsao.
                </p>
              </div>
              <span className="rounded-full bg-emerald-500/12 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-400">
                {profile.proposals.length} registrada(s)
              </span>
            </div>

            {profile.proposals.length ? (
              <div className="grid gap-4 xl:grid-cols-2">
                {profile.proposals.map((proposal) => (
                  <article
                    key={proposal.id}
                    className="rounded-[1.35rem] border border-white/8 bg-background/45 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-lg font-black text-foreground">
                          {proposal.title}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {proposal.vehicle?.name || "Sem veiculo"} ·{" "}
                          {proposal.owner || "Sem responsavel"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleDeleteProposal(proposal)}
                        className="text-muted-foreground transition hover:text-red-400"
                        aria-label="Remover proposta"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <p className="mt-3 text-3xl font-black tracking-tight text-primary">
                      {formatCurrency(proposal.value)}
                    </p>

                    <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px]">
                      <select
                        value={proposal.stage}
                        onChange={(event) =>
                          void handleProposalStageChange(
                            proposal,
                            event.target.value as DealStage,
                          )
                        }
                        className="adm-input bg-card"
                      >
                        {DEAL_STAGE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <div className="rounded-[1.35rem] border border-white/8 bg-card px-4 py-3 text-sm text-muted-foreground">
                        {proposal.probability}% de chance
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>Fecha: {formatShortDate(proposal.expectedCloseDate)}</span>
                      <span>Etapa: {getDealStageLabel(proposal.stage)}</span>
                    </div>

                    {proposal.notes && (
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        {proposal.notes}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Nenhuma proposta vinculada"
                description="Crie a primeira proposta para acompanhar a negociacao."
              />
            )}
          </section>
        </>
      ) : (
        <EmptyState
          title="Lead nao encontrado"
          description="Volte para a lista e tente abrir outro cadastro."
        />
      )}

      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-hidden border-border bg-card text-foreground sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Nova tarefa do lead</DialogTitle>
            <DialogDescription>
              Registre o proximo follow-up sem sair do perfil.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateTask} className="max-h-[calc(90vh-8.5rem)] space-y-4 overflow-y-auto pr-1">
            <Field label="Titulo">
              <input
                value={taskForm.title ?? ""}
                onChange={(event) =>
                  setTaskForm((current) => ({ ...current, title: event.target.value }))
                }
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

            <Field label="Responsavel">
              <input
                value={taskForm.assignedTo ?? ""}
                onChange={(event) =>
                  setTaskForm((current) => ({ ...current, assignedTo: event.target.value }))
                }
                className="adm-input"
              />
            </Field>

            <Field label="Descricao">
              <textarea
                value={taskForm.description ?? ""}
                onChange={(event) =>
                  setTaskForm((current) => ({ ...current, description: event.target.value }))
                }
                className="adm-input min-h-[120px] resize-y"
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

      <Dialog open={proposalDialogOpen} onOpenChange={setProposalDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-hidden border-border bg-card text-foreground sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Nova proposta</DialogTitle>
            <DialogDescription>
              Crie um negocio vinculado ao lead atual.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateProposal} className="max-h-[calc(90vh-8.5rem)] space-y-4 overflow-y-auto pr-1">
            <Field label="Titulo">
              <input
                value={proposalForm.title ?? ""}
                onChange={(event) =>
                  setProposalForm((current) => ({ ...current, title: event.target.value }))
                }
                className="adm-input"
                required
              />
            </Field>

            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Etapa">
                <select
                  value={proposalForm.stage ?? "proposta"}
                  onChange={(event) =>
                    setProposalForm((current) => ({
                      ...current,
                      stage: event.target.value as DealStage,
                    }))
                  }
                  className="adm-input"
                >
                  {DEAL_STAGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Valor">
                <input
                  type="number"
                  value={proposalForm.value ?? 0}
                  onChange={(event) =>
                    setProposalForm((current) => ({
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
                  value={proposalForm.probability ?? 0}
                  onChange={(event) =>
                    setProposalForm((current) => ({
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
              <Field label="Responsavel">
                <input
                  value={proposalForm.owner ?? ""}
                  onChange={(event) =>
                    setProposalForm((current) => ({ ...current, owner: event.target.value }))
                  }
                  className="adm-input"
                />
              </Field>
              <Field label="Previsao de fechamento">
                <input
                  type="date"
                  value={proposalForm.expectedCloseDate ?? ""}
                  onChange={(event) =>
                    setProposalForm((current) => ({
                      ...current,
                      expectedCloseDate: event.target.value,
                    }))
                  }
                  className="adm-input"
                />
              </Field>
            </div>

            <Field label="Veiculo">
              <select
                value={proposalForm.vehicleId ?? ""}
                onChange={(event) =>
                  setProposalForm((current) => ({ ...current, vehicleId: event.target.value }))
                }
                className="adm-input"
              >
                <option value="">Sem vinculo</option>
                {cars.map((car) => (
                  <option key={car.id} value={car.id}>
                    {car.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Observacoes">
              <textarea
                value={proposalForm.notes ?? ""}
                onChange={(event) =>
                  setProposalForm((current) => ({ ...current, notes: event.target.value }))
                }
                className="adm-input min-h-[120px] resize-y"
                rows={5}
              />
            </Field>

            <DialogFooter>
              <button
                type="button"
                onClick={() => setProposalDialogOpen(false)}
                className="rounded-lg border border-border px-4 py-2.5 text-sm font-bold text-foreground transition hover:bg-secondary"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submittingProposal}
                className="rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-red transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submittingProposal ? "Salvando..." : "Criar proposta"}
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
  icon: ReactNode;
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
      <p className="mt-1 text-3xl font-black tracking-tight text-foreground">{value}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{hint}</p>
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-[1.35rem] border border-white/8 bg-background/45 px-4 py-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-semibold text-foreground">{value}</span>
    </div>
  );
}

function QuickInfo({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[1.35rem] border border-white/8 bg-background/45 px-4 py-3 text-sm text-foreground">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/8 bg-white/8 text-muted-foreground">
        {icon}
      </span>
      <span className="min-w-0 truncate">{text}</span>
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

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
