const booksService = require("../services/books.service");

async function myBooks(req, res) {
  const books = await booksService.getMyBooks(req.user.authorRef);
  res.json({ books });
}

module.exports = { myBooks };