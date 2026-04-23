function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

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

function normalizeBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function normalizeStringArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/[,\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeDateOnly(value, fallback = "") {
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

function serializeDateValue(value) {
  if (!value) return "";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return normalizeString(value);
  }

  return parsed.toISOString();
}

function serializeDateOnly(value) {
  return normalizeDateOnly(value, "");
}

module.exports = {
  isRecord,
  normalizeString,
  normalizeNumber,
  normalizeBoolean,
  normalizeStringArray,
  normalizeDateOnly,
  serializeDateValue,
  serializeDateOnly,
  getTodayDate,
};
