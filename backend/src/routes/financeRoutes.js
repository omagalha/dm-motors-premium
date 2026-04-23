const express = require("express");
const requireAdminAuth = require("../middleware/requireAdminAuth");
const {
  getFinanceOverview,
  getFinanceSaleBackfillPreview,
  createFinanceEntry,
  createFinanceSale,
  importFinanceSaleBackfill,
  deleteFinanceEntry,
} = require("../controllers/financeController");

const router = express.Router();

router.get("/overview", requireAdminAuth, getFinanceOverview);
router.get("/backfill-sales/preview", requireAdminAuth, getFinanceSaleBackfillPreview);
router.post("/entries", requireAdminAuth, createFinanceEntry);
router.post("/sales", requireAdminAuth, createFinanceSale);
router.post("/backfill-sales", requireAdminAuth, importFinanceSaleBackfill);
router.delete("/entries/:id", requireAdminAuth, deleteFinanceEntry);

module.exports = router;
