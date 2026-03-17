const mongoose = require("mongoose");

const BookSchema = new mongoose.Schema(
  {
    externalBookId: { type: String, required: true, unique: true, index: true }, // BK001
    authorRef: { type: mongoose.Schema.Types.ObjectId, ref: "Author", required: true, index: true },

    title: { type: String, required: true },
    isbn: { type: String, default: "" },
    genre: { type: String, default: "" },
    publicationDate: { type: Date, default: null },
    status: { type: String, default: "" },

    mrp: { type: Number, default: null },
    authorRoyaltyPerCopy: { type: Number, default: null },

    totalCopiesSold: { type: Number, default: 0 },
    totalRoyaltyEarned: { type: Number, default: 0 },
    royaltyPaid: { type: Number, default: 0 },
    royaltyPending: { type: Number, default: 0 },

    lastRoyaltyPayoutDate: { type: Date, default: null },
    printPartner: { type: String, default: "" },
    availableOn: { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Book", BookSchema);