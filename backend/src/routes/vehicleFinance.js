const express = require("express");
const mongoose = require("mongoose");
const Deal = require("../models/Deal");
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

const FINANCE_KIND_VALUES = new Set(["income", "expense"]);

function serializeVehicleFinanceEntry(entry) {
  const source = entry && typeof entry.toObject === "function" ? entry.toObject() : entry;

  return {
    id: String(source?._id ?? source?.id ?? ""),
    kind: FINANCE_KIND_VALUES.has(source?.kind) ? source.kind : "expense",
    category: normalizeString(source?.category),
    amount: normalizeNumber(source?.amount),
    entryDate: serializeDateOnly(source?.entryDate),
    description: normalizeString(source?.description),
    notes: normalizeString(source?.notes),
    source: normalizeString(source?.source, "manual"),
    vehicle:
      source?.vehicleId || source?.vehicleName
        ? { id: source?.vehicleId ? String(source.vehicleId) : "", name: normalizeString(source?.vehicleName) }
        : null,
    deal:
      source?.dealId || source?.dealName
        ? { id: source?.dealId ? String(source.dealId) : "", name: normalizeString(source?.dealName) }
        : null,
    createdAt: serializeDateValue(source?.createdAt),
    updatedAt: serializeDateValue(source?.updatedAt),
  };
}

function buildVehicleFinanceOverview(entries, month) {
  const serializedEntries = entries.map(serializeVehicleFinanceEntry).sort((left, right) => {
    if (left.entryDate !== right.entryDate) {
      return left.entryDate < right.entryDate ? 1 : -1;
    }

    return left.createdAt < right.createdAt ? 1 : -1;
  });

  const totals = {
    income: 0,
    expenses: 0,
    balance: 0,
    entriesCount: serializedEntries.length,
  };

  const byCategoryMap = new Map();
  const byVehicleMap = new Map();

  serializedEntries.forEach((entry) => {
    if (entry.kind === "income") {
      totals.income += entry.amount;
    } else {
      totals.expenses += entry.amount;
    }

    const categoryKey = entry.category || "Sem categoria";
    const category = byCategoryMap.get(categoryKey) ?? {
      category: categoryKey,
      income: 0,
      expenses: 0,
    };

    if (entry.kind === "income") {
      category.income += entry.amount;
    } else {
      category.expenses += entry.amount;
    }

    byCategoryMap.set(categoryKey, category);

    if (entry.vehicle?.id) {
      const vehicleKey = entry.vehicle.id;
      const vehicleSummary = byVehicleMap.get(vehicleKey) ?? {
        vehicleId: vehicleKey,
        vehicleName: entry.vehicle.name || "Veiculo vinculado",
        income: 0,
        expenses: 0,
      };

      if (entry.kind === "income") {
        vehicleSummary.income += entry.amount;
      } else {
        vehicleSummary.expenses += entry.amount;
      }

      byVehicleMap.set(vehicleKey, vehicleSummary);
    }
  });

  totals.balance = totals.income - totals.expenses;

  return {
    month,
    totals,
    movements: serializedEntries,
    byCategory: [...byCategoryMap.values()].sort(
      (left, right) => right.expenses + right.income - (left.expenses + left.income),
    ),
    byVehicle: [...byVehicleMap.values()].sort(
      (left, right) => right.expenses + right.income - (left.expenses + left.income),
    ),
  };
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

router.get("/overview", async (req, res) => {
  try {
    const month = normalizeString(req.query.month, getTodayDate().slice(0, 7));
    const entries = await VehicleFinance.find({
      entryDate: { $regex: `^${month}` },
    })
      .sort({ entryDate: -1, createdAt: -1 })
      .lean();

    return res.status(200).json(buildVehicleFinanceOverview(entries, month));
  } catch (error) {
    return res.status(500).json({ message: "Erro ao buscar resumo financeiro do CRM." });
  }
});

router.get("/", async (req, res) => {
  try {
    const query = {};
    const search = normalizeString(req.query.search);
    const kind = normalizeString(req.query.kind);
    const month = normalizeString(req.query.month);

    if (FINANCE_KIND_VALUES.has(kind)) {
      query.kind = kind;
    }

    if (month) {
      query.entryDate = { $regex: `^${month}` };
    }

    if (search) {
      query.$or = [
        { description: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { vehicleName: { $regex: search, $options: "i" } },
        { dealName: { $regex: search, $options: "i" } },
      ];
    }

    const entries = await VehicleFinance.find(query).sort({ entryDate: -1, createdAt: -1 }).lean();
    return res.status(200).json(entries.map(serializeVehicleFinanceEntry));
  } catch (error) {
    return res.status(500).json({ message: "Erro ao buscar lancamentos do CRM." });
  }
});

router.post("/", async (req, res) => {
  try {
    const description = normalizeString(req.body?.description);
    const kind = normalizeString(req.body?.kind, "expense");
    const amount = normalizeNumber(req.body?.amount);

    if (!description) {
      return res.status(400).json({ message: "Descricao obrigatoria." });
    }

    if (!(amount > 0)) {
      return res.status(400).json({ message: "Valor invalido." });
    }

    const created = await VehicleFinance.create({
      kind: FINANCE_KIND_VALUES.has(kind) ? kind : "expense",
      category: normalizeString(req.body?.category),
      amount,
      entryDate: normalizeDateOnly(req.body?.entryDate, getTodayDate()),
      description,
      notes: normalizeString(req.body?.notes),
      source: normalizeString(req.body?.source, "manual"),
      ...(await resolveVehicleReference(req.body?.vehicleId)),
      ...(await resolveDealReference(req.body?.dealId)),
    });

    return res.status(201).json(serializeVehicleFinanceEntry(created));
  } catch (error) {
    return res.status(400).json({
      message: "Erro ao criar lancamento.",
      error: error.message,
    });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const entryId = normalizeString(req.params?.id);
    if (!mongoose.isValidObjectId(entryId)) {
      return res.status(404).json({ message: "Lancamento nao encontrado." });
    }

    const patch = {};
    const body = req.body ?? {};

    if ("kind" in body) {
      const kind = normalizeString(body.kind);
      patch.kind = FINANCE_KIND_VALUES.has(kind) ? kind : "expense";
    }
    if ("category" in body) patch.category = normalizeString(body.category);
    if ("amount" in body) patch.amount = normalizeNumber(body.amount);
    if ("entryDate" in body) patch.entryDate = normalizeDateOnly(body.entryDate, getTodayDate());
    if ("description" in body) patch.description = normalizeString(body.description);
    if ("notes" in body) patch.notes = normalizeString(body.notes);
    if ("source" in body) patch.source = normalizeString(body.source, "manual");

    if ("vehicleId" in body) {
      Object.assign(patch, await resolveVehicleReference(body.vehicleId));
    }

    if ("dealId" in body) {
      Object.assign(patch, await resolveDealReference(body.dealId));
    }

    const updated = await VehicleFinance.findByIdAndUpdate(entryId, patch, {
      returnDocument: "after",
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({ message: "Lancamento nao encontrado." });
    }

    return res.status(200).json(serializeVehicleFinanceEntry(updated));
  } catch (error) {
    return res.status(400).json({
      message: "Erro ao atualizar lancamento.",
      error: error.message,
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const entryId = normalizeString(req.params?.id);
    if (!mongoose.isValidObjectId(entryId)) {
      return res.status(404).json({ message: "Lancamento nao encontrado." });
    }

    const deleted = await VehicleFinance.findByIdAndDelete(entryId);
    if (!deleted) {
      return res.status(404).json({ message: "Lancamento nao encontrado." });
    }

    return res.status(200).json({ message: "Lancamento removido com sucesso." });
  } catch (error) {
    return res.status(500).json({ message: "Erro ao remover lancamento." });
  }
});

module.exports = router;
