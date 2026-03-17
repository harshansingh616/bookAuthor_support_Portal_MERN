const express = require("express");
const { asyncHandler } = require("../utils/asyncHandler");
const { requireAuth, requireRole } = require("../middleware/auth");
const { validateBody, validateQuery } = require("../middleware/validate");
const {
  adminReplySchema,
  adminUpdateTicketSchema,
  adminTicketListQuerySchema,
  adminDraftQuerySchema,
} = require("../validators/tickets.schemas");
const adminTicketsController = require("../controllers/adminTickets.controller");

const router = express.Router();

router.get("/", requireAuth, requireRole("admin"), validateQuery(adminTicketListQuerySchema), asyncHandler(adminTicketsController.list));
router.get("/:ticketId", requireAuth, requireRole("admin"), asyncHandler(adminTicketsController.detail));
router.get("/:ticketId/draft", requireAuth, requireRole("admin"), validateQuery(adminDraftQuerySchema), asyncHandler(adminTicketsController.draft));
router.post("/:ticketId/reply", requireAuth, requireRole("admin"), validateBody(adminReplySchema), asyncHandler(adminTicketsController.reply));
router.patch("/:ticketId", requireAuth, requireRole("admin"), validateBody(adminUpdateTicketSchema), asyncHandler(adminTicketsController.update));

module.exports = router;