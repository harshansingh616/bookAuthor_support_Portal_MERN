import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";

import AuthorLayout from "./layouts/AuthorLayout";
import BooksPage from "./pages/author/BooksPage";
import TicketsPage from "./pages/author/TicketsPage";
import NewTicketPage from "./pages/author/NewTicketPage";
import TicketDetailPage from "./pages/author/TicketDetailPage";

import AdminLayout from "./layouts/AdminLayout";
import AdminTicketsPage from "./pages/admin/AdminTicketsPage";
import AdminTicketDetailPage from "./pages/admin/AdminTicketDetailPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/author"
        element={
          <ProtectedRoute role="author">
            <AuthorLayout />
          </ProtectedRoute>
        }
      >
        <Route path="books" element={<BooksPage />} />
        <Route path="tickets" element={<TicketsPage />} />
        <Route path="tickets/new" element={<NewTicketPage />} />
        <Route path="tickets/:ticketId" element={<TicketDetailPage />} />
        <Route index element={<Navigate to="books" replace />} />
      </Route>

      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="tickets" element={<AdminTicketsPage />} />
        <Route path="tickets/:ticketId" element={<AdminTicketDetailPage />} />
        <Route index element={<Navigate to="tickets" replace />} />
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}