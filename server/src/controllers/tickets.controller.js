const ticketsService = require("../services/tickets.service");

async function create(req, res) {
  const result = await ticketsService.createTicket({
    userId: req.user.id,
    authorRef: req.user.authorRef,
    ...req.body,
  });

  res.status(201).json(result);
}

async function myList(req, res) {
  const tickets = await ticketsService.listMyTickets(req.user.authorRef);
  res.json({ tickets });
}

async function myDetail(req, res) {
  const { ticketId } = req.params;
  const data = await ticketsService.getMyTicketDetail({ authorRef: req.user.authorRef, ticketId });
  res.json(data);
}

module.exports = { create, myList, myDetail };