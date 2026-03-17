const mongoose = require("mongoose");

const TicketSchema = new mongoose.Schema(
  {
    authorRef: { type: mongoose.Schema.Types.ObjectId, ref: "Author", required: true, index: true },
    bookRef: { type: mongoose.Schema.Types.ObjectId, ref: "Book", default: null, index: true },

    subject: { type: String, required: true },
    description: { type: String, required: true },

    status: { type: String, required: true, enum: ["Open", "In Progress", "Resolved", "Closed"], default: "Open" },

    category: {
      type: String,
      required: true,
      enum: [
        "Royalty & Payments",
        "ISBN & Metadata Issues",
        "Printing & Quality",
        "Distribution & Availability",
        "Book Status & Production Updates",
        "General Inquiry",
      ],
      default: "General Inquiry",
    },
    categorySource: { type: String, enum: ["manual", "ai"], default: "manual" },

    priority: { type: String, required: true, enum: ["Critical", "High", "Medium", "Low"], default: "Medium" },
    prioritySource: { type: String, enum: ["manual", "ai"], default: "manual" },

    assigneeUserRef: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    internalNotes: { type: String, default: "" },

    lastActivityAt: { type: Date, default: () => new Date(), index: true },
  },
  { timestamps: true }
);

TicketSchema.index({ status: 1, priority: 1, createdAt: 1 });

module.exports = mongoose.model("Ticket", TicketSchema);