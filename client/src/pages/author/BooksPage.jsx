import React, { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

export default function BooksPage() {
  const { token } = useAuth();
  const [books, setBooks] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await apiFetch("/api/books/my", { token });
        if (!cancelled) setBooks(res.books || []);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) return <div>Loading books...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div>
      <h4 className="mb-3">My Books</h4>

      {books.length === 0 ? (
        <div className="alert alert-secondary">No books found.</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered align-middle">
            <thead className="table-light">
              <tr>
                <th>Title</th>
                <th>ISBN</th>
                <th>Status</th>
                <th>MRP</th>
                <th>Sold</th>
                <th>Royalty Earned</th>
                <th>Paid</th>
                <th>Pending</th>
              </tr>
            </thead>
            <tbody>
              {books.map((b) => (
                <tr key={b._id}>
                  <td>{b.title}</td>
                  <td>{b.isbn || "-"}</td>
                  <td>{b.status || "-"}</td>
                  <td>{b.mrp ?? "-"}</td>
                  <td>{b.totalCopiesSold ?? 0}</td>
                  <td>{b.totalRoyaltyEarned ?? 0}</td>
                  <td>{b.royaltyPaid ?? 0}</td>
                  <td>{b.royaltyPending ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}