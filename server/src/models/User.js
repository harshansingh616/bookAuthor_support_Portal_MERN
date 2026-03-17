const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true, enum: ["author", "admin"] },
    name: { type: String, default: "" },
    authorRef: { type: mongoose.Schema.Types.ObjectId, ref: "Author", default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);