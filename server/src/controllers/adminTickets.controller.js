const adminTicketsService = require("../services/adminTickets.service");

async function list(req, res) {
  const tickets = await adminTicketsService.listTickets(req.query);
  res.json({ tickets });
}

async function detail(req, res) {
  const { ticketId } = req.params;
  const data = await adminTicketsService.getTicketDetail(ticketId);
  res.json(data);
}

async function reply(req, res) {
  const { ticketId } = req.params;
  const result = await adminTicketsService.replyToTicket({
    ticketId,
    adminUserId: req.user.id,
    message: req.body.message,
  });
  res.json(result);
}

async function update(req, res) {
  const { ticketId } = req.params;
  const result = await adminTicketsService.updateTicket({
    ticketId,
    patch: req.body,
    adminUserId: req.user.id,
  });
  res.json(result);
}

module.exports = { list, detail, reply, update };