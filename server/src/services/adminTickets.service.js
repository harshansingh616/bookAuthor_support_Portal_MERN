const mongoose = require("mongoose");
const { HttpError } = require("../utils/httpError");
const Ticket = require("../models/Ticket");
const TicketMessage = require("../models/TicketMessage");
const Book = require("../models/Book");
const sseHub = require("../realtime/sseHub");

function parseOptionalDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function listTickets(query) {
  const match = {};

  if (query.status) match.status = query.status;
  if (query.category) match.category = query.category;
  if (query.priority) match.priority = query.priority;

  const from = parseOptionalDate(query.from);
  const to = parseOptionalDate(query.to);
  if (from || to) {
    match.createdAt = {};
    if (from) match.createdAt.$gte = from;
    if (to) match.createdAt.$lte = to;
  }

  if (query.q) match.subject = { $regex: query.q, $options: "i" };

  const pipeline = [
    { $match: match },
    {
      $addFields: {
        priorityRank: {
          $switch: {
            branches: [
              { case: { $eq: ["$priority", "Critical"] }, then: 1 },
              { case: { $eq: ["$priority", "High"] }, then: 2 },
              { case: { $eq: ["$priority", "Medium"] }, then: 3 },
              { case: { $eq: ["$priority", "Low"] }, then: 4 },
            ],
            default: 5,
          },
        },
        statusRank: {
          $switch: {
            branches: [
              { case: { $eq: ["$status", "Open"] }, then: 1 },
              { case: { $eq: ["$status", "In Progress"] }, then: 2 },
              { case: { $eq: ["$status", "Resolved"] }, then: 3 },
              { case: { $eq: ["$status", "Closed"] }, then: 4 },
            ],
            default: 5,
          },
        },
      },
    },
    { $sort: { statusRank: 1, priorityRank: 1, createdAt: 1 } },
    { $limit: 200 },
  ];

  const tickets = await Ticket.aggregate(pipeline);

  const bookIds = tickets.map((t) => t.bookRef).filter(Boolean);
  const books = await Book.find({ _id: { $in: bookIds } }).select("externalBookId title").lean();
  const bookMap = new Map(books.map((b) => [String(b._id), b]));

  return tickets.map((t) => ({
    ...t,
    bookRef: t.bookRef ? bookMap.get(String(t.bookRef)) || null : null,
  }));
}

async function getTicketDetail(ticketId) {
  const ticket = await Ticket.findById(ticketId).populate("bookRef", "externalBookId title").lean();
  if (!ticket) throw new HttpError(404, "Ticket not found");

  const messages = await TicketMessage.find({ ticketRef: ticket._id }).sort({ createdAt: 1 }).lean();
  return { ticket, messages };
}

async function replyToTicket({ ticketId, adminUserId, message }) {
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) throw new HttpError(404, "Ticket not found");

  const msg = await TicketMessage.create({
    ticketRef: ticket._id,
    senderRole: "admin",
    senderUserRef: adminUserId,
    message,
  });

  ticket.lastActivityAt = new Date();
  await ticket.save();

  sseHub.publishToAuthor(ticket.authorRef, "ticket.message.created", {
    ticketId: String(ticket._id),
    message: {
      id: String(msg._id),
      senderRole: msg.senderRole,
      message: msg.message,
      createdAt: msg.createdAt,
    },
  });

  return { ok: true };
}

async function updateTicket({ ticketId, patch }) {
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) throw new HttpError(404, "Ticket not found");

  const changed = {};

  if (patch.status) {
    ticket.status = patch.status;
    changed.status = patch.status;
  }

  if (patch.category) {
    ticket.category = patch.category;
    ticket.categorySource = "manual";
    changed.category = patch.category;
  }

  if (patch.priority) {
    ticket.priority = patch.priority;
    ticket.prioritySource = "manual";
    changed.priority = patch.priority;
  }

  if (typeof patch.internalNotes === "string") {
    ticket.internalNotes = patch.internalNotes;
    changed.internalNotes = true;
  }

  if (patch.assigneeUserId !== undefined) {
    ticket.assigneeUserRef = patch.assigneeUserId
      ? new mongoose.Types.ObjectId(patch.assigneeUserId)
      : null;
    changed.assigneeUserId = patch.assigneeUserId ?? null;
  }

  ticket.lastActivityAt = new Date();
  await ticket.save();

  sseHub.publishToAuthor(ticket.authorRef, "ticket.updated", {
    ticketId: String(ticket._id),
    changed,
    status: ticket.status,
    category: ticket.category,
    priority: ticket.priority,
    lastActivityAt: ticket.lastActivityAt,
  });

  return { ok: true };
}

module.exports = { listTickets, getTicketDetail, replyToTicket, updateTicket };