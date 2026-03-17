const mongoose = require("mongoose");
const { HttpError } = require("../utils/httpError");
const Ticket = require("../models/Ticket");
const TicketMessage = require("../models/TicketMessage");
const Book = require("../models/Book");
const Author = require("../models/Author");
const User = require("../models/User");
const sseHub = require("../realtime/sseHub");
const ticketsAi = require("../ai/ticketsAi.service");
const { env } = require("../config/env");

function parseOptionalDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function hydrateBooks(tickets) {
  const bookIds = tickets.map((t) => t.bookRef).filter(Boolean);
  if (bookIds.length === 0) return new Map();

  const books = await Book.find({ _id: { $in: bookIds } }).select("externalBookId title").lean();
  return new Map(books.map((b) => [String(b._id), b]));
}

async function hydrateAuthors(tickets) {
  const authorIds = tickets.map((t) => t.authorRef).filter(Boolean);
  if (authorIds.length === 0) return new Map();

  const authors = await Author.find({ _id: { $in: authorIds } }).select("externalAuthorId userRef").lean();
  const userIds = authors.map((a) => a.userRef).filter(Boolean);

  const users = await User.find({ _id: { $in: userIds } }).select("email name").lean();
  const userMap = new Map(users.map((u) => [String(u._id), u]));

  const authorMap = new Map();
  for (const a of authors) {
    const u = a.userRef ? userMap.get(String(a.userRef)) : null;
    authorMap.set(String(a._id), {
      externalAuthorId: a.externalAuthorId,
      name: u?.name || "",
      email: u?.email || "",
    });
  }

  return authorMap;
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
  const bookMap = await hydrateBooks(tickets);
  const authorMap = await hydrateAuthors(tickets);

  return tickets.map((t) => ({
    ...t,
    book: t.bookRef ? bookMap.get(String(t.bookRef)) || null : null,
    author: authorMap.get(String(t.authorRef)) || null,
  }));
}

async function getTicketDetail(ticketId) {
  const ticket = await Ticket.findById(ticketId)
    .populate("bookRef", "externalBookId title")
    .populate({
      path: "authorRef",
      select: "externalAuthorId userRef",
      populate: { path: "userRef", select: "email name" },
    })
    .lean();

  if (!ticket) throw new HttpError(404, "Ticket not found");

  const messages = await TicketMessage.find({ ticketRef: ticket._id }).sort({ createdAt: 1 }).lean();

  const author = ticket.authorRef
    ? {
        externalAuthorId: ticket.authorRef.externalAuthorId,
        email: ticket.authorRef.userRef?.email || "",
        name: ticket.authorRef.userRef?.name || "",
      }
    : null;

  return {
    ticket: {
      ...ticket,
      author,
      book: ticket.bookRef ? { externalBookId: ticket.bookRef.externalBookId, title: ticket.bookRef.title } : null,
    },
    messages,
  };
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
    ticket.assigneeUserRef = patch.assigneeUserId ? new mongoose.Types.ObjectId(patch.assigneeUserId) : null;
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

// NEW: AI draft endpoint with caching
async function getOrCreateDraft({ ticketId, force = false }) {
  if (!env.groqApiKey) throw new HttpError(503, "AI not configured (missing GROQ_API_KEY)");

  const ticket = await Ticket.findById(ticketId).lean();
  if (!ticket) throw new HttpError(404, "Ticket not found");

  const cached = ticket.ai?.draft?.draft;
  const cachedAt = ticket.ai?.draft?.createdAt ? new Date(ticket.ai.draft.createdAt) : null;
  const ticketUpdatedAt = ticket.updatedAt ? new Date(ticket.updatedAt) : null;

  if (!force && cached && cachedAt && ticketUpdatedAt && cachedAt >= ticketUpdatedAt) {
    return { draft: cached, cached: true, model: ticket.ai.draft.model || env.groqModel };
  }

  const author = await Author.findById(ticket.authorRef).select("externalAuthorId userRef").lean();
  const user = author?.userRef ? await User.findById(author.userRef).select("email name").lean() : null;

  const book = ticket.bookRef
    ? await Book.findById(ticket.bookRef)
        .select("externalBookId title isbn status mrp totalCopiesSold totalRoyaltyEarned royaltyPaid royaltyPending lastRoyaltyPayoutDate printPartner availableOn")
        .lean()
    : null;

  try {
    const draftRes = await ticketsAi.draftAdminReply({
      ticket,
      author: {
        externalAuthorId: author?.externalAuthorId || "",
        email: user?.email || "",
        name: user?.name || "",
      },
      book: book
        ? {
            externalBookId: book.externalBookId,
            title: book.title,
            isbn: book.isbn,
            status: book.status,
            mrp: book.mrp,
            totalCopiesSold: book.totalCopiesSold,
            totalRoyaltyEarned: book.totalRoyaltyEarned,
            royaltyPaid: book.royaltyPaid,
            royaltyPending: book.royaltyPending,
            lastRoyaltyPayoutDate: book.lastRoyaltyPayoutDate,
            printPartner: book.printPartner,
            availableOn: book.availableOn,
          }
        : null,
    });

    await Ticket.updateOne(
      { _id: ticket._id },
      {
        $set: {
          "ai.draft": {
            model: draftRes._meta.model,
            draft: draftRes.draft,
            usage: draftRes._meta.usage,
            createdAt: new Date(),
          },
        },
      }
    );

    return { draft: draftRes.draft, cached: false, model: draftRes._meta.model };
  } catch (err) {
    await Ticket.updateOne(
      { _id: ticket._id },
      { $set: { "ai.draft": { error: err.message || "AI draft failed", createdAt: new Date() } } }
    );
    throw err;
  }
}

module.exports = {
  listTickets,
  getTicketDetail,
  replyToTicket,
  updateTicket,
  getOrCreateDraft,
};