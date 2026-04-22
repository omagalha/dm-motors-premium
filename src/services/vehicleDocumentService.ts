import { getStoredAdminToken } from "@/lib/adminSession";
import { apiFetch, ApiError, isApiConfigured } from "./apiClient";

export interface VehicleSaleDocumentPayload {
  vehicle: {
    id: string;
    name: string;
    brand: string;
    model: string;
    year: number;
    plate: string;
    renavam: string;
    chassis: string;
    engineNumber: string;
    color: string;
    mileage: number;
    fuel: string;
    transmission: string;
  };
  transaction: {
    salePrice: number;
    acquisitionValue: number;
    minimumSaleValue: number;
    financedValue: number;
    acquisitionDate: string;
  };
  buyer: {
    name: string;
    document: string;
  };
  previousOwner: {
    name: string;
    document: string;
  };
  documentation: {
    hasInspectionReport: boolean;
    hasPaidIpva: boolean;
    hasFines: boolean;
    hasLien: boolean;
    provenance: string;
    spareKeyCount: string;
    manualCount: string;
    legalNotes: string;
    internalNotes: string;
  };
  generatedAt: string;
}

export interface VehicleSaleContractDraft {
  title: string;
  vehicle: {
    id: string;
    name: string;
    brand: string;
    model: string;
    year: number;
    plate: string;
    renavam: string;
    chassis: string;
    engineNumber: string;
    color: string;
    mileage: number;
    fuel: string;
    transmission: string;
  };
  buyer: {
    name: string;
    document: string;
  };
  previousOwner: {
    name: string;
    document: string;
  };
  financial: {
    salePrice: number;
    acquisitionValue: number;
    minimumSaleValue: number;
    financedValue: number;
    acquisitionDate: string;
  };
  documentation: {
    hasInspectionReport: boolean;
    hasPaidIpva: boolean;
    hasFines: boolean;
    hasLien: boolean;
    provenance: string;
    spareKeyCount: string;
    manualCount: string;
    legalNotes: string;
    internalNotes: string;
  };
}

export interface VehicleDocumentReadiness {
  ready: boolean;
  missingFields: string[];
  warnings: string[];
}

export type VehicleSaleContractWorkflowNextStep =
  | "ready_for_automation"
  | "complete_required_fields"
  | "automation_requested";

export type VehicleSaleContractAutomationStatus =
  | "skipped_not_ready"
  | "skipped_not_configured"
  | "pending"
  | "trigger_failed";

export interface VehicleSaleContractWorkflowResult {
  workflow: "sale-contract";
  ready: boolean;
  validation: VehicleDocumentReadiness;
  payload: VehicleSaleDocumentPayload | null;
  draft: VehicleSaleContractDraft | null;
  nextStep: VehicleSaleContractWorkflowNextStep;
  automationTriggered: boolean;
  automationStatus: VehicleSaleContractAutomationStatus;
  automationExecutionId: string | null;
  automationProviderExecutionId: string | null;
}

export interface VehicleSaleContractWorkflowResetResult {
  message: string;
  currentExecutionId?: string | null;
}

function assertDocumentApiConfigured() {
  if (!isApiConfigured) {
    throw new ApiError("VITE_API_URL nao configurada para o fluxo documental.", 0);
  }
}

export async function getVehicleDocumentPayload(id: string): Promise<VehicleSaleDocumentPayload> {
  assertDocumentApiConfigured();

  return apiFetch<VehicleSaleDocumentPayload>(
    `/vehicles/${encodeURIComponent(id)}/document-payload`,
  );
}

export async function getVehicleDocumentReadiness(
  id: string,
): Promise<VehicleDocumentReadiness> {
  assertDocumentApiConfigured();

  return apiFetch<VehicleDocumentReadiness>(
    `/vehicles/${encodeURIComponent(id)}/document-readiness`,
  );
}

export async function startSaleContractWorkflow(
  id: string,
): Promise<VehicleSaleContractWorkflowResult> {
  assertDocumentApiConfigured();

  return apiFetch<VehicleSaleContractWorkflowResult>(
    `/vehicles/${encodeURIComponent(id)}/document-workflows/sale-contract`,
    {
      method: "POST",
      body: JSON.stringify({}),
    },
  );
}

export async function resetSaleContractWorkflow(
  id: string,
): Promise<VehicleSaleContractWorkflowResetResult> {
  assertDocumentApiConfigured();

  return apiFetch<VehicleSaleContractWorkflowResetResult>(
    `/vehicles/${encodeURIComponent(id)}/document-workflows/sale-contract/reset`,
    {
      method: "POST",
      body: JSON.stringify({}),
    },
  );
}

export async function downloadSaleContractDocument(id: string): Promise<Blob> {
  assertDocumentApiConfigured();

  const apiUrl = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");
  const token = getStoredAdminToken();

  if (!token) {
    throw new ApiError("Sessao expirada. Faca login novamente.", 401);
  }

  let response: Response;

  try {
    response = await fetch(
      `${apiUrl}/vehicles/${encodeURIComponent(id)}/document-workflows/sale-contract/download`,
      {
        method: "GET",
        headers: {
          Accept: "application/pdf",
          Authorization: `Bearer ${token}`,
        },
      },
    );
  } catch {
    throw new ApiError("Nao foi possivel conectar a API para baixar o contrato.", 0);
  }

  if (!response.ok) {
    let message = "Nao foi possivel baixar o contrato.";

    const contentType = response.headers.get("Content-Type") ?? "";
    if (contentType.includes("application/json")) {
      const payload = (await response.json().catch(() => null)) as
        | { message?: string; error?: string }
        | null;
      if (payload?.message) {
        message = payload.message;
      } else if (payload?.error) {
        message = payload.error;
      }
    }

    throw new ApiError(message, response.status);
  }

  return response.blob();
}
