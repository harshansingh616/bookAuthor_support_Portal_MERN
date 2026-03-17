const mongoose = require("mongoose");

const TicketMessageSchema = new mongoose.Schema(
  {
    ticketRef: { type: mongoose.Schema.Types.ObjectId, ref: "Ticket", required: true, index: true },
    senderRole: { type: String, required: true, enum: ["author", "admin"] },
    senderUserRef: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    message: { type: String, required: true },

    attachments: {
      type: [
        {
          fileName: String,
          mimeType: String,
          url: String,
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

TicketMessageSchema.index({ ticketRef: 1, createdAt: 1 });

module.exports = mongoose.model("TicketMessage", TicketMessageSchema);