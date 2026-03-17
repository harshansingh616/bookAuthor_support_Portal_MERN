import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiFetch } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { useSse } from "../../context/SseContext";

export default function TicketDetailPage() {
  const { ticketId } = useParams();
  const { token } = useAuth();
  const { lastEvent } = useSse();

  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch(`/api/tickets/my/${ticketId}`, { token });
      setTicket(res.ticket);
      setMessages(res.messages || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId, token]);

  // Live append new messages
  useEffect(() => {
    if (!lastEvent) return;
    if (lastEvent.type !== "ticket.message.created") return;
    if (String(lastEvent.data.ticketId) !== String(ticketId)) return;

    setMessages((prev) => {
      const m = lastEvent.data.message;
      if (prev.some((x) => String(x._id) === String(m.id))) return prev;
      return [...prev, { _id: m.id, senderRole: m.senderRole, message: m.message, createdAt: m.createdAt }];
    });
  }, [lastEvent, ticketId]);

  // Live patch ticket status/category/priority if updated
  useEffect(() => {
    if (!lastEvent) return;
    if (lastEvent.type !== "ticket.updated") return;
    if (String(lastEvent.data.ticketId) !== String(ticketId)) return;

    setTicket((prev) =>
      prev
        ? { ...prev, status: lastEvent.data.status, category: lastEvent.data.category, priority: lastEvent.data.priority }
        : prev
    );
  }, [lastEvent, ticketId]);

  if (loading) return <div>Loading ticket...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!ticket) return <div className="alert alert-secondary">Ticket not found.</div>;

  return (
    <div>
      <h4 className="mb-2">{ticket.subject}</h4>
      <div className="text-muted mb-3">
        <span className="me-3"><b>Status:</b> {ticket.status}</span>
        <span className="me-3"><b>Category:</b> {ticket.category}</span>
        <span className="me-3"><b>Priority:</b> {ticket.priority}</span>
        <span><b>Book:</b> {ticket.bookRef?.title || "General / Account"}</span>
      </div>

      <div className="card">
        <div className="card-header">Conversation</div>
        <div className="card-body">
          {messages.length === 0 ? (
            <div className="text-muted">No messages yet.</div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {messages.map((m) => (
                <div key={m._id} className={`p-2 rounded border ${m.senderRole === "admin" ? "bg-light" : ""}`}>
                  <div className="small text-muted mb-1">
                    {m.senderRole.toUpperCase()} • {new Date(m.createdAt).toLocaleString()}
                  </div>
                  <div style={{ whiteSpace: "pre-wrap" }}>{m.message}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}