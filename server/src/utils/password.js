const bcrypt = require("bcrypt");

async function hashPassword(plainPassword) {
  const saltRounds = 12;
  return bcrypt.hash(plainPassword, saltRounds);
}

async function verifyPassword(plainPassword, passwordHash) {
  return bcrypt.compare(plainPassword, passwordHash);
}

module.exports = { hashPassword, verifyPassword };