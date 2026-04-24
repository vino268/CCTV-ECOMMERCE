const express = require("express");
const { getAdminProfile } = require("../controllers/adminController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/profile", protect, adminOnly, getAdminProfile);

module.exports = router;
