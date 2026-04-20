const express = require("express");
const {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} = require("../controllers/vehicleController");
const attachAdminAuth = require("../middleware/attachAdminAuth");
const requireAdminAuth = require("../middleware/requireAdminAuth");

const router = express.Router();

router.get("/", attachAdminAuth, getVehicles);
router.get("/:id", attachAdminAuth, getVehicleById);
router.post("/", requireAdminAuth, createVehicle);
router.put("/:id", requireAdminAuth, updateVehicle);
router.delete("/:id", requireAdminAuth, deleteVehicle);

module.exports = router;
