import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type {
  VehicleDocumentReadiness,
  VehicleSaleContractWorkflowResult,
} from "@/services/vehicleDocumentService";
import { downloadSaleContractDocument } from "@/services/vehicleDocumentService";
import type { VehicleSaleContractWorkflowState } from "@/types/vehicle";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Loader2,
  RotateCcw,
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
  documentWorkflowButtonState: "idle" | "loading" | "completed" | "failed" | "blocked" | "pending";
  documentWorkflowButtonLabel: string;
  documentWorkflowResult: VehicleSaleContractWorkflowResult | null;
  currentDocumentWorkflowState: VehicleSaleContractWorkflowState | null;
  vehicleId?: string | null;
  contractDownloadFileName?: string;
  isSubmitting: boolean;
  canResetWorkflow: boolean;
  isResettingWorkflow: boolean;
  onValidate: () => void;
  onStartWorkflow: () => void;
  onOpenSummary: () => void;
  onResetWorkflow: () => void;
}

function formatDocumentGeneratedAt(value: string | null | undefined) {
  if (!value) {
    return "Data indisponível";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "Data indisponível";
  }

  return parsed.toLocaleString("pt-BR");
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
  currentDocumentWorkflowState,
  vehicleId,
  contractDownloadFileName,
  isSubmitting,
  canResetWorkflow,
  isResettingWorkflow,
  onValidate,
  onStartWorkflow,
  onOpenSummary,
  onResetWorkflow,
}: VehicleDocumentStatusCardProps) {
  const [isDownloadingContract, setIsDownloadingContract] = useState(false);
  const currentWorkflowStatus = currentDocumentWorkflowState?.status ?? "idle";
  const contractUrl = currentDocumentWorkflowState?.documentUrl?.trim() ?? "";
  const resolvedContractFileName = contractDownloadFileName?.trim() || "contrato.pdf";
  const showPersistedWorkflowStatus = currentWorkflowStatus !== "idle";
  const contractStatusLabel =
    currentWorkflowStatus === "completed"
      ? "Contrato pronto"
      : currentWorkflowStatus === "pending"
        ? "Gerando contrato..."
        : currentWorkflowStatus === "failed"
          ? "Erro ao gerar contrato"
          : currentWorkflowStatus === "cancelled"
            ? "Cancelado"
            : "Não gerado";
  const validateDisabled =
    !hasPersistedVehicle ||
    isSubmitting ||
    isResettingWorkflow ||
    documentNeedsSave ||
    documentReadinessLoading ||
    documentWorkflowLoading;
  const workflowDisabled =
    !hasPersistedVehicle ||
    isSubmitting ||
    isResettingWorkflow ||
    documentNeedsSave ||
    documentReadinessLoading ||
    documentWorkflowLoading;

  async function handleDownloadContract() {
    if (!vehicleId || !contractUrl || isDownloadingContract) {
      return;
    }

    try {
      setIsDownloadingContract(true);

      const blob = await downloadSaleContractDocument(vehicleId);
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = resolvedContractFileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
    } catch (error) {
      console.error(error);
      toast.error("Nao foi possivel baixar o contrato.");
    } finally {
      setIsDownloadingContract(false);
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background/30 to-background/10 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-foreground">Status documental</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Valide a prontidão do veículo para contrato e monte o pré-contrato usando os dados já
            salvos no backend.
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${
            !hasPersistedVehicle
              ? "bg-secondary text-foreground"
              : currentWorkflowStatus === "completed"
                ? "bg-emerald-500/15 text-emerald-600"
                : currentWorkflowStatus === "failed"
                  ? "bg-destructive/10 text-destructive"
                  : currentWorkflowStatus === "cancelled"
                    ? "bg-secondary text-foreground"
                  : currentWorkflowStatus === "pending"
                    ? "bg-amber-500/15 text-amber-600"
              : documentNeedsSave
                ? "bg-amber-500/15 text-amber-600"
                : documentReadiness?.ready
                  ? "bg-emerald-500/15 text-emerald-600"
                  : "bg-secondary text-foreground"
          }`}
        >
          {!hasPersistedVehicle
            ? "Salve para habilitar"
            : currentWorkflowStatus === "completed"
              ? "Workflow concluído"
              : currentWorkflowStatus === "failed"
                ? "Workflow falhou"
                : currentWorkflowStatus === "cancelled"
                  ? "Workflow cancelado"
                : currentWorkflowStatus === "pending"
                  ? "Automação pendente"
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
          Salve este veículo primeiro para liberar a validação documental e a geração do
          pré-contrato.
        </div>
      )}

      {hasPersistedVehicle && documentNeedsSave && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-700">
          Existem alterações no formulário ainda não salvas. A validação e o pré-contrato
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
              Validar documentação
            </button>
            <button
              type="button"
              onClick={onStartWorkflow}
              disabled={workflowDisabled}
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider transition disabled:cursor-not-allowed disabled:opacity-60 ${
                documentWorkflowButtonState === "completed"
                  ? "bg-emerald-600 text-white shadow-card hover:brightness-110"
                : documentWorkflowButtonState === "pending"
                    ? "bg-amber-500/15 text-amber-700 ring-1 ring-amber-500/30 hover:bg-amber-500/20"
                  : documentWorkflowButtonState === "failed"
                    ? "bg-destructive/10 text-destructive ring-1 ring-destructive/30 hover:bg-destructive/15"
                  : documentWorkflowButtonState === "blocked"
                      ? "bg-secondary text-foreground ring-1 ring-border hover:bg-secondary/80"
                      : "bg-primary text-primary-foreground shadow-red hover:brightness-110"
              }`}
            >
              {documentWorkflowButtonState === "loading" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : documentWorkflowButtonState === "completed" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : documentWorkflowButtonState === "pending" ? (
                <AlertTriangle className="h-4 w-4" />
              ) : documentWorkflowButtonState === "failed" ? (
                <AlertTriangle className="h-4 w-4" />
              ) : documentWorkflowButtonState === "blocked" ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              {documentWorkflowButtonLabel}
            </button>
          </div>

          {(documentWorkflowResult || showPersistedWorkflowStatus) && !documentNeedsSave && (
            <div
              className={`rounded-xl border px-4 py-3 ${
                currentWorkflowStatus === "completed"
                  ? "border-emerald-500/30 bg-emerald-500/10"
                  : currentWorkflowStatus === "failed"
                    ? "border-destructive/30 bg-destructive/10"
                    : currentWorkflowStatus === "cancelled"
                      ? "border-border/60 bg-background/60"
                    : currentWorkflowStatus === "pending"
                      ? "border-amber-500/30 bg-amber-500/10"
                : documentWorkflowResult?.validation.ready
                  ? "border-emerald-500/30 bg-emerald-500/10"
                  : "border-amber-500/30 bg-amber-500/10"
              }`}
            >
              <p
                className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${
                  currentWorkflowStatus === "completed"
                    ? "text-emerald-700"
                    : currentWorkflowStatus === "failed"
                      ? "text-destructive"
                      : currentWorkflowStatus === "cancelled"
                        ? "text-foreground"
                      : currentWorkflowStatus === "pending"
                        ? "text-amber-700"
                  : documentWorkflowResult?.validation.ready
                    ? "text-emerald-700"
                    : "text-amber-700"
                }`}
              >
                {currentWorkflowStatus === "completed" ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : currentWorkflowStatus === "failed" ||
                  currentWorkflowStatus === "pending" ||
                  currentWorkflowStatus === "cancelled" ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : documentWorkflowResult?.validation.ready ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
                {currentWorkflowStatus === "completed"
                  ? "Workflow concluído"
                  : currentWorkflowStatus === "failed"
                    ? "Workflow falhou"
                    : currentWorkflowStatus === "cancelled"
                      ? "Workflow cancelado"
                    : currentWorkflowStatus === "pending"
                      ? "Workflow pendente"
                : documentWorkflowResult?.validation.ready
                  ? "Pré-contrato pronto"
                  : "Campos pendentes"}
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {currentWorkflowStatus === "completed"
                  ? "O callback do n8n confirmou a conclusão do workflow no backend."
                  : currentWorkflowStatus === "failed"
                    ? currentDocumentWorkflowState?.errorMessage ||
                      "O callback do n8n confirmou falha na automação."
                    : currentWorkflowStatus === "cancelled"
                      ? currentDocumentWorkflowState?.errorMessage ||
                        "O workflow foi cancelado manualmente e pode ser gerado novamente."
                    : currentWorkflowStatus === "pending"
                      ? "O backend solicitou a automação e aguarda o callback do n8n."
                : documentWorkflowResult?.validation.ready
                  ? documentWorkflowResult.automationStatus === "pending"
                    ? "O backend já montou a base documental e a automação no n8n foi solicitada."
                    : documentWorkflowResult.automationStatus === "trigger_failed"
                      ? "O backend montou a base documental, mas a chamada para o n8n falhou."
                      : documentWorkflowResult.automationStatus === "skipped_not_configured"
                        ? "O backend montou a base documental, mas a automação está desativada por configuração."
                        : "O backend já montou a base documental e ela está pronta para a futura automação."
                  : `Ainda faltam ${documentWorkflowResult?.validation.missingFields.length ?? 0} campo(s) obrigatório(s) para seguir com o contrato.`}
              </p>
              {documentWorkflowResult ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Próxima etapa: {documentWorkflowResult.nextStep}
                </p>
              ) : null}
              <p className="mt-2 text-xs text-muted-foreground">
                Status do contrato: {contractStatusLabel}
              </p>
              {currentDocumentWorkflowState?.executionId ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Execução confirmada: {currentDocumentWorkflowState.executionId}
                  {currentDocumentWorkflowState.providerExecutionId
                    ? ` - n8n: ${currentDocumentWorkflowState.providerExecutionId}`
                    : ""}
                </p>
              ) : documentWorkflowResult?.automationExecutionId ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Execução solicitada: {documentWorkflowResult.automationExecutionId}
                  {documentWorkflowResult.automationProviderExecutionId
                    ? ` - n8n: ${documentWorkflowResult.automationProviderExecutionId}`
                    : ""}
                </p>
              ) : null}
              {contractUrl ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Documento pronto para download.
                </p>
              ) : null}
              {documentWorkflowResult?.payload ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  {documentWorkflowResult.payload.vehicle.name} - gerado em{" "}
                  {formatDocumentGeneratedAt(documentWorkflowResult.payload.generatedAt)}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                {currentWorkflowStatus === "completed" && contractUrl ? (
                  <button
                    type="button"
                    onClick={() => void handleDownloadContract()}
                    disabled={isDownloadingContract}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-white transition hover:brightness-110"
                  >
                    {isDownloadingContract ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                    {isDownloadingContract ? "Baixando..." : "Baixar contrato"}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={onOpenSummary}
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-background/80 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-foreground transition hover:border-primary hover:text-primary"
                >
                  <FileText className="h-4 w-4" />
                  Abrir resumo documental
                </button>

                {canResetWorkflow ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        type="button"
                        disabled={isResettingWorkflow}
                        className="inline-flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-destructive transition hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isResettingWorkflow ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RotateCcw className="h-4 w-4" />
                        )}
                        Resetar workflow
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Resetar workflow?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Isso cancela o workflow atual deste veículo e libera uma nova geração do
                          pré-contrato.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Voltar</AlertDialogCancel>
                        <AlertDialogAction onClick={onResetWorkflow}>
                          Confirmar reset
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : null}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
