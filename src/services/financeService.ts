import { apiFetch, isApiConfigured } from "./apiClient";
import type {
  CreateFinanceEntryInput,
  CreateFinanceSaleInput,
  FinanceSaleBackfillImportResult,
  FinanceSaleBackfillPreview,
  FinanceOverview,
  FinanceMovement,
} from "@/types/finance";

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export function createEmptyFinanceOverview(month = getCurrentMonth()): FinanceOverview {
  return {
    month,
    totals: {
      revenue: 0,
      expenses: 0,
      profit: 0,
      cash: 0,
      salesCount: 0,
      expenseCount: 0,
      entriesCount: 0,
    },
    movements: [],
    byCategory: [],
    byVehicle: [],
  };
}

export function createEmptyFinanceSaleBackfillPreview(): FinanceSaleBackfillPreview {
  return {
    totals: {
      soldCount: 0,
      existingSalesCount: 0,
      pendingCount: 0,
      skippedMissingPriceCount: 0,
    },
    candidates: [],
  };
}

function requireFinanceApi() {
  if (!isApiConfigured) {
    throw new Error("Configure a API para usar o modulo financeiro.");
  }
}

export async function getFinanceOverview(month: string): Promise<FinanceOverview> {
  if (!isApiConfigured) {
    return createEmptyFinanceOverview(month);
  }

  return apiFetch<FinanceOverview>(`/finance/overview?month=${encodeURIComponent(month)}`);
}

export async function createFinanceEntry(
  input: CreateFinanceEntryInput,
): Promise<FinanceMovement> {
  requireFinanceApi();

  return apiFetch<FinanceMovement>("/finance/entries", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function createFinanceSale(input: CreateFinanceSaleInput): Promise<FinanceMovement> {
  requireFinanceApi();

  return apiFetch<FinanceMovement>("/finance/sales", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getFinanceSaleBackfillPreview(): Promise<FinanceSaleBackfillPreview> {
  if (!isApiConfigured) {
    return createEmptyFinanceSaleBackfillPreview();
  }

  return apiFetch<FinanceSaleBackfillPreview>("/finance/backfill-sales/preview");
}

export async function importFinanceSaleBackfill(
  vehicleIds?: string[],
): Promise<FinanceSaleBackfillImportResult> {
  requireFinanceApi();

  return apiFetch<FinanceSaleBackfillImportResult>("/finance/backfill-sales", {
    method: "POST",
    body: JSON.stringify(Array.isArray(vehicleIds) && vehicleIds.length ? { vehicleIds } : {}),
  });
}

export async function deleteFinanceEntry(id: string): Promise<void> {
  requireFinanceApi();

  await apiFetch<void>(`/finance/entries/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
