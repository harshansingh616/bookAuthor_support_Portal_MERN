const express = require("express");
const { asyncHandler } = require("../utils/asyncHandler");
const { requireAuth, requireRole } = require("../middleware/auth");
const { validateBody } = require("../middleware/validate");
const { createTicketSchema } = require("../validators/tickets.schemas");
const ticketsController = require("../controllers/tickets.controller");
const ticketsStreamController = require("../controllers/ticketsStream.controller");

const router = express.Router();

// SSE stream for author updates
router.get("/stream", requireAuth, requireRole("author"), ticketsStreamController.stream);

router.post(
  "/",
  requireAuth,
  requireRole("author"),
  validateBody(createTicketSchema),
  asyncHandler(ticketsController.create)
);

router.get("/my", requireAuth, requireRole("author"), asyncHandler(ticketsController.myList));
router.get("/my/:ticketId", requireAuth, requireRole("author"), asyncHandler(ticketsController.myDetail));

module.exports = router;