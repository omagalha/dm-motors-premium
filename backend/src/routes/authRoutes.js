const express = require("express");
const { getSession, login, logout } = require("../controllers/authController");
const requireAdminAuth = require("../middleware/requireAdminAuth");

const router = express.Router();

router.post("/login", login);
router.get("/session", requireAdminAuth, getSession);
router.post("/logout", requireAdminAuth, logout);

module.exports = router;
