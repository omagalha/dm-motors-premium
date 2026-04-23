import { apiFetch, isApiConfigured } from "./apiClient";
import type {
  Deal,
  DealInput,
  Lead,
  LeadProfile,
  LeadInput,
  Task,
  TaskInput,
  VehicleFinanceEntry,
  VehicleFinanceEntryInput,
  VehicleFinanceOverview,
} from "@/types/crm";

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export function createEmptyVehicleFinanceOverview(month = getCurrentMonth()): VehicleFinanceOverview {
  return {
    month,
    totals: {
      income: 0,
      expenses: 0,
      balance: 0,
      entriesCount: 0,
    },
    movements: [],
    byCategory: [],
    byVehicle: [],
  };
}

function requireCrmApi() {
  if (!isApiConfigured) {
    throw new Error("Configure a API para usar o modulo CRM.");
  }
}

export async function getLeads(search = ""): Promise<Lead[]> {
  if (!isApiConfigured) return [];

  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  return apiFetch<Lead[]>(`/crm/leads${query}`);
}

export async function createLead(input: LeadInput): Promise<Lead> {
  requireCrmApi();
  return apiFetch<Lead>("/crm/leads", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getLeadProfile(id: string): Promise<LeadProfile> {
  requireCrmApi();
  return apiFetch<LeadProfile>(`/crm/leads/${encodeURIComponent(id)}/profile`);
}

export async function updateLead(id: string, patch: Partial<LeadInput>): Promise<Lead> {
  requireCrmApi();
  return apiFetch<Lead>(`/crm/leads/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function deleteLead(id: string): Promise<void> {
  requireCrmApi();
  await apiFetch<void>(`/crm/leads/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function getTasks(params?: {
  status?: string;
  scope?: string;
  search?: string;
}): Promise<Task[]> {
  if (!isApiConfigured) return [];

  const search = new URLSearchParams();
  if (params?.status) search.set("status", params.status);
  if (params?.scope) search.set("scope", params.scope);
  if (params?.search) search.set("search", params.search);

  const query = search.size ? `?${search.toString()}` : "";
  return apiFetch<Task[]>(`/crm/tasks${query}`);
}

export async function createTask(input: TaskInput): Promise<Task> {
  requireCrmApi();
  return apiFetch<Task>("/crm/tasks", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateTask(id: string, patch: Partial<TaskInput>): Promise<Task> {
  requireCrmApi();
  return apiFetch<Task>(`/crm/tasks/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function deleteTask(id: string): Promise<void> {
  requireCrmApi();
  await apiFetch<void>(`/crm/tasks/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function getDeals(search = ""): Promise<Deal[]> {
  if (!isApiConfigured) return [];

  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  return apiFetch<Deal[]>(`/crm/deals${query}`);
}

export async function createDeal(input: DealInput): Promise<Deal> {
  requireCrmApi();
  return apiFetch<Deal>("/crm/deals", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateDeal(id: string, patch: Partial<DealInput>): Promise<Deal> {
  requireCrmApi();
  return apiFetch<Deal>(`/crm/deals/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function deleteDeal(id: string): Promise<void> {
  requireCrmApi();
  await apiFetch<void>(`/crm/deals/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function getVehicleFinanceOverview(month: string): Promise<VehicleFinanceOverview> {
  if (!isApiConfigured) {
    return createEmptyVehicleFinanceOverview(month);
  }

  return apiFetch<VehicleFinanceOverview>(
    `/crm/vehicle-finance/overview?month=${encodeURIComponent(month)}`,
  );
}

export async function createVehicleFinanceEntry(
  input: VehicleFinanceEntryInput,
): Promise<VehicleFinanceEntry> {
  requireCrmApi();
  return apiFetch<VehicleFinanceEntry>("/crm/vehicle-finance", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateVehicleFinanceEntry(
  id: string,
  patch: Partial<VehicleFinanceEntryInput>,
): Promise<VehicleFinanceEntry> {
  requireCrmApi();
  return apiFetch<VehicleFinanceEntry>(`/crm/vehicle-finance/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function deleteVehicleFinanceEntry(id: string): Promise<void> {
  requireCrmApi();
  await apiFetch<void>(`/crm/vehicle-finance/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
