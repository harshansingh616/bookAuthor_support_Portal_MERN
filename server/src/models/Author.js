const mongoose = require("mongoose");

const AuthorSchema = new mongoose.Schema(
  {
    externalAuthorId: { type: String, required: true, unique: true, index: true }, // AUTH001
    userRef: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },

    phone: { type: String, default: "" },
    city: { type: String, default: "" },
    joinedDate: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Author", AuthorSchema);