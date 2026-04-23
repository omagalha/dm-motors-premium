const express = require("express");
const mongoose = require("mongoose");
const Deal = require("../models/Deal");
const Lead = require("../models/Lead");
const Task = require("../models/Task");
const requireAdminAuth = require("../middleware/requireAdminAuth");
const {
  getTodayDate,
  normalizeDateOnly,
  normalizeString,
  serializeDateOnly,
  serializeDateValue,
} = require("../utils/crmShared");

const router = express.Router();

const TASK_STATUS_VALUES = new Set(["todo", "in_progress", "done", "cancelled"]);
const TASK_PRIORITY_VALUES = new Set(["low", "medium", "high"]);

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

async function resolveLeadReference(leadId) {
  const normalizedLeadId = normalizeString(leadId);
  if (!normalizedLeadId) return { leadId: null, leadName: "" };

  if (!mongoose.isValidObjectId(normalizedLeadId)) {
    throw new Error("Lead invalido.");
  }

  const lead = await Lead.findById(normalizedLeadId).select({ _id: 1, name: 1 }).lean();
  if (!lead) {
    throw new Error("Lead nao encontrado.");
  }

  return { leadId: lead._id, leadName: normalizeString(lead.name) };
}

async function resolveDealReference(dealId) {
  const normalizedDealId = normalizeString(dealId);
  if (!normalizedDealId) return { dealId: null, dealName: "" };

  if (!mongoose.isValidObjectId(normalizedDealId)) {
    throw new Error("Negocio invalido.");
  }

  const deal = await Deal.findById(normalizedDealId).select({ _id: 1, title: 1 }).lean();
  if (!deal) {
    throw new Error("Negocio nao encontrado.");
  }

  return { dealId: deal._id, dealName: normalizeString(deal.title) };
}

router.use(requireAdminAuth);

router.get("/", async (req, res) => {
  try {
    const query = {};
    const search = normalizeString(req.query.search);
    const status = normalizeString(req.query.status);
    const priority = normalizeString(req.query.priority);
    const scope = normalizeString(req.query.scope);
    const today = getTodayDate();

    if (TASK_STATUS_VALUES.has(status)) {
      query.status = status;
    }

    if (TASK_PRIORITY_VALUES.has(priority)) {
      query.priority = priority;
    }

    if (scope === "open") {
      query.status = { $in: ["todo", "in_progress"] };
    }

    if (scope === "overdue") {
      query.status = { $in: ["todo", "in_progress"] };
      query.dueDate = { $lt: today };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { leadName: { $regex: search, $options: "i" } },
        { dealName: { $regex: search, $options: "i" } },
      ];
    }

    const tasks = await Task.find(query).sort({ dueDate: 1, updatedAt: -1 }).lean();
    return res.status(200).json(tasks.map(serializeTask));
  } catch (error) {
    return res.status(500).json({ message: "Erro ao buscar tarefas." });
  }
});

router.post("/", async (req, res) => {
  try {
    const title = normalizeString(req.body?.title);
    if (!title) {
      return res.status(400).json({ message: "Titulo da tarefa obrigatorio." });
    }

    const status = normalizeString(req.body?.status, "todo");
    const priority = normalizeString(req.body?.priority, "medium");

    const created = await Task.create({
      title,
      description: normalizeString(req.body?.description),
      status: TASK_STATUS_VALUES.has(status) ? status : "todo",
      priority: TASK_PRIORITY_VALUES.has(priority) ? priority : "medium",
      dueDate: normalizeDateOnly(req.body?.dueDate),
      completedAt:
        status === "done" ? normalizeDateOnly(req.body?.completedAt, getTodayDate()) : "",
      assignedTo: normalizeString(req.body?.assignedTo),
      ...(await resolveLeadReference(req.body?.leadId)),
      ...(await resolveDealReference(req.body?.dealId)),
    });

    return res.status(201).json(serializeTask(created));
  } catch (error) {
    return res.status(400).json({
      message: "Erro ao criar tarefa.",
      error: error.message,
    });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const taskId = normalizeString(req.params?.id);
    if (!mongoose.isValidObjectId(taskId)) {
      return res.status(404).json({ message: "Tarefa nao encontrada." });
    }

    const patch = {};
    const body = req.body ?? {};

    if ("title" in body) patch.title = normalizeString(body.title);
    if ("description" in body) patch.description = normalizeString(body.description);
    if ("dueDate" in body) patch.dueDate = normalizeDateOnly(body.dueDate);
    if ("assignedTo" in body) patch.assignedTo = normalizeString(body.assignedTo);

    if ("status" in body) {
      const status = normalizeString(body.status);
      patch.status = TASK_STATUS_VALUES.has(status) ? status : "todo";

      if (patch.status === "done") {
        patch.completedAt = normalizeDateOnly(body.completedAt, getTodayDate());
      } else if (patch.status !== "done") {
        patch.completedAt = "";
      }
    }

    if ("priority" in body) {
      const priority = normalizeString(body.priority);
      patch.priority = TASK_PRIORITY_VALUES.has(priority) ? priority : "medium";
    }

    if ("leadId" in body) {
      Object.assign(patch, await resolveLeadReference(body.leadId));
    }

    if ("dealId" in body) {
      Object.assign(patch, await resolveDealReference(body.dealId));
    }

    const updated = await Task.findByIdAndUpdate(taskId, patch, {
      returnDocument: "after",
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({ message: "Tarefa nao encontrada." });
    }

    return res.status(200).json(serializeTask(updated));
  } catch (error) {
    return res.status(400).json({
      message: "Erro ao atualizar tarefa.",
      error: error.message,
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const taskId = normalizeString(req.params?.id);
    if (!mongoose.isValidObjectId(taskId)) {
      return res.status(404).json({ message: "Tarefa nao encontrada." });
    }

    const deleted = await Task.findByIdAndDelete(taskId);
    if (!deleted) {
      return res.status(404).json({ message: "Tarefa nao encontrada." });
    }

    return res.status(200).json({ message: "Tarefa removida com sucesso." });
  } catch (error) {
    return res.status(500).json({ message: "Erro ao remover tarefa." });
  }
});

module.exports = router;
