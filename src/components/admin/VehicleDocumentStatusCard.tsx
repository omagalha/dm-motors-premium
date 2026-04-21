import type {
  VehicleDocumentReadiness,
  VehicleSaleContractWorkflowResult,
} from "@/services/vehicleDocumentService";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Loader2,
  ShieldCheck,
} from "lucide-react";

export interface VehicleDocumentStatusBadge {
  done: boolean;
  doneLabel: string;
  pendingLabel: string;
}

interface VehicleDocumentStatusCardProps {
  hasPersistedVehicle: boolean;
  documentNeedsSave: boolean;
  documentServiceError: string | null;
  documentReadiness: VehicleDocumentReadiness | null;
  documentReadinessLoading: boolean;
  documentReadinessBadges: VehicleDocumentStatusBadge[];
  completedReadinessBadges: number;
  documentWorkflowLoading: boolean;
  documentWorkflowButtonState: "idle" | "loading" | "ready" | "pending";
  documentWorkflowButtonLabel: string;
  documentWorkflowResult: VehicleSaleContractWorkflowResult | null;
  isSubmitting: boolean;
  onValidate: () => void;
  onStartWorkflow: () => void;
  onOpenSummary: () => void;
}

export function VehicleDocumentStatusCard({
  hasPersistedVehicle,
  documentNeedsSave,
  documentServiceError,
  documentReadiness,
  documentReadinessLoading,
  documentReadinessBadges,
  completedReadinessBadges,
  documentWorkflowLoading,
  documentWorkflowButtonState,
  documentWorkflowButtonLabel,
  documentWorkflowResult,
  isSubmitting,
  onValidate,
  onStartWorkflow,
  onOpenSummary,
}: VehicleDocumentStatusCardProps) {
  const validateDisabled =
    !hasPersistedVehicle ||
    isSubmitting ||
    documentNeedsSave ||
    documentReadinessLoading ||
    documentWorkflowLoading;
  const workflowDisabled =
    !hasPersistedVehicle ||
    isSubmitting ||
    documentNeedsSave ||
    documentReadinessLoading ||
    documentWorkflowLoading;

  return (
    <section className="space-y-4 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background/30 to-background/10 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-foreground">Status documental</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Valide a prontidao do veiculo para contrato e monte o pre-contrato usando os dados ja
            salvos no backend.
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${
            !hasPersistedVehicle
              ? "bg-secondary text-foreground"
              : documentNeedsSave
                ? "bg-amber-500/15 text-amber-600"
                : documentReadiness?.ready
                  ? "bg-emerald-500/15 text-emerald-600"
                  : "bg-secondary text-foreground"
          }`}
        >
          {!hasPersistedVehicle
            ? "Salve para habilitar"
            : documentNeedsSave
              ? "Salve para revalidar"
              : documentReadiness?.ready
                ? "Pronto para contrato"
                : documentReadiness
                  ? `Faltam ${documentReadiness.missingFields.length} campos`
                  : "Status pendente"}
        </span>
      </div>

      {!hasPersistedVehicle && (
        <div className="rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-xs text-muted-foreground">
          Salve este veiculo primeiro para liberar a validacao documental e a geracao do
          pre-contrato.
        </div>
      )}

      {hasPersistedVehicle && documentNeedsSave && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-700">
          Existem alteracoes no formulario ainda nao salvas. A validacao e o pre-contrato
          consideram apenas os dados persistidos no backend.
        </div>
      )}

      {hasPersistedVehicle && documentServiceError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs text-destructive">
          {documentServiceError}
        </div>
      )}

      {hasPersistedVehicle && (
        <>
          {documentReadinessLoading ? (
            <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando status documental...
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-background/80 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-foreground">
                  {completedReadinessBadges}/{documentReadinessBadges.length} requisitos
                </span>
                {documentReadinessBadges.map((item) => (
                  <span
                    key={item.doneLabel}
                    className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${
                      item.done
                        ? "bg-emerald-500/15 text-emerald-600"
                        : "bg-amber-500/15 text-amber-600"
                    }`}
                  >
                    {item.done ? item.doneLabel : item.pendingLabel}
                  </span>
                ))}
              </div>

              {documentReadiness?.warnings?.length ? (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700">
                    <AlertTriangle className="h-4 w-4" />
                    Avisos operacionais
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {documentReadiness.warnings.map((warning) => (
                      <span
                        key={warning}
                        className="rounded-full bg-background/80 px-3 py-1 text-[11px] font-semibold text-foreground"
                      >
                        {warning}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onValidate}
              disabled={validateDisabled}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-xs font-bold uppercase tracking-wider text-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {documentReadinessLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              Validar documentacao
            </button>
            <button
              type="button"
              onClick={onStartWorkflow}
              disabled={workflowDisabled}
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider transition disabled:cursor-not-allowed disabled:opacity-60 ${
                documentWorkflowButtonState === "ready"
                  ? "bg-emerald-600 text-white shadow-card hover:brightness-110"
                  : documentWorkflowButtonState === "pending"
                    ? "bg-amber-500/15 text-amber-700 ring-1 ring-amber-500/30 hover:bg-amber-500/20"
                    : "bg-primary text-primary-foreground shadow-red hover:brightness-110"
              }`}
            >
              {documentWorkflowButtonState === "loading" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : documentWorkflowButtonState === "ready" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : documentWorkflowButtonState === "pending" ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              {documentWorkflowButtonLabel}
            </button>
          </div>

          {documentWorkflowResult && !documentNeedsSave && (
            <div
              className={`rounded-xl border px-4 py-3 ${
                documentWorkflowResult.validation.ready
                  ? "border-emerald-500/30 bg-emerald-500/10"
                  : "border-amber-500/30 bg-amber-500/10"
              }`}
            >
              <p
                className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${
                  documentWorkflowResult.validation.ready
                    ? "text-emerald-700"
                    : "text-amber-700"
                }`}
              >
                {documentWorkflowResult.validation.ready ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
                {documentWorkflowResult.validation.ready
                  ? "Pre-contrato pronto"
                  : "Campos pendentes"}
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {documentWorkflowResult.validation.ready
                  ? "O backend ja montou a base documental e ela esta pronta para a futura automacao."
                  : `Ainda faltam ${documentWorkflowResult.validation.missingFields.length} campo(s) obrigatorio(s) para seguir com o contrato.`}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Proxima etapa: {documentWorkflowResult.nextStep}
              </p>
              {documentWorkflowResult.payload ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  {documentWorkflowResult.payload.vehicle.name} - gerado em{" "}
                  {new Date(documentWorkflowResult.payload.generatedAt).toLocaleString("pt-BR")}
                </p>
              ) : null}
              <button
                type="button"
                onClick={onOpenSummary}
                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-border bg-background/80 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-foreground transition hover:border-primary hover:text-primary"
              >
                <FileText className="h-4 w-4" />
                Abrir resumo documental
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
