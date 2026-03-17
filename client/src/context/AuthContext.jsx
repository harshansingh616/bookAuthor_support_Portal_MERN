import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api";

const AuthContext = createContext(null);

const STORAGE_KEY = "bookleaf_auth_v1";

export function AuthProvider({ children }) {
  const [token, setToken] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed?.token) setToken(parsed.token);
        if (parsed?.user) setUser(parsed.user);
      } catch {
        // ignore corrupted storage
      }
    }
    setLoading(false);
  }, []);

  // validate token by calling /me whenever token changes
  useEffect(() => {
    let cancelled = false;

    async function validate() {
      if (!token) return;
      try {
        const res = await apiFetch("/api/auth/me", { token });
        if (!cancelled) setUser(res.user);
      } catch {
        if (!cancelled) {
          setToken("");
          setUser(null);
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    }

    validate();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function login(email, password) {
    const res = await apiFetch("/api/auth/login", {
      method: "POST",
      body: { email, password },
    });

    setToken(res.token);
    setUser(res.user);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: res.token, user: res.user }));

    return res.user;
  }

  function logout() {
    setToken("");
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  const value = useMemo(() => ({ token, user, loading, login, logout }), [token, user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}