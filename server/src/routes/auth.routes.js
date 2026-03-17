const express = require("express");
const { asyncHandler } = require("../utils/asyncHandler");
const { validateBody } = require("../middleware/validate");
const { loginSchema } = require("../validators/auth.schemas");
const { requireAuth } = require("../middleware/auth");
const authController = require("../controllers/auth.controller");

const router = express.Router();

router.post("/login", validateBody(loginSchema), asyncHandler(authController.login));
router.get("/me", requireAuth, asyncHandler(authController.me));

module.exports = router;