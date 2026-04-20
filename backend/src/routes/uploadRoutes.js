const express = require("express");
const upload = require("../middleware/upload");
const { deleteImages, uploadImages } = require("../controllers/uploadController");

const router = express.Router();

router.post("/images", upload.array("images", 10), uploadImages);
router.delete("/images", deleteImages);

module.exports = router;
