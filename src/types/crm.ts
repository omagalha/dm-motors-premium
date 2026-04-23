export type LeadStage =
  | "novo"
  | "em_contato"
  | "qualificado"
  | "proposta"
  | "negociacao"
  | "convertido"
  | "perdido";

export type LeadPriority = "low" | "medium" | "high";

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  source: string;
  stage: LeadStage;
  priority: LeadPriority;
  assignedTo: string;
  budget: number;
  tags: string[];
  notes: string;
  lastContactAt: string;
  nextFollowUpAt: string;
  interestVehicle: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeadHistoryItem {
  id: string;
  type:
    | "lead_created"
    | "contact_logged"
    | "follow_up_scheduled"
    | "task_created"
    | "task_completed"
    | "proposal_created"
    | "proposal_closed";
  date: string;
  title: string;
  description: string;
  relatedType: "lead" | "task" | "proposal";
  relatedId: string;
}

export type TaskStatus = "todo" | "in_progress" | "done" | "cancelled";
export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  completedAt: string;
  assignedTo: string;
  lead: {
    id: string;
    name: string;
  } | null;
  deal: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export type DealStage =
  | "novo"
  | "qualificacao"
  | "proposta"
  | "negociacao"
  | "fechado_ganho"
  | "fechado_perdido";

export interface Deal {
  id: string;
  title: string;
  stage: DealStage;
  value: number;
  probability: number;
  expectedCloseDate: string;
  closedAt: string;
  owner: string;
  source: string;
  notes: string;
  lostReason: string;
  lead: {
    id: string;
    name: string;
  } | null;
  vehicle: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeadProfile {
  lead: Lead;
  tasks: Task[];
  proposals: Deal[];
  history: LeadHistoryItem[];
  status: {
    stage: LeadStage;
    priority: LeadPriority;
    openTasksCount: number;
    overdueTasksCount: number;
    totalProposalsCount: number;
    openProposalsCount: number;
    wonProposalsCount: number;
    lostProposalsCount: number;
    pipelineValue: number;
    closedValue: number;
    currentProposalTitle: string;
    currentProposalStage: DealStage | "";
  };
}

export type VehicleFinanceKind = "income" | "expense";

export interface VehicleFinanceEntry {
  id: string;
  kind: VehicleFinanceKind;
  category: string;
  amount: number;
  entryDate: string;
  description: string;
  notes: string;
  source: string;
  vehicle: {
    id: string;
    name: string;
  } | null;
  deal: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleFinanceOverview {
  month: string;
  totals: {
    income: number;
    expenses: number;
    balance: number;
    entriesCount: number;
  };
  movements: VehicleFinanceEntry[];
  byCategory: Array<{
    category: string;
    income: number;
    expenses: number;
  }>;
  byVehicle: Array<{
    vehicleId: string;
    vehicleName: string;
    income: number;
    expenses: number;
  }>;
}

export interface LeadInput {
  name: string;
  phone?: string;
  email?: string;
  source?: string;
  stage?: LeadStage;
  priority?: LeadPriority;
  assignedTo?: string;
  budget?: number;
  tags?: string[] | string;
  notes?: string;
  lastContactAt?: string;
  nextFollowUpAt?: string;
  interestVehicleId?: string;
}

export interface TaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  assignedTo?: string;
  leadId?: string;
  dealId?: string;
}

export interface DealInput {
  title: string;
  stage?: DealStage;
  value?: number;
  probability?: number;
  expectedCloseDate?: string;
  owner?: string;
  source?: string;
  notes?: string;
  lostReason?: string;
  leadId?: string;
  vehicleId?: string;
}

export interface VehicleFinanceEntryInput {
  kind: VehicleFinanceKind;
  category?: string;
  amount: number;
  entryDate: string;
  description: string;
  notes?: string;
  source?: string;
  vehicleId?: string;
  dealId?: string;
}
