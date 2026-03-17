const jwt = require("jsonwebtoken");
const { env } = require("../config/env");
const { HttpError } = require("../utils/httpError");
const { verifyPassword } = require("../utils/password");
const User = require("../models/User");

async function login({ email, password }) {
  const user = await User.findOne({ email });
  if (!user) throw new HttpError(401, "Invalid email or password");

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) throw new HttpError(401, "Invalid email or password");

  const token = jwt.sign(
    { sub: String(user._id), role: user.role },
    env.jwtSecret,
    { expiresIn: "7d" }
  );

  return {
    token,
    user: {
      id: String(user._id),
      email: user.email,
      role: user.role,
      name: user.name,
    },
  };
}

async function getMe(userId) {
  const user = await User.findById(userId).select("email role name authorRef").lean();
  if (!user) throw new HttpError(401, "User not found");

  return {
    id: String(user._id),
    email: user.email,
    role: user.role,
    name: user.name,
    authorRef: user.authorRef,
  };
}

module.exports = { login, getMe };