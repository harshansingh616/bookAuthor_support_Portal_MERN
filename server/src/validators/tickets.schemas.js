const { z } = require("zod");

const ticketCategoryEnum = z.enum([
  "Royalty & Payments",
  "ISBN & Metadata Issues",
  "Printing & Quality",
  "Distribution & Availability",
  "Book Status & Production Updates",
  "General Inquiry",
]);

const ticketPriorityEnum = z.enum(["Critical", "High", "Medium", "Low"]);
const ticketStatusEnum = z.enum(["Open", "In Progress", "Resolved", "Closed"]);

const createTicketSchema = z.object({
  bookExternalId: z.string().trim().min(1).nullable().optional(), 
  subject: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(5000),
});

const adminReplySchema = z.object({
  message: z.string().trim().min(2).max(5000),
});

const adminUpdateTicketSchema = z.object({
  status: ticketStatusEnum.optional(),
  category: ticketCategoryEnum.optional(),
  priority: ticketPriorityEnum.optional(),
  internalNotes: z.string().max(5000).optional(),
  assigneeUserId: z.string().trim().min(1).nullable().optional(),
});

const adminTicketListQuerySchema = z.object({
  status: ticketStatusEnum.optional(),
  category: ticketCategoryEnum.optional(),
  priority: ticketPriorityEnum.optional(),
  from: z.string().optional(), // ISO date string; parse in service
  to: z.string().optional(),
  q: z.string().trim().optional(), // search in subject
});

module.exports = {
  createTicketSchema,
  adminReplySchema,
  adminUpdateTicketSchema,
  adminTicketListQuerySchema,
};