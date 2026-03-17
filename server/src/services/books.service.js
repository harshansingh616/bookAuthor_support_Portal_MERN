const { HttpError } = require("../utils/httpError");
const Book = require("../models/Book");

async function getMyBooks(authorRef) {
  if (!authorRef) throw new HttpError(400, "Author profile not linked");

  const books = await Book.find({ authorRef }).sort({ createdAt: -1 }).lean();
  return books;
}

module.exports = { getMyBooks };