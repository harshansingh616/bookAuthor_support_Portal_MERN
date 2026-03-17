import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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

function badgeClassForPriority(p) {
  if (p === "Critical") return "bg-danger";
  if (p === "High") return "bg-warning text-dark";
  if (p === "Medium") return "bg-primary";
  return "bg-secondary";
}

export default function AdminTicketsPage() {
  const { token } = useAuth();

  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Filters (controlled inputs)
  const [status, setStatus] = useState("Open");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [q, setQ] = useState("");

  function buildQuery() {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (category) params.set("category", category);
    if (priority) params.set("priority", priority);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (q) params.set("q", q);
    return params.toString();
  }

  async function load() {
    setLoading(true);
    setError("");
    try {
      const qs = buildQuery();
      const res = await apiFetch(`/api/admin/tickets${qs ? `?${qs}` : ""}`, { token });
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

  function onApply(e) {
    e.preventDefault();
    load();
  }

  function onReset() {
    setStatus("Open");
    setCategory("");
    setPriority("");
    setFrom("");
    setTo("");
    setQ("");
    // then load with defaults
    setTimeout(load, 0);
  }

  const rows = useMemo(() => tickets, [tickets]);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">Ticket Queue</h4>
        <button className="btn btn-outline-secondary btn-sm" onClick={load}>Refresh</button>
      </div>

      <form onSubmit={onApply} className="card card-body mb-3">
        <div className="row g-3">
          <div className="col-md-2">
            <label className="form-label">Status</label>
            <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="col-md-3">
            <label className="form-label">Category</label>
            <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="col-md-2">
            <label className="form-label">Priority</label>
            <select className="form-select" value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="">All</option>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div className="col-md-2">
            <label className="form-label">From</label>
            <input className="form-control" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>

          <div className="col-md-2">
            <label className="form-label">To</label>
            <input className="form-control" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>

          <div className="col-md-6">
            <label className="form-label">Search</label>
            <input className="form-control" placeholder="Search subject..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>

          <div className="col-md-6 d-flex align-items-end gap-2">
            <button className="btn btn-primary" type="submit">Apply Filters</button>
            <button className="btn btn-outline-secondary" type="button" onClick={onReset}>Reset</button>
          </div>
        </div>
      </form>

      {loading ? <div>Loading tickets...</div> : null}
      {error ? <div className="alert alert-danger">{error}</div> : null}

      {!loading && !error && rows.length === 0 ? (
        <div className="alert alert-secondary">No tickets found for these filters.</div>
      ) : null}

      {!loading && !error && rows.length > 0 ? (
        <div className="table-responsive">
          <table className="table table-bordered align-middle">
            <thead className="table-light">
              <tr>
                <th>Priority</th>
                <th>Subject</th>
                <th>Author</th>
                <th>Book</th>
                <th>Status</th>
                <th>Category</th>
                <th>Created</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t._id}>
                  <td>
                    <span className={`badge ${badgeClassForPriority(t.priority)}`}>{t.priority}</span>
                  </td>
                  <td>{t.subject}</td>
                  <td>
                    <div className="small">
                      <div><b>{t.author?.email || "-"}</b></div>
                      <div className="text-muted">{t.author?.externalAuthorId || ""}</div>
                    </div>
                  </td>
                  <td>{t.book?.title || "General / Account"}</td>
                  <td>{t.status}</td>
                  <td>{t.category}</td>
                  <td className="small">{t.createdAt ? new Date(t.createdAt).toLocaleString() : "-"}</td>
                  <td>
                    <Link className="btn btn-sm btn-outline-primary" to={`/admin/tickets/${t._id}`}>
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="text-muted small">
            Sorted by: unresolved first → higher priority → oldest first (backend enforced).
          </div>
        </div>
      ) : null}
    </div>
  );
}