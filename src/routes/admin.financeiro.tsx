import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowDownRight,
  ArrowUpRight,
  Car as CarIcon,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  History,
  Plus,
  Search,
  Trash2,
  Wallet,
} from "lucide-react";
import { useCars, type Car as VehicleCar } from "@/data/carsStore";
import {
  createFinanceEntry,
  createFinanceSale,
  createEmptyFinanceOverview,
  createEmptyFinanceSaleBackfillPreview,
  deleteFinanceEntry,
  getFinanceOverview,
  getFinanceSaleBackfillPreview,
  importFinanceSaleBackfill,
} from "@/services/financeService";
import { getContacts } from "@/services/crmService";
import { getVehicles } from "@/services/vehicleService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getStoredAdminSession } from "@/lib/adminSession";
import type {
  FinanceMovement,
  FinanceOverview,
  FinanceSaleBackfillCandidate,
  FinanceSaleBackfillPreview,
} from "@/types/finance";
import type { Contact } from "@/types/crm";

export const Route = createFileRoute("/admin/financeiro")({
  head: () => ({
    meta: [
      { title: "Financeiro Geral - Admin DM Motors" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminFinanceiroPage,
});

type ActiveDialog = "sale" | "expense" | "manual_income" | "backfill" | null;

interface SaleFormState {
  vehicleId: string;
  amount: string;
  entryDate: string;
  description: string;
  notes: string;
  buyerContactId: string;
  buyerContactName: string;
}

interface EntryFormState {
  description: string;
  amount: string;
  entryDate: string;
  category: string;
  notes: string;
  vehicleId: string;
  recurrenceKind: "single" | "installment" | "monthly";
  recurrenceTotal: string;
}

const EXPENSE_CATEGORIES = [
  "Documentação",
  "Mecânica",
  "Funilaria",
  "Estética",
  "Transporte",
  "Marketing",
  "Comissão",
  "Impostos",
  "Outros",
];

const MANUAL_INCOME_CATEGORIES = ["Entrada manual", "Reembolso", "Bônus", "Outros"];

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function getCurrentMonth() {
  return getTodayDate().slice(0, 7);
}

function getDefaultEntryDateForMonth(month: string) {
  const today = getTodayDate();
  return today.startsWith(month) ? today : `${month}-01`;
}

function shiftMonth(month: string, offset: number) {
  const [yearString, monthString] = month.split("-");
  const year = Number(yearString);
  const monthIndex = Number(monthString) - 1;

  if (!Number.isFinite(year) || !Number.isFinite(monthIndex)) {
    return getCurrentMonth();
  }

  const date = new Date(year, monthIndex + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatSignedCurrency(value: number, kind: FinanceMovement["kind"]) {
  return `${kind === "expense" ? "-" : "+"}${formatCurrency(value)}`;
}

function formatMonthLabel(month: string) {
  const [yearString, monthString] = month.split("-");
  const year = Number(yearString);
  const monthIndex = Number(monthString) - 1;

  if (!Number.isFinite(year) || !Number.isFinite(monthIndex)) {
    return month;
  }

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

function formatMargin(profit: number, revenue: number) {
  if (revenue <= 0) return "0% de margem";
  return `${Math.round((profit / revenue) * 100)}% de margem`;
}

function getBackfillInferenceLabel(candidate: FinanceSaleBackfillCandidate) {
  if (candidate.inferredFrom === "updatedAt") return "Data sugerida pela última atualização";
  if (candidate.inferredFrom === "createdAt") return "Data sugerida pela criação do cadastro";
  return "Data sugerida com fallback para hoje";
}

function getVehicleStatusLabel(status: VehicleCar["status"]) {
  if (status === "vendido") return "Vendido";
  if (status === "reservado") return "Reservado";
  return "Disponível";
}

function buildSaleForm(month: string, vehicle?: VehicleCar): SaleFormState {
  return {
    vehicleId: vehicle?.id ?? "",
    amount: vehicle ? String(vehicle.price) : "",
    entryDate: getDefaultEntryDateForMonth(month),
    description: vehicle?.name ?? "",
    notes: "",
    buyerContactId: vehicle?.internal?.buyerContactId ?? "",
    buyerContactName: vehicle?.internal?.buyerContactName || vehicle?.internal?.buyerName || "",
  };
}

function buildEntryForm(month: string, category = ""): EntryFormState {
  return {
    description: "",
    amount: "",
    entryDate: getDefaultEntryDateForMonth(month),
    category,
    notes: "",
    vehicleId: "",
    recurrenceKind: "single",
    recurrenceTotal: "12",
  };
}

function getMovementToneClasses(kind: FinanceMovement["kind"]) {
  return kind === "expense"
    ? {
        chip: "bg-red-500/12 text-red-400",
        icon: "bg-red-500/12 text-red-400",
        value: "text-red-400",
      }
    : {
        chip: "bg-emerald-500/12 text-emerald-400",
        icon: "bg-emerald-500/12 text-emerald-400",
        value: "text-emerald-400",
      };
}

function getMovementTypeLabel(type: FinanceMovement["type"]) {
  if (type === "sale") return "Venda";
  if (type === "manual_income") return "Entrada manual";
  return "Despesa";
}

function AdminFinanceiroPage() {
  const navigate = useNavigate();
  const cars = useCars();
  const [month, setMonth] = useState(getCurrentMonth);
  const [overview, setOverview] = useState<FinanceOverview>(() => createEmptyFinanceOverview(month));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backfillPreview, setBackfillPreview] = useState<FinanceSaleBackfillPreview>(
    createEmptyFinanceSaleBackfillPreview,
  );
  const [backfillLoading, setBackfillLoading] = useState(true);
  const [backfillError, setBackfillError] = useState<string | null>(null);
  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);
  const [submitting, setSubmitting] = useState<ActiveDialog>(null);
  const [saleForm, setSaleForm] = useState<SaleFormState>(() => buildSaleForm(getCurrentMonth()));
  const [buyerContactSearch, setBuyerContactSearch] = useState("");
  const [buyerContactResults, setBuyerContactResults] = useState<Contact[]>([]);
  const [buyerContactLoading, setBuyerContactLoading] = useState(false);
  const [buyerContactError, setBuyerContactError] = useState<string | null>(null);
  const [expenseForm, setExpenseForm] = useState<EntryFormState>(() =>
    buildEntryForm(getCurrentMonth(), EXPENSE_CATEGORIES[0]),
  );
  const [manualIncomeForm, setManualIncomeForm] = useState<EntryFormState>(() =>
    buildEntryForm(getCurrentMonth(), MANUAL_INCOME_CATEGORIES[0]),
  );
  const session = getStoredAdminSession();
  const canViewGeneralFinance = Boolean(session?.user.permissions.canViewGeneralFinance);

  const sortedCars = useMemo(
    () =>
      [...cars].sort((left, right) => {
        if (left.active !== right.active) return left.active ? -1 : 1;
        return left.name.localeCompare(right.name, "pt-BR");
      }),
    [cars],
  );

  const selectedSaleVehicle = sortedCars.find((car) => car.id === saleForm.vehicleId) ?? null;
  const totals = overview.totals;

  useEffect(() => {
    if (!canViewGeneralFinance) {
      toast.error("Seu usuário não possui acesso ao Financeiro Geral.");
      navigate({ to: "/admin/crm" });
    }
  }, [canViewGeneralFinance, navigate]);

  useEffect(() => {
    if (!canViewGeneralFinance) {
      return;
    }

    let cancelled = false;

    setLoading(true);
    setError(null);

    getFinanceOverview(month)
      .then((data) => {
        if (!cancelled) {
          setOverview(data);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setOverview(createEmptyFinanceOverview(month));
        setError(err instanceof Error ? err.message : "Não foi possível carregar o financeiro.");
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [canViewGeneralFinance, month]);

  useEffect(() => {
    if (saleForm.vehicleId || !sortedCars.length) return;
    setSaleForm(buildSaleForm(month, sortedCars[0]));
  }, [month, saleForm.vehicleId, sortedCars]);

  useEffect(() => {
    if (activeDialog !== "sale") {
      setBuyerContactResults([]);
      setBuyerContactLoading(false);
      setBuyerContactError(null);
      return;
    }

    const search = buyerContactSearch.trim();
    const timeoutId = window.setTimeout(() => {
      setBuyerContactLoading(true);
      setBuyerContactError(null);

      getContacts(search)
        .then((contacts) => setBuyerContactResults(contacts.slice(0, 6)))
        .catch((err) => {
          setBuyerContactResults([]);
          setBuyerContactError(
            err instanceof Error ? err.message : "Não foi possível buscar contatos.",
          );
        })
        .finally(() => setBuyerContactLoading(false));
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [activeDialog, buyerContactSearch]);

  useEffect(() => {
    if (!canViewGeneralFinance) {
      return;
    }

    let cancelled = false;

    setBackfillLoading(true);
    setBackfillError(null);

    getFinanceSaleBackfillPreview()
      .then((data) => {
        if (!cancelled) {
          setBackfillPreview(data);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setBackfillPreview(createEmptyFinanceSaleBackfillPreview());
        setBackfillError(
          err instanceof Error ? err.message : "Não foi possível carregar vendas antigas.",
        );
      })
      .finally(() => {
        if (!cancelled) {
          setBackfillLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [canViewGeneralFinance]);

  if (!canViewGeneralFinance) {
    return null;
  }

  function resetForms(nextMonth: string) {
    setExpenseForm(buildEntryForm(nextMonth, EXPENSE_CATEGORIES[0]));
    setManualIncomeForm(buildEntryForm(nextMonth, MANUAL_INCOME_CATEGORIES[0]));
    setSaleForm(buildSaleForm(nextMonth, selectedSaleVehicle ?? sortedCars[0]));
  }

  function openDialog(dialog: Exclude<ActiveDialog, null>) {
    if (dialog === "sale") {
      const nextSaleForm = buildSaleForm(month, selectedSaleVehicle ?? sortedCars[0]);
      setSaleForm(nextSaleForm);
      setBuyerContactSearch(nextSaleForm.buyerContactName);
      setBuyerContactResults([]);
      setBuyerContactError(null);
    }

    if (dialog === "expense") {
      setExpenseForm(buildEntryForm(month, EXPENSE_CATEGORIES[0]));
    }

    if (dialog === "manual_income") {
      setManualIncomeForm(buildEntryForm(month, MANUAL_INCOME_CATEGORIES[0]));
    }

    setActiveDialog(dialog);
  }

  async function reloadOverview(options?: { refreshVehicles?: boolean }) {
    const nextOverview = await getFinanceOverview(month);
    setOverview(nextOverview);

    if (options?.refreshVehicles) {
      await getVehicles();
    }
  }

  async function reloadBackfillPreview() {
    try {
      const preview = await getFinanceSaleBackfillPreview();
      setBackfillPreview(preview);
      setBackfillError(null);
    } catch (err) {
      setBackfillPreview(createEmptyFinanceSaleBackfillPreview());
      setBackfillError(
        err instanceof Error ? err.message : "Não foi possível atualizar vendas antigas.",
      );
    }
  }

  async function handleCreateSale(event: React.FormEvent) {
    event.preventDefault();

    if (!saleForm.vehicleId) {
      toast.error("Selecione um veículo para registrar a venda.");
      return;
    }

    const amount = Number(saleForm.amount);
    if (!(amount > 0)) {
      toast.error("Informe um valor de venda válido.");
      return;
    }

    setSubmitting("sale");

    try {
      await createFinanceSale({
        vehicleId: saleForm.vehicleId,
        entryDate: saleForm.entryDate,
        amount,
        description: saleForm.description.trim() || undefined,
        notes: saleForm.notes.trim() || undefined,
        buyerContactId: saleForm.buyerContactId || undefined,
        buyerContactName: saleForm.buyerContactName.trim() || undefined,
      });

      await reloadOverview({ refreshVehicles: true });
      await reloadBackfillPreview();
      setActiveDialog(null);
      toast.success("Venda registrada no financeiro.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível registrar a venda.");
    } finally {
      setSubmitting(null);
    }
  }

  async function handleCreateEntry(
    event: React.FormEvent,
    type: "expense" | "manual_income",
    form: EntryFormState,
  ) {
    event.preventDefault();

    const amount = Number(form.amount);
    if (!form.description.trim()) {
      toast.error("Preencha a descrição do lançamento.");
      return;
    }

    if (!(amount > 0)) {
      toast.error("Informe um valor válido.");
      return;
    }

    setSubmitting(type);

    try {
      const recurrenceTotal = Number(form.recurrenceTotal);
      const shouldRepeat = type === "expense" && form.recurrenceKind !== "single";

      if (shouldRepeat && (!Number.isFinite(recurrenceTotal) || recurrenceTotal < 2)) {
        toast.error("Informe pelo menos 2 meses ou parcelas.");
        setSubmitting(null);
        return;
      }

      await createFinanceEntry({
        type,
        entryDate: form.entryDate,
        description: form.description.trim(),
        category: form.category.trim() || undefined,
        amount,
        notes: form.notes.trim() || undefined,
        vehicleId: form.vehicleId || undefined,
        recurrenceKind: shouldRepeat ? form.recurrenceKind : "single",
        recurrenceTotal: shouldRepeat ? recurrenceTotal : 1,
      });

      await reloadOverview();
      setActiveDialog(null);
      toast.success(
        type === "expense" && shouldRepeat
          ? "Despesas futuras registradas."
          : type === "expense"
            ? "Despesa registrada."
            : "Entrada registrada.",
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível salvar o lançamento.");
    } finally {
      setSubmitting(null);
    }
  }

  async function handleDeleteMovement(movement: FinanceMovement) {
    const confirmed = window.confirm(
      `Remover ${getMovementTypeLabel(movement.type).toLowerCase()} de ${formatCurrency(movement.amount)}?`,
    );

    if (!confirmed) return;

    try {
      await deleteFinanceEntry(movement.id);
      await reloadOverview({ refreshVehicles: movement.type === "sale" });
      if (movement.type === "sale") {
        await reloadBackfillPreview();
      }
      toast.success("Lançamento removido.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível remover o lançamento.");
    }
  }

  async function handleImportBackfillSales() {
    setSubmitting("backfill");

    try {
      const result = await importFinanceSaleBackfill();
      await reloadOverview({ refreshVehicles: true });
      await reloadBackfillPreview();
      setActiveDialog(null);

      const skippedNotice = result.skippedCount
        ? ` ${result.skippedCount} veículo(s) ficaram de fora por estarem sem valor.`
        : "";

      toast.success(`${result.importedCount} venda(s) antiga(s) importada(s).${skippedNotice}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nao foi possivel importar vendas antigas.");
    } finally {
      setSubmitting(null);
    }
  }

  function handleSaleVehicleChange(vehicleId: string) {
    const vehicle = sortedCars.find((car) => car.id === vehicleId);
    const buyerContactName =
      vehicle?.internal?.buyerContactName || vehicle?.internal?.buyerName || "";

    setSaleForm((current) => ({
      ...current,
      vehicleId,
      amount: vehicle ? String(vehicle.price) : current.amount,
      description: vehicle?.name ?? current.description,
      buyerContactId: vehicle?.internal?.buyerContactId ?? "",
      buyerContactName,
    }));
    setBuyerContactSearch(buyerContactName);
    setBuyerContactResults([]);
  }

  function handleBuyerContactSearch(value: string) {
    setBuyerContactSearch(value);
    setSaleForm((current) => ({
      ...current,
      buyerContactId: "",
      buyerContactName: value,
    }));
  }

  function selectBuyerContact(contact: Contact) {
    setBuyerContactSearch(contact.name);
    setBuyerContactResults([]);
    setSaleForm((current) => ({
      ...current,
      buyerContactId: contact.id,
      buyerContactName: contact.name,
    }));
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary">
            Financeiro Geral
          </p>
          <h1 className="mt-1.5 text-3xl font-black tracking-tight text-foreground md:text-4xl">
            Caixa e resultado da operação
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visão administrativa da loja com vendas, despesas, lucro e saldo do período.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-card">
          <button
            type="button"
            onClick={() => {
              const nextMonth = shiftMonth(month, -1);
              setMonth(nextMonth);
              resetForms(nextMonth);
            }}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition hover:text-foreground"
            aria-label="Mês anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="min-w-[180px] px-3 text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
              Periodo
            </p>
            <p className="mt-1 text-lg font-black text-foreground">{formatMonthLabel(month)}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              const nextMonth = shiftMonth(month, 1);
              setMonth(nextMonth);
              resetForms(nextMonth);
            }}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition hover:text-foreground"
            aria-label="Próximo mês"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <FinanceKpiCard
          label="Faturamento"
          value={formatCurrency(totals.revenue)}
          subtext={`${totals.salesCount} venda${totals.salesCount === 1 ? "" : "s"}`}
          icon={<ArrowUpRight className="h-5 w-5" />}
          accent="bg-emerald-500/12 text-emerald-400"
          valueClassName="text-emerald-400"
        />
        <FinanceKpiCard
          label="Despesas"
          value={formatCurrency(totals.expenses)}
          subtext={`${totals.expenseCount} lancamento${totals.expenseCount === 1 ? "" : "s"}`}
          icon={<ArrowDownRight className="h-5 w-5" />}
          accent="bg-red-500/12 text-red-400"
        />
        <FinanceKpiCard
          label="Lucro"
          value={formatCurrency(totals.profit)}
          subtext={formatMargin(totals.profit, totals.revenue)}
          icon={<CircleDollarSign className="h-5 w-5" />}
          accent="bg-emerald-500/12 text-emerald-400"
          valueClassName={totals.profit < 0 ? "text-red-400" : "text-emerald-400"}
        />
        <FinanceKpiCard
          label="Caixa"
          value={formatCurrency(totals.cash)}
          subtext="Entradas - despesas"
          icon={<Wallet className="h-5 w-5" />}
          accent="bg-white/8 text-foreground"
        />
      </section>

      <section className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => openDialog("sale")}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-3 text-sm font-black text-white shadow-[0_18px_45px_rgba(16,185,129,0.22)] transition hover:brightness-110"
        >
          <CarIcon className="h-4 w-4" />
          Registrar venda
        </button>
        <button
          type="button"
          onClick={() => openDialog("expense")}
          className="inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/8 px-5 py-3 text-sm font-black text-red-400 transition hover:bg-red-500/12"
        >
          <ArrowDownRight className="h-4 w-4" />
          Registrar despesa
        </button>
        <button
          type="button"
          onClick={() => openDialog("manual_income")}
          className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/8 px-5 py-3 text-sm font-black text-emerald-400 transition hover:bg-emerald-500/12"
        >
          <Plus className="h-4 w-4" />
          Entrada manual
        </button>
      </section>

      {backfillPreview.totals.pendingCount > 0 && (
        <section className="rounded-3xl border border-emerald-500/25 bg-emerald-500/8 p-5 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-400">
                Importação retroativa
              </p>
              <h2 className="mt-1 text-xl font-black text-foreground">
                {backfillPreview.totals.pendingCount} venda
                {backfillPreview.totals.pendingCount === 1 ? "" : "s"} antiga
                {backfillPreview.totals.pendingCount === 1 ? "" : "s"} pronta
                {backfillPreview.totals.pendingCount === 1 ? "" : "s"} para importar
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                A sugestão usa a última atualização do veículo e cai para a criação do cadastro ou
                para hoje quando necessário.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveDialog("backfill")}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-500/35 bg-emerald-500 px-5 py-3 text-sm font-black text-white shadow-[0_18px_45px_rgba(16,185,129,0.22)] transition hover:brightness-110"
            >
              <History className="h-4 w-4" />
              Revisar importacao
            </button>
          </div>
        </section>
      )}

      {backfillPreview.totals.pendingCount === 0 &&
        backfillPreview.totals.skippedMissingPriceCount > 0 && (
          <section className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-5 shadow-card">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-200">
              Importação retroativa
            </p>
            <h2 className="mt-1 text-xl font-black text-foreground">
              {backfillPreview.totals.skippedMissingPriceCount} veículo
              {backfillPreview.totals.skippedMissingPriceCount === 1 ? "" : "s"} vendido
              {backfillPreview.totals.skippedMissingPriceCount === 1 ? "" : "s"} sem valor
            </h2>
            <p className="mt-1 text-sm text-amber-100/85">
              Para importar essas vendas antigas, primeiro preencha o valor de venda no cadastro do
              veículo.
            </p>
          </section>
        )}

      {error && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {error}
        </div>
      )}

      {backfillError && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {backfillError}
        </div>
      )}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.95fr)]">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-card md:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-foreground">
                Movimentações
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {totals.entriesCount} registro{totals.entriesCount === 1 ? "" : "s"} no mês
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
              {overview.movements.map((movement) => {
                const tone = getMovementToneClasses(movement.kind);

                return (
                  <article
                    key={movement.id}
                    className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/70 bg-background/50 px-4 py-4"
                  >
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${tone.icon}`}
                    >
                      {movement.kind === "expense" ? (
                        <ArrowDownRight className="h-5 w-5" />
                      ) : (
                        <ArrowUpRight className="h-5 w-5" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-lg font-bold text-foreground">
                          {movement.description}
                        </p>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${tone.chip}`}
                        >
                          {getMovementTypeLabel(movement.type)}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {movement.vehicle?.name ? `${movement.vehicle.name} · ` : ""}
                        {movement.category || "Sem categoria"} · {formatShortDate(movement.entryDate)}
                      </p>
                    </div>

                    <div className="ml-auto flex items-center gap-2">
                      <div className="text-right">
                        <p className={`text-xl font-black tabular-nums ${tone.value}`}>
                          {formatSignedCurrency(movement.amount, movement.kind)}
                        </p>
                        {movement.notes && (
                          <p className="max-w-[240px] truncate text-xs text-muted-foreground">
                            {movement.notes}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => void handleDeleteMovement(movement)}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition hover:border-red-500/40 hover:text-red-400"
                        aria-label="Remover lancamento"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="Nenhuma movimentação registrada"
              description="Assim que você registrar vendas, despesas ou entradas manuais, elas vão aparecer aqui."
            />
          )}
        </div>

        <div className="space-y-6">
          <SummaryBox
            title="Por categoria"
            subtitle="Categorias de despesas do mês"
            emptyTitle="Sem despesas registradas"
            emptyDescription="As categorias vão aparecer quando houver saídas no período."
            items={overview.byCategory.map((item) => ({
              id: item.category,
              label: item.category,
              value: formatCurrency(item.total),
              meta: `${item.count} lançamento${item.count === 1 ? "" : "s"}`,
            }))}
          />

          <SummaryBox
            title="Por veiculo"
            subtitle="Despesas vinculadas a veículos"
            emptyTitle="Nenhuma despesa vinculada a veículo"
            emptyDescription="Use o campo de veículo na despesa para visualizar esse agrupamento."
            items={overview.byVehicle.map((item) => ({
              id: item.vehicleId,
              label: item.vehicleName,
              value: formatCurrency(item.total),
              meta: `${item.count} despesa${item.count === 1 ? "" : "s"}`,
            }))}
          />
        </div>
      </section>

      <Dialog
        open={activeDialog === "sale"}
        onOpenChange={(open) => setActiveDialog(open ? "sale" : null)}
      >
        <DialogContent className="border-border bg-card text-foreground sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Registrar venda</DialogTitle>
            <DialogDescription>
              Cria a entrada no financeiro e marca o veículo como vendido.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSale} className="space-y-4">
            <Field label="Veiculo">
              <select
                value={saleForm.vehicleId}
                onChange={(event) => handleSaleVehicleChange(event.target.value)}
                className="adm-input"
                required
              >
                <option value="">Selecione um veículo</option>
                {sortedCars.map((car) => (
                  <option key={car.id} value={car.id}>
                    {car.name} - {getVehicleStatusLabel(car.status)}
                  </option>
                ))}
              </select>
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Data">
                <input
                  type="date"
                  value={saleForm.entryDate}
                  onChange={(event) =>
                    setSaleForm((current) => ({ ...current, entryDate: event.target.value }))
                  }
                  className="adm-input"
                  required
                />
              </Field>
              <Field label="Valor da venda">
                <input
                  type="number"
                  value={saleForm.amount}
                  onChange={(event) =>
                    setSaleForm((current) => ({ ...current, amount: event.target.value }))
                  }
                  className="adm-input"
                  min={0}
                  step="0.01"
                  required
                />
              </Field>
            </div>

            <Field label="Descrição">
              <input
                type="text"
                value={saleForm.description}
                onChange={(event) =>
                  setSaleForm((current) => ({ ...current, description: event.target.value }))
                }
                className="adm-input"
                placeholder="Ex: Hyundai Hb20 2014"
              />
            </Field>

            <section className="rounded-2xl border border-border bg-background/30 p-3">
              <Field label="Comprador">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="search"
                    value={buyerContactSearch}
                    onChange={(event) => handleBuyerContactSearch(event.target.value)}
                    className="adm-input pl-9"
                    placeholder="Busque por nome, WhatsApp, cidade ou tag"
                  />
                </div>
              </Field>

              <div className="mt-2 overflow-hidden rounded-xl border border-border bg-card">
                {buyerContactLoading ? (
                  <p className="px-3 py-2 text-xs text-muted-foreground">Buscando contatos...</p>
                ) : buyerContactError ? (
                  <p className="px-3 py-2 text-xs text-destructive">{buyerContactError}</p>
                ) : buyerContactResults.length ? (
                  buyerContactResults.map((contact) => (
                    <button
                      key={contact.id}
                      type="button"
                      onClick={() => selectBuyerContact(contact)}
                      className="block w-full border-t border-border px-3 py-2 text-left first:border-t-0 transition hover:bg-secondary/60"
                    >
                      <span className="block text-sm font-semibold text-foreground">
                        {contact.name}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {[contact.whatsapp, contact.city, contact.company]
                          .filter(Boolean)
                          .join(" - ") || "Contato sem telefone cadastrado"}
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="px-3 py-2 text-xs text-muted-foreground">
                    Nenhum contato encontrado. O nome digitado sera salvo no comprador.
                  </p>
                )}
              </div>

              {saleForm.buyerContactId && (
                <p className="mt-2 text-xs font-semibold text-emerald-400">
                  Comprador selecionado: {saleForm.buyerContactName}
                </p>
              )}
            </section>

            <Field label="Observações">
              <textarea
                value={saleForm.notes}
                onChange={(event) =>
                  setSaleForm((current) => ({ ...current, notes: event.target.value }))
                }
                className="adm-input min-h-[96px] resize-y"
                rows={4}
                placeholder="Notas internas da operação"
              />
            </Field>

            <DialogFooter>
              <button
                type="button"
                onClick={() => setActiveDialog(null)}
                className="rounded-lg border border-border px-4 py-2.5 text-sm font-bold text-foreground transition hover:bg-secondary"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting === "sale"}
                className="rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white shadow-[0_18px_45px_rgba(16,185,129,0.22)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting === "sale" ? "Salvando..." : "Registrar venda"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={activeDialog === "expense"}
        onOpenChange={(open) => setActiveDialog(open ? "expense" : null)}
      >
        <DialogContent className="border-border bg-card text-foreground sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Registrar despesa</DialogTitle>
            <DialogDescription>
              Lance gastos gerais ou vinculados a um veículo específico.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(event) => void handleCreateEntry(event, "expense", expenseForm)}
            className="space-y-4"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Descrição">
                <input
                  type="text"
                  value={expenseForm.description}
                  onChange={(event) =>
                    setExpenseForm((current) => ({ ...current, description: event.target.value }))
                  }
                  className="adm-input"
                  placeholder="Ex: Transferência, oficina, marketing"
                  required
                />
              </Field>
              <Field
                label={
                  expenseForm.recurrenceKind === "installment"
                    ? "Valor da parcela"
                    : expenseForm.recurrenceKind === "monthly"
                      ? "Valor mensal"
                      : "Valor"
                }
              >
                <input
                  type="number"
                  value={expenseForm.amount}
                  onChange={(event) =>
                    setExpenseForm((current) => ({ ...current, amount: event.target.value }))
                  }
                  className="adm-input"
                  min={0}
                  step="0.01"
                  required
                />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Data">
                <input
                  type="date"
                  value={expenseForm.entryDate}
                  onChange={(event) =>
                    setExpenseForm((current) => ({ ...current, entryDate: event.target.value }))
                  }
                  className="adm-input"
                  required
                />
              </Field>
              <Field label="Categoria">
                <input
                  type="text"
                  list="expense-categories"
                  value={expenseForm.category}
                  onChange={(event) =>
                    setExpenseForm((current) => ({ ...current, category: event.target.value }))
                  }
                  className="adm-input"
                  placeholder="Ex: Mecânica"
                />
                <datalist id="expense-categories">
                  {EXPENSE_CATEGORIES.map((item) => (
                    <option key={item} value={item} />
                  ))}
                </datalist>
              </Field>
            </div>

            <section className="rounded-2xl border border-border bg-background/30 p-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Recorrência">
                  <select
                    value={expenseForm.recurrenceKind}
                    onChange={(event) =>
                      setExpenseForm((current) => ({
                        ...current,
                        recurrenceKind: event.target.value as EntryFormState["recurrenceKind"],
                      }))
                    }
                    className="adm-input"
                  >
                    <option value="single">Despesa única</option>
                    <option value="installment">Parcelada</option>
                    <option value="monthly">Mensal fixa</option>
                  </select>
                </Field>

                {expenseForm.recurrenceKind !== "single" && (
                  <Field
                    label={expenseForm.recurrenceKind === "installment" ? "Parcelas" : "Meses"}
                  >
                    <input
                      type="number"
                      value={expenseForm.recurrenceTotal}
                      onChange={(event) =>
                        setExpenseForm((current) => ({
                          ...current,
                          recurrenceTotal: event.target.value,
                        }))
                      }
                      className="adm-input"
                      min={2}
                      max={120}
                      step={1}
                    />
                  </Field>
                )}
              </div>
              {expenseForm.recurrenceKind !== "single" && (
                <p className="mt-2 text-xs text-muted-foreground">
                  A primeira data é a escolhida acima; os próximos lançamentos entram nos meses
                  seguintes.
                </p>
              )}
            </section>

            <Field label="Veículo (opcional)">
              <select
                value={expenseForm.vehicleId}
                onChange={(event) =>
                  setExpenseForm((current) => ({ ...current, vehicleId: event.target.value }))
                }
                className="adm-input"
              >
                <option value="">Não vincular</option>
                {sortedCars.map((car) => (
                  <option key={car.id} value={car.id}>
                    {car.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Observações">
              <textarea
                value={expenseForm.notes}
                onChange={(event) =>
                  setExpenseForm((current) => ({ ...current, notes: event.target.value }))
                }
                className="adm-input min-h-[96px] resize-y"
                rows={4}
                placeholder="Detalhes internos do gasto"
              />
            </Field>

            <DialogFooter>
              <button
                type="button"
                onClick={() => setActiveDialog(null)}
                className="rounded-lg border border-border px-4 py-2.5 text-sm font-bold text-foreground transition hover:bg-secondary"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting === "expense"}
                className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm font-bold text-red-400 transition hover:bg-red-500/14 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting === "expense" ? "Salvando..." : "Registrar despesa"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={activeDialog === "manual_income"}
        onOpenChange={(open) => setActiveDialog(open ? "manual_income" : null)}
      >
        <DialogContent className="border-border bg-card text-foreground sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Entrada manual</DialogTitle>
            <DialogDescription>
              Use para receitas que não vieram de uma venda de veículo.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(event) => void handleCreateEntry(event, "manual_income", manualIncomeForm)}
            className="space-y-4"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Descrição">
                <input
                  type="text"
                  value={manualIncomeForm.description}
                  onChange={(event) =>
                    setManualIncomeForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  className="adm-input"
                  placeholder="Ex: Reembolso, sinal, ajuste"
                  required
                />
              </Field>
              <Field label="Valor">
                <input
                  type="number"
                  value={manualIncomeForm.amount}
                  onChange={(event) =>
                    setManualIncomeForm((current) => ({ ...current, amount: event.target.value }))
                  }
                  className="adm-input"
                  min={0}
                  step="0.01"
                  required
                />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Data">
                <input
                  type="date"
                  value={manualIncomeForm.entryDate}
                  onChange={(event) =>
                    setManualIncomeForm((current) => ({
                      ...current,
                      entryDate: event.target.value,
                    }))
                  }
                  className="adm-input"
                  required
                />
              </Field>
              <Field label="Categoria">
                <input
                  type="text"
                  list="manual-income-categories"
                  value={manualIncomeForm.category}
                  onChange={(event) =>
                    setManualIncomeForm((current) => ({
                      ...current,
                      category: event.target.value,
                    }))
                  }
                  className="adm-input"
                  placeholder="Ex: Entrada manual"
                />
                <datalist id="manual-income-categories">
                  {MANUAL_INCOME_CATEGORIES.map((item) => (
                    <option key={item} value={item} />
                  ))}
                </datalist>
              </Field>
            </div>

            <Field label="Observações">
              <textarea
                value={manualIncomeForm.notes}
                onChange={(event) =>
                  setManualIncomeForm((current) => ({ ...current, notes: event.target.value }))
                }
                className="adm-input min-h-[96px] resize-y"
                rows={4}
                placeholder="Informações adicionais"
              />
            </Field>

            <DialogFooter>
              <button
                type="button"
                onClick={() => setActiveDialog(null)}
                className="rounded-lg border border-border px-4 py-2.5 text-sm font-bold text-foreground transition hover:bg-secondary"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting === "manual_income"}
                className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-sm font-bold text-emerald-400 transition hover:bg-emerald-500/14 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting === "manual_income" ? "Salvando..." : "Registrar entrada"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={activeDialog === "backfill"}
        onOpenChange={(open) => setActiveDialog(open ? "backfill" : null)}
      >
        <DialogContent className="border-border bg-card text-foreground sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Importar vendas antigas</DialogTitle>
            <DialogDescription>
              Isso cria lançamentos para veículos já vendidos que ainda não entraram no
              financeiro.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <BackfillStatCard
                label="Vendidos no cadastro"
                value={String(backfillPreview.totals.soldCount)}
              />
              <BackfillStatCard
                label="Ja importados"
                value={String(backfillPreview.totals.existingSalesCount)}
              />
              <BackfillStatCard
                label="Pendentes"
                value={String(backfillPreview.totals.pendingCount)}
                tone="primary"
              />
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/40 px-4 py-3 text-sm text-muted-foreground">
              A data sugerida de cada venda é inferida pela última atualização do veículo. Se isso
              não existir, usamos a criação do cadastro e, por último, a data de hoje.
            </div>

            {backfillPreview.totals.skippedMissingPriceCount > 0 && (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                {backfillPreview.totals.skippedMissingPriceCount} veículo(s) vendido(s) ficaram
                fora desta importação por não terem valor de venda preenchido.
              </div>
            )}

            {backfillLoading ? (
              <EmptyState
                title="Carregando vendas antigas"
                description="Estamos montando a revisão antes da importação."
                compact
              />
            ) : backfillPreview.candidates.length ? (
              <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
                {backfillPreview.candidates.map((candidate) => (
                  <div
                    key={candidate.vehicleId}
                    className="rounded-2xl border border-border/70 bg-background/50 px-4 py-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-foreground">
                          {candidate.vehicleName}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatShortDate(candidate.suggestedEntryDate)} ·{" "}
                          {getBackfillInferenceLabel(candidate)}
                        </p>
                      </div>
                      <p className="text-sm font-black text-emerald-400">
                        {formatCurrency(candidate.amount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Nenhuma venda antiga pendente"
                description="Tudo que estava vendido no cadastro já possui entrada no financeiro."
                compact
              />
            )}
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={() => setActiveDialog(null)}
              className="rounded-lg border border-border px-4 py-2.5 text-sm font-bold text-foreground transition hover:bg-secondary"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={() => void handleImportBackfillSales()}
              disabled={submitting === "backfill" || !backfillPreview.candidates.length}
              className="rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white shadow-[0_18px_45px_rgba(16,185,129,0.22)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting === "backfill"
                ? "Importando..."
                : `Importar ${backfillPreview.totals.pendingCount} venda(s)`}
            </button>
          </DialogFooter>
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

function FinanceKpiCard({
  label,
  value,
  subtext,
  icon,
  accent,
  valueClassName = "text-foreground",
}: {
  label: string;
  value: string;
  subtext: string;
  icon: React.ReactNode;
  accent: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
      <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${accent}`}>
        {icon}
      </div>
      <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </p>
      <p className={`mt-1 text-4xl font-black tracking-tight ${valueClassName}`}>{value}</p>
      <p className="mt-2 text-sm text-muted-foreground">{subtext}</p>
    </div>
  );
}

function SummaryBox({
  title,
  subtitle,
  emptyTitle,
  emptyDescription,
  items,
}: {
  title: string;
  subtitle: string;
  emptyTitle: string;
  emptyDescription: string;
  items: Array<{ id: string; label: string; value: string; meta: string }>;
}) {
  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-card md:p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-black tracking-tight text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>

      {items.length ? (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-border/70 bg-background/50 px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-foreground">{item.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.meta}</p>
                </div>
                <p className="text-sm font-black text-red-400">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title={emptyTitle} description={emptyDescription} compact />
      )}
    </section>
  );
}

function BackfillStatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "primary";
}) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 ${
        tone === "primary"
          ? "border-emerald-500/30 bg-emerald-500/10"
          : "border-border/70 bg-background/50"
      }`}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-black ${tone === "primary" ? "text-emerald-400" : "text-foreground"}`}>
        {value}
      </p>
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
