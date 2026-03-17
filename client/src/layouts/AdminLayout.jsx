import React from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function onLogout() {
    logout();
    navigate("/login");
  }

  return (
    <>
      <nav className="navbar navbar-expand navbar-dark bg-dark">
        <div className="container">
          <Link className="navbar-brand" to="/admin/tickets">BookLeaf Admin</Link>

          <div className="navbar-nav">
            <Link className="nav-link" to="/admin/tickets">Ticket Queue</Link>
          </div>

          <div className="d-flex align-items-center gap-2">
            <span className="text-light small">{user?.email}</span>
            <button className="btn btn-sm btn-outline-light" onClick={onLogout}>
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="container py-4">
        <Outlet />
      </main>
    </>
  );
}