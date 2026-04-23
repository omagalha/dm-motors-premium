const express = require("express");
const mongoose = require("mongoose");
const Deal = require("../models/Deal");
const Lead = require("../models/Lead");
const Task = require("../models/Task");
const Vehicle = require("../models/Vehicle");
const VehicleFinance = require("../models/VehicleFinance");
const requireAdminAuth = require("../middleware/requireAdminAuth");
const {
  getTodayDate,
  normalizeDateOnly,
  normalizeNumber,
  normalizeString,
  serializeDateOnly,
  serializeDateValue,
} = require("../utils/crmShared");

const router = express.Router();

const DEAL_STAGE_VALUES = new Set([
  "novo",
  "qualificacao",
  "proposta",
  "negociacao",
  "fechado_ganho",
  "fechado_perdido",
]);

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
        ? { id: source?.vehicleId ? String(source.vehicleId) : "", name: normalizeString(source?.vehicleName) }
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

async function resolveVehicleReference(vehicleId) {
  const normalizedVehicleId = normalizeString(vehicleId);
  if (!normalizedVehicleId) return { vehicleId: null, vehicleName: "" };

  if (!mongoose.isValidObjectId(normalizedVehicleId)) {
    throw new Error("Veiculo invalido.");
  }

  const vehicle = await Vehicle.findById(normalizedVehicleId).select({ _id: 1, name: 1 }).lean();
  if (!vehicle) {
    throw new Error("Veiculo nao encontrado.");
  }

  return { vehicleId: vehicle._id, vehicleName: normalizeString(vehicle.name) };
}

async function syncLeadFromDeal(dealDoc) {
  if (!dealDoc?.leadId) return;

  if (dealDoc.stage === "fechado_ganho") {
    await Lead.findByIdAndUpdate(dealDoc.leadId, { stage: "convertido" });
    return;
  }

  if (dealDoc.stage === "fechado_perdido") {
    await Lead.findByIdAndUpdate(dealDoc.leadId, { stage: "perdido" });
    return;
  }

  await Lead.findByIdAndUpdate(dealDoc.leadId, { stage: "qualificado" });
}

router.use(requireAdminAuth);

router.get("/", async (req, res) => {
  try {
    const query = {};
    const search = normalizeString(req.query.search);
    const stage = normalizeString(req.query.stage);

    if (DEAL_STAGE_VALUES.has(stage)) {
      query.stage = stage;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { leadName: { $regex: search, $options: "i" } },
        { vehicleName: { $regex: search, $options: "i" } },
      ];
    }

    const deals = await Deal.find(query).sort({ updatedAt: -1, createdAt: -1 }).lean();
    return res.status(200).json(deals.map(serializeDeal));
  } catch (error) {
    return res.status(500).json({ message: "Erro ao buscar negocios." });
  }
});

router.post("/", async (req, res) => {
  try {
    const title = normalizeString(req.body?.title);
    if (!title) {
      return res.status(400).json({ message: "Titulo do negocio obrigatorio." });
    }

    const stage = normalizeString(req.body?.stage, "novo");

    const created = await Deal.create({
      title,
      stage: DEAL_STAGE_VALUES.has(stage) ? stage : "novo",
      value: normalizeNumber(req.body?.value),
      probability: normalizeNumber(req.body?.probability),
      expectedCloseDate: normalizeDateOnly(req.body?.expectedCloseDate),
      closedAt:
        stage === "fechado_ganho" || stage === "fechado_perdido"
          ? normalizeDateOnly(req.body?.closedAt, getTodayDate())
          : "",
      owner: normalizeString(req.body?.owner),
      source: normalizeString(req.body?.source, "crm"),
      notes: normalizeString(req.body?.notes),
      lostReason: normalizeString(req.body?.lostReason),
      ...(await resolveLeadReference(req.body?.leadId)),
      ...(await resolveVehicleReference(req.body?.vehicleId)),
    });

    await syncLeadFromDeal(created);

    return res.status(201).json(serializeDeal(created));
  } catch (error) {
    return res.status(400).json({
      message: "Erro ao criar negocio.",
      error: error.message,
    });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const dealId = normalizeString(req.params?.id);
    if (!mongoose.isValidObjectId(dealId)) {
      return res.status(404).json({ message: "Negocio nao encontrado." });
    }

    const patch = {};
    const body = req.body ?? {};

    if ("title" in body) patch.title = normalizeString(body.title);
    if ("value" in body) patch.value = normalizeNumber(body.value);
    if ("probability" in body) patch.probability = normalizeNumber(body.probability);
    if ("expectedCloseDate" in body) {
      patch.expectedCloseDate = normalizeDateOnly(body.expectedCloseDate);
    }
    if ("owner" in body) patch.owner = normalizeString(body.owner);
    if ("source" in body) patch.source = normalizeString(body.source, "crm");
    if ("notes" in body) patch.notes = normalizeString(body.notes);
    if ("lostReason" in body) patch.lostReason = normalizeString(body.lostReason);

    if ("stage" in body) {
      const stage = normalizeString(body.stage);
      patch.stage = DEAL_STAGE_VALUES.has(stage) ? stage : "novo";
      patch.closedAt =
        patch.stage === "fechado_ganho" || patch.stage === "fechado_perdido"
          ? normalizeDateOnly(body.closedAt, getTodayDate())
          : "";
    }

    if ("leadId" in body) {
      Object.assign(patch, await resolveLeadReference(body.leadId));
    }

    if ("vehicleId" in body) {
      Object.assign(patch, await resolveVehicleReference(body.vehicleId));
    }

    const updated = await Deal.findByIdAndUpdate(dealId, patch, {
      returnDocument: "after",
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({ message: "Negocio nao encontrado." });
    }

    await syncLeadFromDeal(updated);

    return res.status(200).json(serializeDeal(updated));
  } catch (error) {
    return res.status(400).json({
      message: "Erro ao atualizar negocio.",
      error: error.message,
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const dealId = normalizeString(req.params?.id);
    if (!mongoose.isValidObjectId(dealId)) {
      return res.status(404).json({ message: "Negocio nao encontrado." });
    }

    const deleted = await Deal.findByIdAndDelete(dealId);
    if (!deleted) {
      return res.status(404).json({ message: "Negocio nao encontrado." });
    }

    await Task.updateMany({ dealId: deleted._id }, { $set: { dealId: null, dealName: "" } });
    await VehicleFinance.updateMany(
      { dealId: deleted._id },
      { $set: { dealId: null, dealName: "" } },
    );

    return res.status(200).json({ message: "Negocio removido com sucesso." });
  } catch (error) {
    return res.status(500).json({ message: "Erro ao remover negocio." });
  }
});

module.exports = router;
