const { HttpError } = require("../utils/httpError");
const sseHub = require("../realtime/sseHub");

function stream(req, res, next) {
  try {
    if (!req.user?.authorRef) throw new HttpError(400, "Author profile not linked");

    res.status(200);
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    res.write(`event: connected\n`);
    res.write(`data: ${JSON.stringify({ ok: true })}\n\n`);

    const entry = sseHub.addClient(req.user.authorRef, res);

    req.on("close", () => {
      sseHub.removeClient(req.user.authorRef, entry);
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { stream };