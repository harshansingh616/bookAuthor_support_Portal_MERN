const clientsByAuthor = new Map();

function startHeartbeat(res) {
  return setInterval(() => {
    if (res.writableEnded) return;
    res.write(": ping\n\n");
  }, 15000);
}

function addClient(authorId, res) {
  const key = String(authorId);
  const entry = { res, heartbeat: startHeartbeat(res) };

  if (!clientsByAuthor.has(key)) clientsByAuthor.set(key, new Set());
  clientsByAuthor.get(key).add(entry);

  return entry;
}

function removeClient(authorId, entry) {
  const key = String(authorId);
  const set = clientsByAuthor.get(key);
  if (!set) return;

  set.delete(entry);
  clearInterval(entry.heartbeat);

  if (set.size === 0) clientsByAuthor.delete(key);
}

function publishToAuthor(authorId, event, data) {
  const key = String(authorId);
  const set = clientsByAuthor.get(key);
  if (!set || set.size === 0) return;

  const payload = JSON.stringify(data);

  for (const entry of Array.from(set)) {
    const { res } = entry;

    if (res.writableEnded) {
      removeClient(key, entry);
      continue;
    }

    res.write(`event: ${event}\n`);
    res.write(`data: ${payload}\n\n`);
  }
}

module.exports = { addClient, removeClient, publishToAuthor };