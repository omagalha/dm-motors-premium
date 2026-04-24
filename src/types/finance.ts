export type FinanceEntryKind = "income" | "expense";
export type FinanceEntryType = "sale" | "expense" | "manual_income";
export type FinanceEntrySource = "manual" | "vehicle_sale";

export interface FinanceMovement {
  id: string;
  kind: FinanceEntryKind;
  type: FinanceEntryType;
  entryDate: string;
  description: string;
  category: string;
  amount: number;
  notes: string;
  source: FinanceEntrySource;
  vehicle: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceCategorySummary {
  category: string;
  total: number;
  count: number;
}

export interface FinanceVehicleSummary {
  vehicleId: string;
  vehicleName: string;
  total: number;
  count: number;
}

export interface FinanceOverview {
  month: string;
  totals: {
    revenue: number;
    expenses: number;
    profit: number;
    cash: number;
    salesCount: number;
    expenseCount: number;
    entriesCount: number;
  };
  movements: FinanceMovement[];
  byCategory: FinanceCategorySummary[];
  byVehicle: FinanceVehicleSummary[];
}

export interface FinanceSaleBackfillCandidate {
  vehicleId: string;
  vehicleName: string;
  amount: number;
  suggestedEntryDate: string;
  inferredFrom: "updatedAt" | "createdAt" | "today";
  createdAt: string;
  updatedAt: string;
}

export interface FinanceSaleBackfillPreview {
  totals: {
    soldCount: number;
    existingSalesCount: number;
    pendingCount: number;
    skippedMissingPriceCount: number;
  };
  candidates: FinanceSaleBackfillCandidate[];
}

export interface FinanceSaleBackfillImportResult {
  importedCount: number;
  skippedCount: number;
  imported: FinanceMovement[];
}

export interface CreateFinanceEntryInput {
  type: "expense" | "manual_income";
  entryDate: string;
  description: string;
  category?: string;
  amount: number;
  notes?: string;
  vehicleId?: string;
}

export interface CreateFinanceSaleInput {
  vehicleId: string;
  entryDate: string;
  amount: number;
  description?: string;
  category?: string;
  notes?: string;
  buyerContactId?: string;
  buyerContactName?: string;
}
