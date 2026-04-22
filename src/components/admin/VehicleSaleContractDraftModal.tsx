import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type {
  VehicleDocumentReadiness,
  VehicleSaleContractWorkflowResult,
  VehicleSaleDocumentPayload,
} from "@/services/vehicleDocumentService";
import type { VehicleSaleContractWorkflowState } from "@/types/vehicle";
import { FileText, Loader2 } from "lucide-react";

export interface VehicleDocumentPayloadSummaryItem {
  label: string;
  value: string;
}

interface VehicleSaleContractDraftModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  documentNeedsSave: boolean;
  activeDocumentValidation: VehicleDocumentReadiness | null;
  activeDocumentMissingFields: string[];
  activeDocumentWarnings: string[];
  activeDocumentPayload: VehicleSaleDocumentPayload | null;
  documentPayloadPreviewLoading: boolean;
  documentPayloadSummary: VehicleDocumentPayloadSummaryItem[];
  documentWorkflowResult: VehicleSaleContractWorkflowResult | null;
  currentDocumentWorkflowState: VehicleSaleContractWorkflowState | null;
  getDocumentRequirementLabel: (path: string) => string;
}

export function VehicleSaleContractDraftModal({
  open,
  onOpenChange,
  onClose,
  documentNeedsSave,
  activeDocumentValidation,
  activeDocumentMissingFields,
  activeDocumentWarnings,
  activeDocumentPayload,
  documentPayloadPreviewLoading,
  documentPayloadSummary,
  documentWorkflowResult,
  currentDocumentWorkflowState,
  getDocumentRequirementLabel,
}: VehicleSaleContractDraftModalProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto border-border bg-card sm:max-w-xl"
      >
        <SheetHeader>
          <SheetTitle>
            {documentWorkflowResult?.draft?.title ?? "Resumo documental"}
          </SheetTitle>
          <SheetDescription>
            Status atual do fluxo de pre-contrato, com pendencias, avisos e resumo do payload
            oficial do backend.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {documentNeedsSave && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700">
              Existem alteracoes no formulario ainda nao salvas. O resumo abaixo considera apenas
              os dados persistidos no backend.
            </div>
          )}

          <section className="rounded-2xl border border-border/60 bg-background/40 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-foreground">Status</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Resultado mais recente da validacao documental e do workflow de pre-contrato.
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${
                  activeDocumentValidation?.ready
                    ? "bg-emerald-500/15 text-emerald-600"
                    : activeDocumentValidation
                      ? "bg-amber-500/15 text-amber-600"
                      : "bg-secondary text-foreground"
                }`}
              >
                {activeDocumentValidation?.ready
                  ? "Pre-contrato pronto"
                  : activeDocumentValidation
                    ? "Campos pendentes"
                    : "Status pendente"}
              </span>
            </div>

            {documentWorkflowResult ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Workflow: <span className="font-semibold text-foreground">sale-contract</span> -
                proxima etapa:{" "}
                <span className="font-semibold text-foreground">
                  {documentWorkflowResult.nextStep}
                </span>
                {" · "}automacao:{" "}
                <span className="font-semibold text-foreground">
                  {documentWorkflowResult.automationStatus}
                </span>
              </p>
            ) : null}

            {currentDocumentWorkflowState && currentDocumentWorkflowState.status !== "idle" ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Status persistido:{" "}
                <span className="font-semibold text-foreground">
                  {currentDocumentWorkflowState.status}
                </span>
                {" · "}executionId:{" "}
                <span className="font-semibold text-foreground">
                  {currentDocumentWorkflowState.executionId || "n/a"}
                </span>
              </p>
            ) : null}

            {currentDocumentWorkflowState?.errorMessage ? (
              <p className="mt-2 text-xs text-destructive">
                Erro do workflow: {currentDocumentWorkflowState.errorMessage}
              </p>
            ) : null}
          </section>

          <section className="rounded-2xl border border-border/60 bg-background/40 p-4">
            <p className="text-sm font-bold text-foreground">Campos faltantes</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {activeDocumentMissingFields.length ? (
                activeDocumentMissingFields.map((field) => (
                  <span
                    key={field}
                    className="rounded-full bg-amber-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-700"
                  >
                    {getDocumentRequirementLabel(field)}
                  </span>
                ))
              ) : (
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                  Nenhum campo pendente
                </span>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-border/60 bg-background/40 p-4">
            <p className="text-sm font-bold text-foreground">Avisos</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {activeDocumentWarnings.length ? (
                activeDocumentWarnings.map((warning) => (
                  <span
                    key={warning}
                    className="rounded-full bg-background px-3 py-1 text-[11px] font-semibold text-foreground"
                  >
                    {warning}
                  </span>
                ))
              ) : (
                <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-foreground">
                  Nenhum aviso no momento
                </span>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-border/60 bg-background/40 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-foreground">Resumo do payload</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Base consolidada que sera reutilizada por automacao, templates e PDF.
                </p>
              </div>
              {activeDocumentPayload ? (
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {new Date(activeDocumentPayload.generatedAt).toLocaleString("pt-BR")}
                </span>
              ) : null}
            </div>

            {documentPayloadPreviewLoading ? (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-border/60 bg-background px-4 py-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando payload documental...
              </div>
            ) : documentPayloadSummary.length ? (
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {documentPayloadSummary.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-border/60 bg-background px-4 py-3"
                  >
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      {item.label}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{item.value}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
                O resumo do payload ainda nao foi carregado.
              </div>
            )}
          </section>
        </div>

        <SheetFooter className="mt-6 gap-2">
          <button
            type="button"
            disabled
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground opacity-70 sm:w-auto"
          >
            <FileText className="h-4 w-4" />
            Enviar para automacao
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-bold uppercase tracking-wider text-primary-foreground shadow-red transition hover:brightness-110 sm:w-auto"
          >
            Fechar resumo
          </button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
