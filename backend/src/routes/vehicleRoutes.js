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
const attachAdminAuth = require("../middleware/attachAdminAuth");
const requireAdminAuth = require("../middleware/requireAdminAuth");

const router = express.Router();

router.get("/analytics/overview", requireAdminAuth, getAnalyticsOverview);
router.get("/", attachAdminAuth, getVehicles);
router.post("/:id/view", trackVehicleView);
router.post("/:id/whatsapp-click", trackVehicleWhatsappClick);
router.get("/:id", attachAdminAuth, getVehicleById);
router.post("/", requireAdminAuth, createVehicle);
router.put("/:id", requireAdminAuth, updateVehicle);
router.delete("/:id", requireAdminAuth, deleteVehicle);

module.exports = router;
