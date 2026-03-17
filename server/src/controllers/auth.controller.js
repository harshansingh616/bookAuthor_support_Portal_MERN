const authService = require("../services/auth.service");

async function login(req, res) {
  const result = await authService.login(req.body);
  res.json(result);
}

async function me(req, res) {
  const user = await authService.getMe(req.user.id);
  res.json({ user });
}

module.exports = { login, me };