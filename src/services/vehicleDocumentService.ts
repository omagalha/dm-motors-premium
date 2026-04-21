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
  vehicleId: string;
  workflow: "sale-contract";
  generatedAt: string;
  parties: {
    buyer: {
      name: string;
      document: string;
    };
    seller: {
      name: string;
      document: string;
    };
  };
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
  | "complete_required_fields";

export interface VehicleSaleContractWorkflowResult {
  workflow: "sale-contract";
  ready: boolean;
  validation: VehicleDocumentReadiness;
  payload: VehicleSaleDocumentPayload | null;
  draft: VehicleSaleContractDraft | null;
  nextStep: VehicleSaleContractWorkflowNextStep;
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
