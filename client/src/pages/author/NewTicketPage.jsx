import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

export default function NewTicketPage() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [books, setBooks] = useState([]);
  const [bookExternalId, setBookExternalId] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadBooks() {
      try {
        const res = await apiFetch("/api/books/my", { token });
        if (!cancelled) setBooks(res.books || []);
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    }
    loadBooks();
    return () => { cancelled = true; };
  }, [token]);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      const payload = {
        bookExternalId: bookExternalId ? bookExternalId : null,
        subject,
        description,
      };

      const res = await apiFetch("/api/tickets", { method: "POST", token, body: payload });
      navigate(`/author/tickets/${res.id}`);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={{ maxWidth: 760 }}>
      <h4 className="mb-3">New Support Ticket</h4>

      {error ? <div className="alert alert-danger">{error}</div> : null}

      <form onSubmit={onSubmit} className="card card-body">
        <label className="form-label">Book</label>
        <select className="form-select mb-3" value={bookExternalId} onChange={(e) => setBookExternalId(e.target.value)}>
          <option value="">General / Account Level</option>
          {books.map((b) => (
            <option key={b._id} value={b.externalBookId}>
              {b.title} ({b.externalBookId})
            </option>
          ))}
        </select>

        <label className="form-label">Subject</label>
        <input className="form-control mb-3" value={subject} onChange={(e) => setSubject(e.target.value)} />

        <label className="form-label">Description</label>
        <textarea className="form-control mb-3" rows={6} value={description} onChange={(e) => setDescription(e.target.value)} />

        <label className="form-label">Attachment (UI only)</label>
        <input className="form-control mb-3" type="file" />

        <button className="btn btn-primary" type="submit">Submit Ticket</button>
      </form>
    </div>
  );
}