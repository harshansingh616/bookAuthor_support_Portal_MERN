import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "../lib/config";
import { useAuth } from "./AuthContext";

const SseContext = createContext(null);

export function SseProvider({ children }) {
  const { token, user } = useAuth();
  const [lastEvent, setLastEvent] = useState(null);

  useEffect(() => {
    if (!token || user?.role !== "author") return;

    const url = `${API_BASE_URL}/api/tickets/stream?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);

    function onEvent(type) {
      return (evt) => {
        try {
          const data = JSON.parse(evt.data);
          setLastEvent({ type, data, at: Date.now() });
        } catch {
          setLastEvent({ type, data: evt.data, at: Date.now() });
        }
      };
    }

    es.addEventListener("connected", onEvent("connected"));
    es.addEventListener("ticket.created", onEvent("ticket.created"));
    es.addEventListener("ticket.updated", onEvent("ticket.updated"));
    es.addEventListener("ticket.message.created", onEvent("ticket.message.created"));

    es.onerror = () => {
      // Browser auto-retries; keep it simple.
      setLastEvent({ type: "error", data: null, at: Date.now() });
    };

    return () => es.close();
  }, [token, user?.role]);

  const value = useMemo(() => ({ lastEvent }), [lastEvent]);
  return <SseContext.Provider value={value}>{children}</SseContext.Provider>;
}

export function useSse() {
  const ctx = useContext(SseContext);
  if (!ctx) throw new Error("useSse must be used within SseProvider");
  return ctx;
}