const express = require("express");
const { asyncHandler } = require("../utils/asyncHandler");
const { requireAuth, requireRole } = require("../middleware/auth");
const booksController = require("../controllers/books.controller");

const router = express.Router();

router.get("/my", requireAuth, requireRole("author"), asyncHandler(booksController.myBooks));

module.exports = router;