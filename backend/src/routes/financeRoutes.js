const express = require("express");
const requireAdminAuth = require("../middleware/requireAdminAuth");
const requireGeneralFinanceAccess = require("../middleware/requireGeneralFinanceAccess");
const {
  getFinanceOverview,
  getFinanceSaleBackfillPreview,
  createFinanceEntry,
  createFinanceSale,
  importFinanceSaleBackfill,
  deleteFinanceEntry,
} = require("../controllers/financeController");

const router = express.Router();

router.get("/overview", requireAdminAuth, requireGeneralFinanceAccess, getFinanceOverview);
router.get(
  "/backfill-sales/preview",
  requireAdminAuth,
  requireGeneralFinanceAccess,
  getFinanceSaleBackfillPreview,
);
router.post("/entries", requireAdminAuth, requireGeneralFinanceAccess, createFinanceEntry);
router.post("/sales", requireAdminAuth, requireGeneralFinanceAccess, createFinanceSale);
router.post(
  "/backfill-sales",
  requireAdminAuth,
  requireGeneralFinanceAccess,
  importFinanceSaleBackfill,
);
router.delete("/entries/:id", requireAdminAuth, requireGeneralFinanceAccess, deleteFinanceEntry);

module.exports = router;
