import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { apiFetch } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

const CATEGORIES = [
  "Royalty & Payments",
  "ISBN & Metadata Issues",
  "Printing & Quality",
  "Distribution & Availability",
  "Book Status & Production Updates",
  "General Inquiry",
];

const PRIORITIES = ["Critical", "High", "Medium", "Low"];
const STATUSES = ["Open", "In Progress", "Resolved", "Closed"];

export default function AdminTicketDetailPage() {
  const { ticketId } = useParams();
  const { token, user } = useAuth();

  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);

  const [status, setStatus] = useState("Open");
  const [category, setCategory] = useState("General Inquiry");
  const [priority, setPriority] = useState("Medium");
  const [internalNotes, setInternalNotes] = useState("");
  const [assigneeUserId, setAssigneeUserId] = useState(null);

  const [replyText, setReplyText] = useState("");

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // AI draft state
  const [draftLoading, setDraftLoading] = useState(false);
  const [draftError, setDraftError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch(`/api/admin/tickets/${ticketId}`, { token });
      setTicket(res.ticket);
      setMessages(res.messages || []);

      setStatus(res.ticket.status);
      setCategory(res.ticket.category);
      setPriority(res.ticket.priority);
      setInternalNotes(res.ticket.internalNotes || "");
      setAssigneeUserId(res.ticket.assigneeUserRef ? String(res.ticket.assigneeUserRef) : null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadDraft({ force = false, overwrite = false } = {}) {
    setDraftLoading(true);
    setDraftError("");
    try {
      const qs = force ? "?force=1" : "";
      const res = await apiFetch(`/api/admin/tickets/${ticketId}/draft${qs}`, { token });

      // Only overwrite the textarea if:
      // - overwrite=true, OR
      // - current replyText is empty
      if (overwrite || !replyText.trim()) {
        setReplyText(res.draft);
      }
    } catch (err) {
      setDraftError(err.message || "AI draft failed");
    } finally {
      setDraftLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId, token]);

  // Auto-generate draft once when ticket loads (assignment expectation)
  useEffect(() => {
    if (!ticket) return;
    loadDraft({ force: false, overwrite: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket?._id]);

  const authorLabel = useMemo(() => {
    if (!ticket?.author) return "-";
    return `${ticket.author.email || ""} (${ticket.author.externalAuthorId || ""})`;
  }, [ticket]);

  async function saveTicketPatch(patch) {
    setBusy(true);
    setError("");
    try {
      await apiFetch(`/api/admin/tickets/${ticketId}`, { method: "PATCH", token, body: patch });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function onSaveMeta() {
    await saveTicketPatch({ status, category, priority });
  }

  async function onSaveNotes() {
    await saveTicketPatch({ internalNotes });
  }

  async function onAssignToMe() {
    await saveTicketPatch({ assigneeUserId: user?.id });
  }

  async function onUnassign() {
    await saveTicketPatch({ assigneeUserId: null });
  }

  async function onSendReply(e) {
    e.preventDefault();
    if (!replyText.trim()) return;

    setBusy(true);
    setError("");
    try {
      await apiFetch(`/api/admin/tickets/${ticketId}/reply`, {
        method: "POST",
        token,
        body: { message: replyText },
      });
      setReplyText("");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div>Loading ticket...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!ticket) return <div className="alert alert-secondary">Ticket not found.</div>;

  return (
    <div>
      <div className="mb-3">
        <h4 className="mb-1">{ticket.subject}</h4>
        <div className="text-muted small">
          <b>Author:</b> {authorLabel} • <b>Book:</b> {ticket.book?.title || "General / Account"} •{" "}
          <b>Created:</b> {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : "-"}
        </div>
      </div>

      {busy ? <div className="alert alert-info py-2">Working...</div> : null}

      <div className="row g-3">
        <div className="col-lg-7">
          <div className="card mb-3">
            <div className="card-header">Conversation</div>
            <div className="card-body">
              {messages.length === 0 ? (
                <div className="text-muted">No messages.</div>
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

          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <span>Reply to Author</span>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => loadDraft({ force: false, overwrite: false })}
                  disabled={draftLoading}
                  type="button"
                >
                  {draftLoading ? "Generating..." : "Get Draft"}
                </button>
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => loadDraft({ force: true, overwrite: true })}
                  disabled={draftLoading}
                  type="button"
                >
                  Force Regenerate
                </button>
              </div>
            </div>

            <div className="card-body">
              {draftError ? (
                <div className="alert alert-warning py-2 small">
                  AI draft unavailable: <b>{draftError}</b>. You can still respond manually.
                </div>
              ) : (
                <div className="alert alert-secondary py-2 small mb-2">
                  Draft is AI-generated from BookLeaf KB and can be edited before sending.
                </div>
              )}

              <form onSubmit={onSendReply}>
                <textarea
                  className="form-control mb-2"
                  rows={7}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write or edit the response..."
                />
                <button className="btn btn-primary" type="submit" disabled={busy}>
                  Send Reply
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="card mb-3">
            <div className="card-header">Ticket Controls</div>
            <div className="card-body">
              <label className="form-label">Status</label>
              <select className="form-select mb-2" value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>

              <label className="form-label">Category</label>
              <select className="form-select mb-2" value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>

              <label className="form-label">Priority</label>
              <select className="form-select mb-3" value={priority} onChange={(e) => setPriority(e.target.value)}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>

              <button className="btn btn-outline-primary" onClick={onSaveMeta} disabled={busy}>
                Save Status/Category/Priority
              </button>
            </div>
          </div>

          <div className="card mb-3">
            <div className="card-header">Assignment</div>
            <div className="card-body">
              <div className="mb-2 small text-muted">
                Current assignee: <b>{assigneeUserId ? assigneeUserId : "Unassigned"}</b>
              </div>

              <div className="d-flex gap-2">
                <button className="btn btn-outline-success" onClick={onAssignToMe} disabled={busy}>
                  Assign to me
                </button>
                <button className="btn btn-outline-secondary" onClick={onUnassign} disabled={busy}>
                  Unassign
                </button>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">Internal Notes (not visible to author)</div>
            <div className="card-body">
              <textarea
                className="form-control mb-2"
                rows={6}
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Add internal notes..."
              />
              <button className="btn btn-outline-primary" onClick={onSaveNotes} disabled={busy}>
                Save Notes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}