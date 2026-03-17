import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { useSse } from "../../context/SseContext";

export default function TicketsPage() {
  const { token } = useAuth();
  const { lastEvent } = useSse();

  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setError("");
    setLoading(true);
    try {
      const res = await apiFetch("/api/tickets/my", { token });
      setTickets(res.tickets || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Minimal live updates:
  // - ticket.created: prepend
  // - ticket.updated: patch row
  // - ticket.message.created: bump activity (or you can refetch)
  useEffect(() => {
    if (!lastEvent) return;

    if (lastEvent.type === "ticket.created") {
      const t = lastEvent.data;
      setTickets((prev) => [{ _id: t.ticketId, subject: t.subject, status: t.status, category: t.category, priority: t.priority, lastActivityAt: t.createdAt, bookRef: t.book }, ...prev]);
    }

    if (lastEvent.type === "ticket.updated") {
      const u = lastEvent.data;
      setTickets((prev) =>
        prev.map((t) =>
          String(t._id) === String(u.ticketId)
            ? { ...t, status: u.status, category: u.category, priority: u.priority, lastActivityAt: u.lastActivityAt }
            : t
        )
      );
    }

    if (lastEvent.type === "ticket.message.created") {
      const m = lastEvent.data;
      setTickets((prev) =>
        prev.map((t) =>
          String(t._id) === String(m.ticketId)
            ? { ...t, lastActivityAt: new Date().toISOString() }
            : t
        )
      );
    }
  }, [lastEvent]);

  const rows = useMemo(() => tickets, [tickets]);

  if (loading) return <div>Loading tickets...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">My Tickets</h4>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary btn-sm" onClick={load}>Refresh</button>
          <Link className="btn btn-primary btn-sm" to="/author/tickets/new">New Ticket</Link>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="alert alert-secondary">No tickets yet.</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered align-middle">
            <thead className="table-light">
              <tr>
                <th>Subject</th>
                <th>Book</th>
                <th>Status</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t._id}>
                  <td>{t.subject}</td>
                  <td>{t.bookRef?.title || "General / Account"}</td>
                  <td>{t.status}</td>
                  <td>{t.category}</td>
                  <td>{t.priority}</td>
                  <td>
                    <Link className="btn btn-sm btn-outline-primary" to={`/author/tickets/${t._id}`}>
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}