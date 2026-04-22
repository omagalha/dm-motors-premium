const express = require("express");
const {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} = require("../controllers/vehicleController");
const {
  getAnalyticsOverview,
  trackVehicleView,
  trackVehicleWhatsappClick,
} = require("../controllers/vehicleAnalyticsController");
const {
  getVehicleDocumentPayload,
  getVehicleDocumentReadiness,
  startSaleContractWorkflow,
  saleContractWorkflowCallback,
  downloadSaleContractDocument,
  resetSaleContractWorkflow,
} = require("../controllers/vehicleDocumentController");
const attachAdminAuth = require("../middleware/attachAdminAuth");
const requireAdminAuth = require("../middleware/requireAdminAuth");

const router = express.Router();

router.get("/analytics/overview", requireAdminAuth, getAnalyticsOverview);
router.get("/", attachAdminAuth, getVehicles);
router.post("/:id/view", trackVehicleView);
router.post("/:id/whatsapp-click", trackVehicleWhatsappClick);
router.get("/:id/document-payload", requireAdminAuth, getVehicleDocumentPayload);
router.get("/:id/document-readiness", requireAdminAuth, getVehicleDocumentReadiness);
router.post(
  "/:id/document-workflows/sale-contract",
  requireAdminAuth,
  startSaleContractWorkflow,
);
router.post(
  "/:id/document-workflows/sale-contract/callback",
  saleContractWorkflowCallback,
);
router.get(
  "/:id/document-workflows/sale-contract/download",
  requireAdminAuth,
  downloadSaleContractDocument,
);
router.post(
  "/:id/document-workflows/sale-contract/reset",
  requireAdminAuth,
  resetSaleContractWorkflow,
);
router.get("/:id", attachAdminAuth, getVehicleById);
router.post("/", requireAdminAuth, createVehicle);
router.put("/:id", requireAdminAuth, updateVehicle);
router.delete("/:id", requireAdminAuth, deleteVehicle);

module.exports = router;
