const jwt = require("jsonwebtoken");
const { env } = require("../config/env");
const { HttpError } = require("../utils/httpError");
const User = require("../models/User");

function extractToken(req) {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");
  if (type === "Bearer" && token) return token;

  const qToken = req.query?.token;
  if (typeof qToken === "string" && qToken.trim()) return qToken.trim();

  return null;
}

async function requireAuth(req, _res, next) {
  try {
    const token = extractToken(req);
    if (!token) throw new HttpError(401, "Missing auth token");

    const payload = jwt.verify(token, env.jwtSecret);

    const user = await User.findById(payload.sub).lean();
    if (!user) throw new HttpError(401, "User not found");

    req.user = {
      id: String(user._id),
      role: user.role,
      authorRef: user.authorRef ? String(user.authorRef) : null,
    };

    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return next(new HttpError(401, "Invalid or expired token"));
    }
    next(err);
  }
}

function requireRole(role) {
  return (req, _res, next) => {
    if (!req.user) return next(new HttpError(500, "Auth middleware missing"));
    if (req.user.role !== role) return next(new HttpError(403, "Forbidden"));
    next();
  };
}

module.exports = { requireAuth, requireRole };