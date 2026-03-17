const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const { env } = require("../config/env");
const { hashPassword } = require("../utils/password");

const User = require("../models/User");
const Author = require("../models/Author");
const Book = require("../models/Book");

function parseDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function upsertAdmin() {
  const email = "admin@bookleaf.test";
  const password = "Admin@12345";

  const existing = await User.findOne({ email });
  if (existing) return { email, password };

  const passwordHash = await hashPassword(password);
  await User.create({ email, passwordHash, role: "admin", name: "BookLeaf Admin" });

  return { email, password };
}

async function upsertAuthor(authorJson) {
  const email = String(authorJson.email).toLowerCase().trim();
  const defaultPassword = "Author@12345";

  let user = await User.findOne({ email });

  if (!user) {
    const passwordHash = await hashPassword(defaultPassword);
    user = await User.create({
      email,
      passwordHash,
      role: "author",
      name: authorJson.name || "",
    });
  }

  let author = await Author.findOne({ externalAuthorId: authorJson.author_id });

  if (!author) {
    author = await Author.create({
      externalAuthorId: authorJson.author_id,
      userRef: user._id,
      phone: authorJson.phone || "",
      city: authorJson.city || "",
      joinedDate: parseDate(authorJson.joined_date),
    });
  }

  if (!user.authorRef) {
    user.authorRef = author._id;
    await user.save();
  }

  return { user, author, defaultPassword };
}

async function upsertBook(bookJson, authorRef) {
  const externalBookId = bookJson.book_id;

  const update = {
    externalBookId,
    authorRef,

    title: bookJson.title || "",
    isbn: bookJson.isbn || "",
    genre: bookJson.genre || "",
    publicationDate: parseDate(bookJson.publication_date),
    status: bookJson.status || "",

    mrp: bookJson.mrp ?? null,
    authorRoyaltyPerCopy: bookJson.author_royalty_per_copy ?? null,

    totalCopiesSold: bookJson.total_copies_sold ?? 0,
    totalRoyaltyEarned: bookJson.total_royalty_earned ?? 0,
    royaltyPaid: bookJson.royalty_paid ?? 0,
    royaltyPending: bookJson.royalty_pending ?? 0,

    lastRoyaltyPayoutDate: parseDate(bookJson.last_royalty_payout_date),
    printPartner: bookJson.print_partner || "",
    availableOn: Array.isArray(bookJson.available_on) ? bookJson.available_on : [],
  };

  await Book.updateOne({ externalBookId }, { $set: update }, { upsert: true });
}

async function main() {
  await mongoose.connect(env.mongoUri);

  const datasetPath = path.join(__dirname, "bookleaf_sample_data.json");
  if (!fs.existsSync(datasetPath)) {
    throw new Error(`Dataset missing at: ${datasetPath}`);
  }

  const raw = fs.readFileSync(datasetPath, "utf-8");
  const data = JSON.parse(raw);

  const adminCreds = await upsertAdmin();

  const authors = Array.isArray(data.authors) ? data.authors : [];
  let bookCount = 0;

  for (const a of authors) {
    const { author, defaultPassword } = await upsertAuthor(a);

    const books = Array.isArray(a.books) ? a.books : [];
    for (const b of books) {
      await upsertBook(b, author._id);
      bookCount += 1;
    }

    
    if (a === authors[0]) {
      console.log("Default Author password:", defaultPassword);
    }
  }

  console.log("Seed complete.");
  console.log("Admin login:", adminCreds.email, adminCreds.password);
  console.log("Authors seeded:", authors.length);
  console.log("Books seeded:", bookCount);

  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});