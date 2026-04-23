const express = require("express");
const mongoose = require("mongoose");
const Lead = require("../models/Lead");
const Deal = require("../models/Deal");
const Task = require("../models/Task");
const Vehicle = require("../models/Vehicle");
const requireAdminAuth = require("../middleware/requireAdminAuth");
const {
  getTodayDate,
  normalizeDateOnly,
  normalizeNumber,
  normalizeString,
  normalizeStringArray,
  serializeDateOnly,
  serializeDateValue,
} = require("../utils/crmShared");

const router = express.Router();

const LEAD_STAGE_VALUES = new Set([
  "novo",
  "em_contato",
  "qualificado",
  "proposta",
  "negociacao",
  "convertido",
  "perdido",
]);

const LEAD_PRIORITY_VALUES = new Set(["low", "medium", "high"]);
const TASK_STATUS_VALUES = new Set(["todo", "in_progress", "done", "cancelled"]);
const TASK_PRIORITY_VALUES = new Set(["low", "medium", "high"]);
const DEAL_STAGE_VALUES = new Set([
  "novo",
  "qualificacao",
  "proposta",
  "negociacao",
  "fechado_ganho",
  "fechado_perdido",
]);
const OPEN_TASK_STATUS_VALUES = new Set(["todo", "in_progress"]);
const OPEN_DEAL_STAGE_VALUES = new Set(["novo", "qualificacao", "proposta", "negociacao"]);

function serializeLead(lead) {
  const source = lead && typeof lead.toObject === "function" ? lead.toObject() : lead;

  return {
    id: String(source?._id ?? source?.id ?? ""),
    name: normalizeString(source?.name),
    phone: normalizeString(source?.phone),
    email: normalizeString(source?.email),
    source: normalizeString(source?.source, "site"),
    stage: LEAD_STAGE_VALUES.has(source?.stage) ? source.stage : "novo",
    priority: LEAD_PRIORITY_VALUES.has(source?.priority) ? source.priority : "medium",
    assignedTo: normalizeString(source?.assignedTo),
    budget: normalizeNumber(source?.budget),
    tags: normalizeStringArray(source?.tags),
    notes: normalizeString(source?.notes),
    lastContactAt: serializeDateOnly(source?.lastContactAt),
    nextFollowUpAt: serializeDateOnly(source?.nextFollowUpAt),
    interestVehicle:
      source?.interestVehicleId || source?.interestVehicleName
        ? {
            id: source?.interestVehicleId ? String(source.interestVehicleId) : "",
            name: normalizeString(source?.interestVehicleName),
          }
        : null,
    createdAt: serializeDateValue(source?.createdAt),
    updatedAt: serializeDateValue(source?.updatedAt),
  };
}

function serializeTask(task) {
  const source = task && typeof task.toObject === "function" ? task.toObject() : task;

  return {
    id: String(source?._id ?? source?.id ?? ""),
    title: normalizeString(source?.title),
    description: normalizeString(source?.description),
    status: TASK_STATUS_VALUES.has(source?.status) ? source.status : "todo",
    priority: TASK_PRIORITY_VALUES.has(source?.priority) ? source.priority : "medium",
    dueDate: serializeDateOnly(source?.dueDate),
    completedAt: serializeDateOnly(source?.completedAt),
    assignedTo: normalizeString(source?.assignedTo),
    lead:
      source?.leadId || source?.leadName
        ? { id: source?.leadId ? String(source.leadId) : "", name: normalizeString(source?.leadName) }
        : null,
    deal:
      source?.dealId || source?.dealName
        ? { id: source?.dealId ? String(source.dealId) : "", name: normalizeString(source?.dealName) }
        : null,
    createdAt: serializeDateValue(source?.createdAt),
    updatedAt: serializeDateValue(source?.updatedAt),
  };
}

function serializeDeal(deal) {
  const source = deal && typeof deal.toObject === "function" ? deal.toObject() : deal;

  return {
    id: String(source?._id ?? source?.id ?? ""),
    title: normalizeString(source?.title),
    stage: DEAL_STAGE_VALUES.has(source?.stage) ? source.stage : "novo",
    value: normalizeNumber(source?.value),
    probability: normalizeNumber(source?.probability),
    expectedCloseDate: serializeDateOnly(source?.expectedCloseDate),
    closedAt: serializeDateOnly(source?.closedAt),
    owner: normalizeString(source?.owner),
    source: normalizeString(source?.source, "crm"),
    notes: normalizeString(source?.notes),
    lostReason: normalizeString(source?.lostReason),
    lead:
      source?.leadId || source?.leadName
        ? { id: source?.leadId ? String(source.leadId) : "", name: normalizeString(source?.leadName) }
        : null,
    vehicle:
      source?.vehicleId || source?.vehicleName
        ? {
            id: source?.vehicleId ? String(source.vehicleId) : "",
            name: normalizeString(source?.vehicleName),
          }
        : null,
    createdAt: serializeDateValue(source?.createdAt),
    updatedAt: serializeDateValue(source?.updatedAt),
  };
}

function getEventTimestamp(value) {
  const normalized = normalizeString(value);
  if (!normalized) return 0;

  const parsed = new Date(normalized.length === 10 ? `${normalized}T12:00:00.000Z` : normalized);
  const timestamp = parsed.getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function buildTaskHistoryDescription(task) {
  const parts = [];

  if (task.assignedTo) parts.push(`Responsavel: ${task.assignedTo}`);
  if (task.dueDate) parts.push(`Prazo: ${task.dueDate}`);
  if (task.description) parts.push(task.description);

  return parts.join(" - ");
}

function buildProposalHistoryDescription(proposal) {
  const parts = [];

  if (proposal.value > 0) parts.push(`Valor: ${proposal.value}`);
  if (proposal.vehicle?.name) parts.push(`Veiculo: ${proposal.vehicle.name}`);
  if (proposal.expectedCloseDate) parts.push(`Previsao: ${proposal.expectedCloseDate}`);
  if (proposal.lostReason) parts.push(`Motivo: ${proposal.lostReason}`);

  return parts.join(" - ");
}

function buildLeadHistory(lead, tasks, proposals) {
  const history = [];

  if (lead.createdAt) {
    history.push({
      id: `lead-created-${lead.id}`,
      type: "lead_created",
      date: lead.createdAt,
      title: "Lead criado",
      description: lead.source ? `Origem: ${lead.source}` : "",
      relatedType: "lead",
      relatedId: lead.id,
    });
  }

  if (lead.lastContactAt) {
    history.push({
      id: `lead-contact-${lead.id}`,
      type: "contact_logged",
      date: lead.lastContactAt,
      title: "Ultimo contato registrado",
      description: lead.assignedTo ? `Responsavel: ${lead.assignedTo}` : "",
      relatedType: "lead",
      relatedId: lead.id,
    });
  }

  if (lead.nextFollowUpAt) {
    history.push({
      id: `lead-follow-up-${lead.id}`,
      type: "follow_up_scheduled",
      date: lead.nextFollowUpAt,
      title: "Follow-up agendado",
      description: lead.assignedTo ? `Responsavel: ${lead.assignedTo}` : "",
      relatedType: "lead",
      relatedId: lead.id,
    });
  }

  tasks.forEach((task) => {
    if (task.createdAt) {
      history.push({
        id: `task-created-${task.id}`,
        type: "task_created",
        date: task.createdAt,
        title: `Tarefa criada: ${task.title}`,
        description: buildTaskHistoryDescription(task),
        relatedType: "task",
        relatedId: task.id,
      });
    }

    if (task.completedAt) {
      history.push({
        id: `task-completed-${task.id}`,
        type: "task_completed",
        date: task.completedAt,
        title: `Tarefa concluida: ${task.title}`,
        description: buildTaskHistoryDescription(task),
        relatedType: "task",
        relatedId: task.id,
      });
    }
  });

  proposals.forEach((proposal) => {
    if (proposal.createdAt) {
      history.push({
        id: `proposal-created-${proposal.id}`,
        type: "proposal_created",
        date: proposal.createdAt,
        title: `Proposta criada: ${proposal.title}`,
        description: buildProposalHistoryDescription(proposal),
        relatedType: "proposal",
        relatedId: proposal.id,
      });
    }

    if (proposal.closedAt) {
      history.push({
        id: `proposal-closed-${proposal.id}`,
        type: "proposal_closed",
        date: proposal.closedAt,
        title:
          proposal.stage === "fechado_ganho"
            ? `Negocio ganho: ${proposal.title}`
            : `Negocio encerrado: ${proposal.title}`,
        description: buildProposalHistoryDescription(proposal),
        relatedType: "proposal",
        relatedId: proposal.id,
      });
    }
  });

  return history.sort((left, right) => getEventTimestamp(right.date) - getEventTimestamp(left.date));
}

async function resolveVehicleReference(vehicleId) {
  const normalizedVehicleId = normalizeString(vehicleId);
  if (!normalizedVehicleId) {
    return { interestVehicleId: null, interestVehicleName: "" };
  }

  if (!mongoose.isValidObjectId(normalizedVehicleId)) {
    throw new Error("Veiculo invalido.");
  }

  const vehicle = await Vehicle.findById(normalizedVehicleId).select({ _id: 1, name: 1 }).lean();
  if (!vehicle) {
    throw new Error("Veiculo nao encontrado.");
  }

  return {
    interestVehicleId: vehicle._id,
    interestVehicleName: normalizeString(vehicle.name),
  };
}

router.use(requireAdminAuth);

router.get("/", async (req, res) => {
  try {
    const query = {};
    const search = normalizeString(req.query.search);
    const stage = normalizeString(req.query.stage);
    const priority = normalizeString(req.query.priority);

    if (LEAD_STAGE_VALUES.has(stage)) {
      query.stage = stage;
    }

    if (LEAD_PRIORITY_VALUES.has(priority)) {
      query.priority = priority;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { interestVehicleName: { $regex: search, $options: "i" } },
      ];
    }

    const leads = await Lead.find(query).sort({ updatedAt: -1, createdAt: -1 }).lean();
    return res.status(200).json(leads.map(serializeLead));
  } catch (error) {
    return res.status(500).json({ message: "Erro ao buscar leads." });
  }
});

router.post("/", async (req, res) => {
  try {
    const name = normalizeString(req.body?.name);
    if (!name) {
      return res.status(400).json({ message: "Nome do lead obrigatorio." });
    }

    const stage = normalizeString(req.body?.stage, "novo");
    const priority = normalizeString(req.body?.priority, "medium");
    const vehicleReference = await resolveVehicleReference(req.body?.interestVehicleId);

    const created = await Lead.create({
      name,
      phone: normalizeString(req.body?.phone),
      email: normalizeString(req.body?.email),
      source: normalizeString(req.body?.source, "site"),
      stage: LEAD_STAGE_VALUES.has(stage) ? stage : "novo",
      priority: LEAD_PRIORITY_VALUES.has(priority) ? priority : "medium",
      assignedTo: normalizeString(req.body?.assignedTo),
      budget: normalizeNumber(req.body?.budget),
      tags: normalizeStringArray(req.body?.tags),
      notes: normalizeString(req.body?.notes),
      lastContactAt: normalizeDateOnly(req.body?.lastContactAt),
      nextFollowUpAt: normalizeDateOnly(req.body?.nextFollowUpAt),
      ...vehicleReference,
    });

    return res.status(201).json(serializeLead(created));
  } catch (error) {
    return res.status(400).json({
      message: "Erro ao criar lead.",
      error: error.message,
    });
  }
});

router.get("/:id/profile", async (req, res) => {
  try {
    const leadId = normalizeString(req.params?.id);
    if (!mongoose.isValidObjectId(leadId)) {
      return res.status(404).json({ message: "Lead nao encontrado." });
    }

    const lead = await Lead.findById(leadId).lean();
    if (!lead) {
      return res.status(404).json({ message: "Lead nao encontrado." });
    }

    const [tasks, proposals] = await Promise.all([
      Task.find({ leadId: lead._id }).sort({ dueDate: 1, updatedAt: -1, createdAt: -1 }).lean(),
      Deal.find({ leadId: lead._id }).sort({ updatedAt: -1, createdAt: -1 }).lean(),
    ]);

    const serializedLead = serializeLead(lead);
    const serializedTasks = tasks.map(serializeTask);
    const serializedProposals = proposals.map(serializeDeal);
    const today = getTodayDate();

    const openTasks = serializedTasks.filter((task) => OPEN_TASK_STATUS_VALUES.has(task.status));
    const overdueTasks = openTasks.filter((task) => task.dueDate && task.dueDate < today);
    const openProposals = serializedProposals.filter((proposal) =>
      OPEN_DEAL_STAGE_VALUES.has(proposal.stage),
    );
    const wonProposals = serializedProposals.filter((proposal) => proposal.stage === "fechado_ganho");
    const lostProposals = serializedProposals.filter(
      (proposal) => proposal.stage === "fechado_perdido",
    );
    const currentProposal = openProposals[0] ?? serializedProposals[0] ?? null;

    return res.status(200).json({
      lead: serializedLead,
      tasks: serializedTasks,
      proposals: serializedProposals,
      history: buildLeadHistory(serializedLead, serializedTasks, serializedProposals),
      status: {
        stage: serializedLead.stage,
        priority: serializedLead.priority,
        openTasksCount: openTasks.length,
        overdueTasksCount: overdueTasks.length,
        totalProposalsCount: serializedProposals.length,
        openProposalsCount: openProposals.length,
        wonProposalsCount: wonProposals.length,
        lostProposalsCount: lostProposals.length,
        pipelineValue: openProposals.reduce((sum, proposal) => sum + normalizeNumber(proposal.value), 0),
        closedValue: wonProposals.reduce((sum, proposal) => sum + normalizeNumber(proposal.value), 0),
        currentProposalTitle: currentProposal?.title ?? "",
        currentProposalStage: currentProposal?.stage ?? "",
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Erro ao carregar o perfil do lead." });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const leadId = normalizeString(req.params?.id);
    if (!mongoose.isValidObjectId(leadId)) {
      return res.status(404).json({ message: "Lead nao encontrado." });
    }

    const patch = {};
    const body = req.body ?? {};

    if ("name" in body) patch.name = normalizeString(body.name);
    if ("phone" in body) patch.phone = normalizeString(body.phone);
    if ("email" in body) patch.email = normalizeString(body.email);
    if ("source" in body) patch.source = normalizeString(body.source, "site");
    if ("assignedTo" in body) patch.assignedTo = normalizeString(body.assignedTo);
    if ("budget" in body) patch.budget = normalizeNumber(body.budget);
    if ("tags" in body) patch.tags = normalizeStringArray(body.tags);
    if ("notes" in body) patch.notes = normalizeString(body.notes);
    if ("lastContactAt" in body) patch.lastContactAt = normalizeDateOnly(body.lastContactAt);
    if ("nextFollowUpAt" in body) patch.nextFollowUpAt = normalizeDateOnly(body.nextFollowUpAt);

    if ("stage" in body) {
      const stage = normalizeString(body.stage);
      patch.stage = LEAD_STAGE_VALUES.has(stage) ? stage : "novo";
    }

    if ("priority" in body) {
      const priority = normalizeString(body.priority);
      patch.priority = LEAD_PRIORITY_VALUES.has(priority) ? priority : "medium";
    }

    if ("interestVehicleId" in body) {
      Object.assign(patch, await resolveVehicleReference(body.interestVehicleId));
    }

    const updated = await Lead.findByIdAndUpdate(leadId, patch, {
      returnDocument: "after",
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({ message: "Lead nao encontrado." });
    }

    return res.status(200).json(serializeLead(updated));
  } catch (error) {
    return res.status(400).json({
      message: "Erro ao atualizar lead.",
      error: error.message,
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const leadId = normalizeString(req.params?.id);
    if (!mongoose.isValidObjectId(leadId)) {
      return res.status(404).json({ message: "Lead nao encontrado." });
    }

    const deleted = await Lead.findByIdAndDelete(leadId);
    if (!deleted) {
      return res.status(404).json({ message: "Lead nao encontrado." });
    }

    await Deal.updateMany(
      { leadId: deleted._id },
      { $set: { leadId: null, leadName: "" } },
    );
    await Task.updateMany(
      { leadId: deleted._id },
      { $set: { leadId: null, leadName: "" } },
    );

    return res.status(200).json({ message: "Lead removido com sucesso." });
  } catch (error) {
    return res.status(500).json({ message: "Erro ao remover lead." });
  }
});

module.exports = router;
