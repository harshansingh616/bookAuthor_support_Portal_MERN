const { HttpError } = require("../utils/httpError");
const Author = require("../models/Author");
const Book = require("../models/Book");
const Ticket = require("../models/Ticket");
const TicketMessage = require("../models/TicketMessage");
const sseHub = require("../realtime/sseHub");

async function createTicket({ userId, authorRef, bookExternalId, subject, description }) {
  if (!authorRef) throw new HttpError(400, "Author profile not linked");

  const author = await Author.findById(authorRef).lean();
  if (!author) throw new HttpError(400, "Author profile not found");

  let bookRef = null;
  let bookSnapshot = null;

  if (bookExternalId) {
    const book = await Book.findOne({ externalBookId: bookExternalId, authorRef }).lean();
    if (!book) throw new HttpError(400, "Invalid book selection for this author");
    bookRef = book._id;
    bookSnapshot = { externalBookId: book.externalBookId, title: book.title };
  }

  const ticket = await Ticket.create({
    authorRef,
    bookRef,
    subject,
    description,
    lastActivityAt: new Date(),
  });

  const msg = await TicketMessage.create({
    ticketRef: ticket._id,
    senderRole: "author",
    senderUserRef: userId,
    message: description,
  });

  const ticketId = String(ticket._id);

  sseHub.publishToAuthor(authorRef, "ticket.created", {
    ticketId,
    subject: ticket.subject,
    status: ticket.status,
    category: ticket.category,
    priority: ticket.priority,
    book: bookSnapshot,
    createdAt: ticket.createdAt,
  });

  sseHub.publishToAuthor(authorRef, "ticket.message.created", {
    ticketId,
    message: {
      id: String(msg._id),
      senderRole: msg.senderRole,
      message: msg.message,
      createdAt: msg.createdAt,
    },
  });

  return { id: ticketId };
}

async function listMyTickets(authorRef) {
  if (!authorRef) throw new HttpError(400, "Author profile not linked");

  const tickets = await Ticket.find({ authorRef })
    .sort({ lastActivityAt: -1 })
    .populate("bookRef", "externalBookId title")
    .lean();

  return tickets;
}

async function getMyTicketDetail({ authorRef, ticketId }) {
  if (!authorRef) throw new HttpError(400, "Author profile not linked");

  const ticket = await Ticket.findOne({ _id: ticketId, authorRef })
    .populate("bookRef", "externalBookId title")
    .lean();

  if (!ticket) throw new HttpError(404, "Ticket not found");

  const messages = await TicketMessage.find({ ticketRef: ticket._id })
    .sort({ createdAt: 1 })
    .lean();

  return { ticket, messages };
}

module.exports = { createTicket, listMyTickets, getMyTicketDetail };