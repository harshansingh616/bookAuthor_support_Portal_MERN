import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      const user = await login(email, password);
      if (user.role === "admin") navigate("/admin", { replace: true });
      else navigate("/author/books", { replace: true });
    } catch (err) {
      setError(err.message || "Login failed");
    }
  }

  return (
    <div className="container py-5" style={{ maxWidth: 520 }}>
      <h3 className="mb-3">BookLeaf Portal Login</h3>

      {error ? <div className="alert alert-danger">{error}</div> : null}

      <form onSubmit={onSubmit} className="card card-body">
        <label className="form-label">Email</label>
        <input className="form-control mb-3" value={email} onChange={(e) => setEmail(e.target.value)} />

        <label className="form-label">Password</label>
        <input className="form-control mb-3" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

        <button className="btn btn-primary" type="submit">Login</button>

        <div className="text-muted small mt-3">
         
        </div>
      </form>
    </div>
  );
}