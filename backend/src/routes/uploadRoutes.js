const express = require("express");
const upload = require("../middleware/upload");
const { uploadImages } = require("../controllers/uploadController");

const router = express.Router();

router.post("/images", upload.array("images", 10), uploadImages);

module.exports = router;
