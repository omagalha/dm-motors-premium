const mongoose = require("mongoose");
const FinanceEntry = require("../models/FinanceEntry");
const Contact = require("../models/Contact");
const Vehicle = require("../models/Vehicle");

const TYPE_META = {
  sale: {
    kind: "income",
    category: "Venda",
  },
  expense: {
    kind: "expense",
    category: "Despesa",
  },
  manual_income: {
    kind: "income",
    category: "Entrada manual",
  },
};

const VEHICLE_STATUS_VALUES = new Set(["disponivel", "reservado", "vendido"]);

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeString(value, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function normalizeObjectId(value) {
  const normalized =
    typeof value === "string"
      ? value.trim()
      : value && typeof value.toString === "function"
        ? value.toString().trim()
        : "";

  return /^[a-fA-F0-9]{24}$/.test(normalized) ? normalized : "";
}

function normalizeNumber(value, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  return fallback;
}

function normalizeInteger(value, fallback = 1) {
  const normalized = normalizeNumber(value, fallback);
  if (!Number.isFinite(normalized)) return fallback;
  return Math.max(1, Math.floor(normalized));
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeDateOnly(value, fallback = getTodayDate()) {
  const normalized = normalizeString(value);
  if (!normalized) return fallback;

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    const [year] = normalized.split("-");
    const numericYear = Number(year);

    if (Number.isFinite(numericYear) && numericYear >= 1900 && numericYear <= 2100) {
      return normalized;
    }

    return fallback;
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return fallback;

  const year = parsed.getUTCFullYear();
  if (year < 1900 || year > 2100) return fallback;

  return parsed.toISOString().slice(0, 10);
}

function addMonthsToDateOnly(value, offset) {
  const normalized = normalizeDateOnly(value);
  const [yearString, monthString, dayString] = normalized.split("-");
  const year = Number(yearString);
  const month = Number(monthString) - 1;
  const day = Number(dayString);
  const target = new Date(Date.UTC(year, month + offset, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();

  target.setUTCDate(Math.min(day, lastDay));

  return target.toISOString().slice(0, 10);
}

function normalizeRecurrenceKind(value) {
  const normalized = normalizeString(value);
  if (normalized === "installment" || normalized === "monthly") return normalized;
  return "single";
}

function normalizeMonth(value) {
  const normalized = normalizeString(value);
  if (/^\d{4}-\d{2}$/.test(normalized)) {
    const [year] = normalized.split("-");
    const numericYear = Number(year);

    if (Number.isFinite(numericYear) && numericYear >= 1900 && numericYear <= 2100) {
      return normalized;
    }
  }

  return getTodayDate().slice(0, 7);
}

function getSuggestedBackfillEntryDate(vehicle) {
  const updatedAt = normalizeDateOnly(vehicle?.updatedAt, "");
  if (updatedAt) {
    return {
      suggestedEntryDate: updatedAt,
      inferredFrom: "updatedAt",
    };
  }

  const createdAt = normalizeDateOnly(vehicle?.createdAt, "");
  if (createdAt) {
    return {
      suggestedEntryDate: createdAt,
      inferredFrom: "createdAt",
    };
  }

  return {
    suggestedEntryDate: getTodayDate(),
    inferredFrom: "today",
  };
}

async function buildSaleBackfillPreview(selectedVehicleIds) {
  const normalizedVehicleIds = Array.isArray(selectedVehicleIds)
    ? selectedVehicleIds.filter((vehicleId) => mongoose.isValidObjectId(vehicleId))
    : [];

  const vehicleQuery = {
    status: "vendido",
    ...(normalizedVehicleIds.length ? { _id: { $in: normalizedVehicleIds } } : {}),
  };

  const soldVehicles = await Vehicle.find(vehicleQuery)
    .select({ _id: 1, name: 1, price: 1, createdAt: 1, updatedAt: 1 })
    .sort({ updatedAt: -1, createdAt: -1 })
    .lean();

  const soldVehicleIds = soldVehicles.map((vehicle) => vehicle._id);

  const existingSales = soldVehicleIds.length
    ? await FinanceEntry.find({
        type: "sale",
        vehicleId: { $in: soldVehicleIds },
      })
        .select({ vehicleId: 1 })
        .lean()
    : [];

  const existingSalesByVehicleId = new Set(
    existingSales.map((entry) => String(entry.vehicleId)).filter(Boolean),
  );

  const preview = soldVehicles.reduce(
    (acc, vehicle) => {
      const vehicleId = String(vehicle._id);

      if (existingSalesByVehicleId.has(vehicleId)) {
        acc.totals.existingSalesCount += 1;
        return acc;
      }

      const amount = normalizeNumber(vehicle.price);
      if (!(amount > 0)) {
        acc.totals.skippedMissingPriceCount += 1;
        return acc;
      }

      const suggestion = getSuggestedBackfillEntryDate(vehicle);

      acc.candidates.push({
        vehicleId,
        vehicleName: normalizeString(vehicle.name, "Veiculo vendido"),
        amount,
        suggestedEntryDate: suggestion.suggestedEntryDate,
        inferredFrom: suggestion.inferredFrom,
        createdAt: vehicle?.createdAt ? new Date(vehicle.createdAt).toISOString() : "",
        updatedAt: vehicle?.updatedAt ? new Date(vehicle.updatedAt).toISOString() : "",
      });
      acc.totals.pendingCount += 1;

      return acc;
    },
    {
      totals: {
        soldCount: soldVehicles.length,
        existingSalesCount: 0,
        pendingCount: 0,
        skippedMissingPriceCount: 0,
      },
      candidates: [],
    },
  );

  preview.candidates.sort((left, right) => {
    if (left.suggestedEntryDate !== right.suggestedEntryDate) {
      return left.suggestedEntryDate < right.suggestedEntryDate ? 1 : -1;
    }

    return left.vehicleName.localeCompare(right.vehicleName, "pt-BR");
  });

  return preview;
}

function serializeFinanceEntry(entry) {
  const source =
    entry && typeof entry.toObject === "function" ? entry.toObject({ flattenMaps: true }) : entry;

  const vehicleId =
    source?.vehicleId && typeof source.vehicleId === "object" && "_id" in source.vehicleId
      ? source.vehicleId._id
      : source?.vehicleId;

  return {
    id: String(source?._id ?? source?.id ?? ""),
    kind: source?.kind === "expense" ? "expense" : "income",
    type:
      source?.type === "sale" || source?.type === "expense" || source?.type === "manual_income"
        ? source.type
        : "expense",
    entryDate: normalizeDateOnly(source?.entryDate),
    description: normalizeString(source?.description, "Lancamento"),
    category: normalizeString(
      source?.category,
      source?.kind === "expense" ? TYPE_META.expense.category : TYPE_META.manual_income.category,
    ),
    amount: normalizeNumber(source?.amount),
    notes: normalizeString(source?.notes),
    source: source?.source === "vehicle_sale" ? "vehicle_sale" : "manual",
    vehicle: vehicleId
      ? {
          id: String(vehicleId),
          name: normalizeString(source?.vehicleName),
        }
      : null,
    createdAt: source?.createdAt ? new Date(source.createdAt).toISOString() : "",
    updatedAt: source?.updatedAt ? new Date(source.updatedAt).toISOString() : "",
  };
}

function buildOverview(entries, month) {
  const serializedEntries = entries.map(serializeFinanceEntry).sort((left, right) => {
    if (left.entryDate !== right.entryDate) {
      return left.entryDate < right.entryDate ? 1 : -1;
    }

    if (left.createdAt !== right.createdAt) {
      return left.createdAt < right.createdAt ? 1 : -1;
    }

    return 0;
  });

  const totals = {
    revenue: 0,
    expenses: 0,
    profit: 0,
    cash: 0,
    salesCount: 0,
    expenseCount: 0,
    entriesCount: serializedEntries.length,
  };

  const categoryMap = new Map();
  const vehicleMap = new Map();

  serializedEntries.forEach((entry) => {
    if (entry.kind === "expense") {
      totals.expenses += entry.amount;
      totals.expenseCount += 1;

      const categoryKey = entry.category || TYPE_META.expense.category;
      const existingCategory = categoryMap.get(categoryKey) ?? {
        category: categoryKey,
        total: 0,
        count: 0,
      };

      existingCategory.total += entry.amount;
      existingCategory.count += 1;
      categoryMap.set(categoryKey, existingCategory);

      if (entry.vehicle?.id) {
        const vehicleKey = entry.vehicle.id;
        const existingVehicle = vehicleMap.get(vehicleKey) ?? {
          vehicleId: vehicleKey,
          vehicleName: entry.vehicle.name || "Veiculo vinculado",
          total: 0,
          count: 0,
        };

        existingVehicle.total += entry.amount;
        existingVehicle.count += 1;
        vehicleMap.set(vehicleKey, existingVehicle);
      }

      return;
    }

    totals.revenue += entry.amount;

    if (entry.type === "sale") {
      totals.salesCount += 1;
    }
  });

  totals.profit = totals.revenue - totals.expenses;
  totals.cash = totals.revenue - totals.expenses;

  const byCategory = [...categoryMap.values()].sort((left, right) => {
    if (left.total !== right.total) return right.total - left.total;
    return left.category.localeCompare(right.category, "pt-BR");
  });

  const byVehicle = [...vehicleMap.values()].sort((left, right) => {
    if (left.total !== right.total) return right.total - left.total;
    return left.vehicleName.localeCompare(right.vehicleName, "pt-BR");
  });

  return {
    month,
    totals,
    movements: serializedEntries,
    byCategory,
    byVehicle,
  };
}

async function findVehicleById(vehicleId) {
  if (!mongoose.isValidObjectId(vehicleId)) return null;
  return Vehicle.findById(vehicleId);
}

async function getFinanceOverview(req, res) {
  try {
    const month = normalizeMonth(req.query.month);
    const entries = await FinanceEntry.find({
      entryDate: { $regex: `^${month}` },
    })
      .sort({ entryDate: -1, createdAt: -1 })
      .lean();

    return res.status(200).json(buildOverview(entries, month));
  } catch (error) {
    return res.status(500).json({ message: "Erro ao buscar resumo financeiro." });
  }
}

async function getFinanceSaleBackfillPreview(req, res) {
  try {
    const preview = await buildSaleBackfillPreview();
    return res.status(200).json(preview);
  } catch (error) {
    return res.status(500).json({ message: "Erro ao buscar vendas antigas para importacao." });
  }
}

async function createFinanceEntry(req, res) {
  try {
    const type = normalizeString(req.body?.type);
    if (type !== "expense" && type !== "manual_income") {
      return res.status(400).json({ message: "Tipo de lancamento invalido." });
    }

    const meta = TYPE_META[type];
    const description = normalizeString(req.body?.description);
    const amount = normalizeNumber(req.body?.amount);

    if (!description) {
      return res.status(400).json({ message: "Descricao obrigatoria." });
    }

    if (!(amount > 0)) {
      return res.status(400).json({ message: "Valor invalido." });
    }

    let vehicle = null;
    const vehicleId = normalizeString(req.body?.vehicleId);

    if (vehicleId) {
      vehicle = await findVehicleById(vehicleId);

      if (!vehicle) {
        return res.status(404).json({ message: "Veiculo nao encontrado." });
      }
    }

    const recurrenceKind = type === "expense" ? normalizeRecurrenceKind(req.body?.recurrenceKind) : "single";
    const recurrenceTotal =
      recurrenceKind === "single" ? 1 : Math.min(normalizeInteger(req.body?.recurrenceTotal, 1), 120);
    const recurrenceId =
      recurrenceKind === "single"
        ? ""
        : `finance_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const entryDate = normalizeDateOnly(req.body?.entryDate);
    const baseEntry = {
      kind: meta.kind,
      type,
      category: normalizeString(req.body?.category, meta.category),
      amount,
      notes: normalizeString(req.body?.notes),
      vehicleId: vehicle?._id ?? null,
      vehicleName: vehicle?.name ?? "",
      source: "manual",
    };
    const entries = Array.from({ length: recurrenceTotal }, (_, index) => ({
      ...baseEntry,
      entryDate: addMonthsToDateOnly(entryDate, index),
      description:
        recurrenceKind === "installment"
          ? `${description} (${index + 1}/${recurrenceTotal})`
          : description,
      metadata:
        recurrenceKind === "single"
          ? undefined
          : {
              recurrenceId,
              recurrenceKind,
              recurrenceIndex: index + 1,
              recurrenceTotal,
            },
    }));
    const createdEntries =
      entries.length === 1 ? [await FinanceEntry.create(entries[0])] : await FinanceEntry.insertMany(entries);

    return res.status(201).json(serializeFinanceEntry(createdEntries[0]));
  } catch (error) {
    return res.status(400).json({
      message: "Erro ao criar lancamento financeiro.",
      error: error.message,
    });
  }
}

async function createFinanceSale(req, res) {
  try {
    const vehicleId = normalizeString(req.body?.vehicleId);
    const vehicle = await findVehicleById(vehicleId);

    if (!vehicle) {
      return res.status(404).json({ message: "Veiculo nao encontrado." });
    }

    const existingSale = await FinanceEntry.findOne({
      type: "sale",
      vehicleId: vehicle._id,
    })
      .select({ _id: 1 })
      .lean();

    if (existingSale) {
      return res.status(409).json({ message: "Este veiculo ja possui uma venda registrada." });
    }

    const amount = normalizeNumber(req.body?.amount, normalizeNumber(vehicle.price));
    if (!(amount > 0)) {
      return res.status(400).json({ message: "Valor da venda invalido." });
    }

    const previousVehicleStatus = VEHICLE_STATUS_VALUES.has(vehicle.status)
      ? vehicle.status
      : "disponivel";
    const buyerContactId = normalizeObjectId(req.body?.buyerContactId);
    const buyerContactName = normalizeString(req.body?.buyerContactName);
    let buyerContact = null;

    if (buyerContactId) {
      buyerContact = await Contact.findById(buyerContactId).select({ _id: 1, name: 1 }).lean();
      if (!buyerContact) {
        return res.status(404).json({ message: "Comprador nao encontrado no CRM." });
      }
    }

    const resolvedBuyerContactId = buyerContact?._id ?? null;
    const resolvedBuyerContactName = normalizeString(buyerContact?.name, buyerContactName);

    const created = await FinanceEntry.create({
      kind: TYPE_META.sale.kind,
      type: "sale",
      entryDate: normalizeDateOnly(req.body?.entryDate),
      description: normalizeString(req.body?.description, vehicle.name || "Venda de veiculo"),
      category: normalizeString(req.body?.category, TYPE_META.sale.category),
      amount,
      notes: normalizeString(req.body?.notes),
      vehicleId: vehicle._id,
      vehicleName: normalizeString(vehicle.name, "Veiculo vendido"),
      source: "vehicle_sale",
      metadata: {
        previousVehicleStatus,
      },
    });

    if (vehicle.status !== "vendido") {
      vehicle.status = "vendido";
    }

    vehicle.active = false;
    vehicle.internal = {
      ...(vehicle.internal?.toObject ? vehicle.internal.toObject() : vehicle.internal ?? {}),
      buyerContactId: resolvedBuyerContactId,
      buyerContactName: resolvedBuyerContactName,
      buyerName: resolvedBuyerContactName || normalizeString(vehicle.internal?.buyerName),
    };
    await vehicle.save();

    return res.status(201).json(serializeFinanceEntry(created));
  } catch (error) {
    return res.status(400).json({
      message: "Erro ao registrar venda.",
      error: error.message,
    });
  }
}

async function importFinanceSaleBackfill(req, res) {
  try {
    const preview = await buildSaleBackfillPreview(req.body?.vehicleIds);

    if (!preview.candidates.length) {
      return res.status(200).json({
        importedCount: 0,
        skippedCount: preview.totals.skippedMissingPriceCount,
        imported: [],
      });
    }

    const importedEntries = await FinanceEntry.insertMany(
      preview.candidates.map((candidate) => ({
        kind: TYPE_META.sale.kind,
        type: "sale",
        entryDate: candidate.suggestedEntryDate,
        description: candidate.vehicleName,
        category: TYPE_META.sale.category,
        amount: candidate.amount,
        notes: "Importado retroativamente do cadastro de veiculos vendidos.",
        vehicleId: candidate.vehicleId,
        vehicleName: candidate.vehicleName,
        source: "vehicle_sale",
        metadata: {
          previousVehicleStatus: "vendido",
          importedByBackfill: true,
          inferredEntryDateFrom: candidate.inferredFrom,
        },
      })),
      { ordered: false },
    );

    return res.status(201).json({
      importedCount: importedEntries.length,
      skippedCount: preview.totals.skippedMissingPriceCount,
      imported: importedEntries.map(serializeFinanceEntry),
    });
  } catch (error) {
    return res.status(400).json({
      message: "Erro ao importar vendas antigas.",
      error: error.message,
    });
  }
}

async function deleteFinanceEntry(req, res) {
  try {
    const entryId = normalizeString(req.params?.id);

    if (!mongoose.isValidObjectId(entryId)) {
      return res.status(404).json({ message: "Lancamento nao encontrado." });
    }

    const entry = await FinanceEntry.findById(entryId);
    if (!entry) {
      return res.status(404).json({ message: "Lancamento nao encontrado." });
    }

    if (entry.type === "sale" && entry.vehicleId) {
      const vehicle = await Vehicle.findById(entry.vehicleId);
      const previousStatus = isRecord(entry.metadata)
        ? normalizeString(entry.metadata.previousVehicleStatus)
        : "";

      if (vehicle && VEHICLE_STATUS_VALUES.has(previousStatus)) {
        vehicle.status = previousStatus;
        await vehicle.save();
      }
    }

    await entry.deleteOne();

    return res.status(200).json({ message: "Lancamento removido com sucesso." });
  } catch (error) {
    return res.status(500).json({ message: "Erro ao remover lancamento." });
  }
}

module.exports = {
  getFinanceOverview,
  getFinanceSaleBackfillPreview,
  createFinanceEntry,
  createFinanceSale,
  importFinanceSaleBackfill,
  deleteFinanceEntry,
};
