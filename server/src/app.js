const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const healthRoutes = require("./routes/health.routes");
const authRoutes = require("./routes/auth.routes");
const booksRoutes = require("./routes/books.routes");
const ticketsRoutes = require("./routes/tickets.routes");
const adminTicketsRoutes = require("./routes/adminTickets.routes");
const { errorHandler } = require("./middleware/error");

function createApp() {
  const app = express();

  app.use(cors({ origin: true }));
  app.use(express.json());

  morgan.token("cleanUrl", (req) => (req.originalUrl || "").split("?")[0]);
  app.use(morgan(":method :cleanUrl :status :response-time ms"));

  app.use("/api", healthRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/books", booksRoutes);
  app.use("/api/tickets", ticketsRoutes);
  app.use("/api/admin/tickets", adminTicketsRoutes);

  app.use(errorHandler);

  return app;
}

module.exports = { createApp };