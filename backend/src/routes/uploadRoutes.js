const express = require("express");
const upload = require("../middleware/upload");
const { deleteImages, uploadImages } = require("../controllers/uploadController");
const requireAdminAuth = require("../middleware/requireAdminAuth");

const router = express.Router();

router.post("/images", requireAdminAuth, upload.array("images", 10), uploadImages);
router.delete("/images", requireAdminAuth, deleteImages);

module.exports = router;
