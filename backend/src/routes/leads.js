const express = require("express");
const mongoose = require("mongoose");
const Lead = require("../models/Lead");
const Deal = require("../models/Deal");
const Task = require("../models/Task");
const Vehicle = require("../models/Vehicle");
const requireAdminAuth = require("../middleware/requireAdminAuth");
const {
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
