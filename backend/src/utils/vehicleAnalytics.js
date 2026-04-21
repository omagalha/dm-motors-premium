const mongoose = require("mongoose");
const VehicleAnalytics = require("../models/VehicleAnalytics");
const VehicleAnalyticsDaily = require("../models/VehicleAnalyticsDaily");

const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
const TRACKING_SOURCE_FALLBACK = "unknown";

function normalizeString(value, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function normalizeNumber(value, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function normalizeDateString(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return "";
}

function normalizeTrackingKey(value, fallback = "") {
  const normalized = normalizeString(value, fallback)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || fallback;
}

function normalizeCounterRecord(value) {
  const source = value instanceof Map ? Object.fromEntries(value.entries()) : value;
  if (!source || typeof source !== "object" || Array.isArray(source)) {
    return {};
  }

  return Object.entries(source).reduce((acc, [key, count]) => {
    const normalizedKey = normalizeTrackingKey(key);
    const normalizedCount = normalizeNumber(count, 0);

    if (!normalizedKey || normalizedCount <= 0) {
      return acc;
    }

    acc[normalizedKey] = normalizedCount;
    return acc;
  }, {});
}

function buildDateKey(value = new Date()) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDayLabel(dateKey) {
  const parsed = new Date(`${dateKey}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return "";
  return DAY_LABELS[parsed.getDay()] ?? "";
}

function buildDateRange(days) {
  const safeDays = Math.min(Math.max(normalizeNumber(days, 7), 1), 30);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Array.from({ length: safeDays }, (_, index) => {
    const current = new Date(today);
    current.setDate(today.getDate() - (safeDays - index - 1));
    return buildDateKey(current);
  });
}

function buildEmptyMetricsSummary() {
  return {
    views: 0,
    whatsappClicks: 0,
  };
}

function serializeMetricsSummary(value) {
  if (!value || typeof value !== "object") {
    return buildEmptyMetricsSummary();
  }

  const metrics = {
    views: normalizeNumber(value.views, 0),
    whatsappClicks: normalizeNumber(value.whatsappClicks, 0),
  };

  const lastViewAt = normalizeDateString(value.lastViewAt);
  const lastWhatsappClickAt = normalizeDateString(value.lastWhatsappClickAt);
  const sources = normalizeCounterRecord(value.sources);

  if (lastViewAt) {
    metrics.lastViewAt = lastViewAt;
  }

  if (lastWhatsappClickAt) {
    metrics.lastWhatsappClickAt = lastWhatsappClickAt;
  }

  if (Object.keys(sources).length) {
    metrics.sources = sources;
  }

  return metrics;
}

function normalizeTrackingPayload(body = {}) {
  const payload = body && typeof body === "object" ? body : {};

  return {
    source: normalizeTrackingKey(payload.source, TRACKING_SOURCE_FALLBACK),
    campaign: normalizeTrackingKey(payload.campaign),
    utmSource: normalizeTrackingKey(payload.utm_source ?? payload.utmSource),
    utmMedium: normalizeTrackingKey(payload.utm_medium ?? payload.utmMedium),
  };
}

function buildCounterUpdate(prefix, key) {
  if (!key) return {};
  return { [`${prefix}.${key}`]: 1 };
}

async function getVehicleAnalyticsMap(vehicleIds = []) {
  const validVehicleIds = vehicleIds
    .map((vehicleId) =>
      vehicleId instanceof mongoose.Types.ObjectId ? vehicleId : String(vehicleId).trim(),
    )
    .filter(Boolean);

  if (!validVehicleIds.length) {
    return {};
  }

  const rows = await VehicleAnalytics.find({ vehicleId: { $in: validVehicleIds } }).lean();

  return rows.reduce((acc, row) => {
    acc[String(row.vehicleId)] = serializeMetricsSummary(row);
    return acc;
  }, {});
}

async function getVehicleAnalyticsSummary(vehicleId) {
  if (!vehicleId) return buildEmptyMetricsSummary();

  const row = await VehicleAnalytics.findOne({ vehicleId }).lean();
  return row ? serializeMetricsSummary(row) : buildEmptyMetricsSummary();
}

async function deleteVehicleAnalyticsSummary(vehicleId) {
  if (!vehicleId) return;
  await VehicleAnalytics.deleteOne({ vehicleId });
}

async function incrementVehicleAnalytics(vehicleId, eventType, tracking) {
  const now = new Date();
  const counterField = eventType === "whatsapp" ? "whatsappClicks" : "views";
  const lastField = eventType === "whatsapp" ? "lastWhatsappClickAt" : "lastViewAt";
  const dateKey = buildDateKey(now);

  const counterUpdates = {
    [counterField]: 1,
    ...buildCounterUpdate("sources", tracking.source),
    ...buildCounterUpdate("campaigns", tracking.campaign),
    ...buildCounterUpdate("utmSources", tracking.utmSource),
    ...buildCounterUpdate("utmMediums", tracking.utmMedium),
  };

  await Promise.all([
    VehicleAnalytics.updateOne(
      { vehicleId },
      {
        $inc: counterUpdates,
        $set: { [lastField]: now },
        $setOnInsert: { vehicleId },
      },
      { upsert: true },
    ),
    VehicleAnalyticsDaily.updateOne(
      { dateKey },
      {
        $inc: counterUpdates,
        $setOnInsert: { dateKey },
      },
      { upsert: true },
    ),
  ]);
}

async function getVehicleAnalyticsOverview(days = 7) {
  const dateRange = buildDateRange(days);
  const [summaryRows, dailyRows] = await Promise.all([
    VehicleAnalytics.find({}).lean(),
    VehicleAnalyticsDaily.find({ dateKey: { $in: dateRange } }).sort({ dateKey: 1 }).lean(),
  ]);

  const totals = summaryRows.reduce(
    (acc, row) => {
      const views = normalizeNumber(row.views, 0);
      const whatsappClicks = normalizeNumber(row.whatsappClicks, 0);
      const hasEngagement = views > 0 || whatsappClicks > 0;

      return {
        views: acc.views + views,
        whatsappClicks: acc.whatsappClicks + whatsappClicks,
        vehiclesWithEngagement: acc.vehiclesWithEngagement + (hasEngagement ? 1 : 0),
      };
    },
    { views: 0, whatsappClicks: 0, vehiclesWithEngagement: 0 },
  );

  const dailyMap = new Map(
    dailyRows.map((row) => [
      row.dateKey,
      {
        views: normalizeNumber(row.views, 0),
        whatsappClicks: normalizeNumber(row.whatsappClicks, 0),
      },
    ]),
  );

  const activity = dateRange.map((dateKey) => {
    const row = dailyMap.get(dateKey);

    return {
      day: getDayLabel(dateKey),
      date: dateKey,
      views: row?.views ?? 0,
      whatsappClicks: row?.whatsappClicks ?? 0,
    };
  });

  return {
    totals,
    activity,
  };
}

module.exports = {
  buildEmptyMetricsSummary,
  deleteVehicleAnalyticsSummary,
  getVehicleAnalyticsMap,
  getVehicleAnalyticsOverview,
  getVehicleAnalyticsSummary,
  incrementVehicleAnalytics,
  normalizeTrackingPayload,
  serializeMetricsSummary,
};
