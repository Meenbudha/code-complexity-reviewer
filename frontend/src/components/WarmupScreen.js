import React, { useEffect, useState } from "react";

/**
 * WarmupScreen — shown on first load while backend + ML service wake up.
 * Pings both services simultaneously. Once both respond, onReady() is called
 * and the main app renders. This eliminates the "open services manually" issue
 * caused by Render's free-tier cold start (30–90s spin-up delay).
 */

const SERVICES = [
  {
    name: "Backend",
    icon: "🟡",
    url: `${process.env.REACT_APP_BACKEND_URL || "http://localhost:5000"}/`,
  },
  {
    name: "ML Service",
    icon: "🤖",
    url: `${process.env.REACT_APP_ML_URL || "http://localhost:8000"}/`,
  },
];

const PING_INTERVAL_MS  = 4000;   // retry every 4 seconds
const MAX_WAIT_MS       = 90000;  // give up after 90 seconds

export default function WarmupScreen({ onReady }) {
  const [statuses, setStatuses] = useState(
    SERVICES.map((s) => ({ ...s, status: "waking" })) // waking | online | error
  );
  const [elapsed, setElapsed]   = useState(0);
  const [timedOut, setTimedOut] = useState(false);
  const [dots, setDots]         = useState("");

  // Animated dots for "Waking up..."
  useEffect(() => {
    const id = setInterval(() => setDots((d) => (d.length >= 3 ? "" : d + ".")), 500);
    return () => clearInterval(id);
  }, []);

  // Elapsed seconds counter
  useEffect(() => {
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Ping each service independently
  useEffect(() => {
    const startTime = Date.now();
    const controllers = {};
    const intervals = {};

    const pingService = async (index) => {
      if (Date.now() - startTime > MAX_WAIT_MS) {
        setTimedOut(true);
        return;
      }
      const svc = SERVICES[index];
      try {
        controllers[index] = new AbortController();
        const res = await fetch(svc.url, {
          signal: controllers[index].signal,
          cache: "no-store",
        });
        if (res.ok) {
          setStatuses((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], status: "online" };
            return updated;
          });
          clearInterval(intervals[index]);
        }
      } catch {
        // still sleeping — will retry on next interval
      }
    };

    SERVICES.forEach((_, i) => {
      pingService(i);
      intervals[i] = setInterval(() => pingService(i), PING_INTERVAL_MS);
    });

    return () => {
      Object.values(intervals).forEach(clearInterval);
      Object.values(controllers).forEach((c) => c.abort());
    };
  }, []);

  // When ALL services are online → fire onReady
  useEffect(() => {
    if (statuses.every((s) => s.status === "online")) {
      const timer = setTimeout(onReady, 600); // small delay for UX
      return () => clearTimeout(timer);
    }
  }, [statuses, onReady]);

  const allOnline = statuses.every((s) => s.status === "online");

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>

        {/* Logo */}
        <div style={styles.logo}>
          Code<span style={{ color: "#06b6d4" }}>Mind</span> AI
        </div>

        {/* Status */}
        <p style={styles.subtitle}>
          {allOnline
            ? "✅ All systems ready!"
            : timedOut
            ? "⚠️ Services are taking longer than expected"
            : `Waking up services${dots}`}
        </p>

        {/* Service status rows */}
        <div style={styles.serviceList}>
          {statuses.map((svc) => (
            <div key={svc.name} style={styles.serviceRow}>
              <span style={styles.serviceIcon}>
                {svc.status === "online"
                  ? "✅"
                  : svc.status === "error"
                  ? "❌"
                  : <span style={styles.spinner} />}
              </span>
              <span style={styles.serviceName}>{svc.icon} {svc.name}</span>
              <span style={{
                ...styles.serviceStatus,
                color: svc.status === "online" ? "#22c55e"
                     : svc.status === "error"  ? "#ef4444"
                     : "#f59e0b"
              }}>
                {svc.status === "online" ? "Online"
               : svc.status === "error"  ? "Failed"
               : "Waking up..."}
              </span>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        {!allOnline && !timedOut && (
          <div style={styles.progressBar}>
            <div
              style={{
                ...styles.progressFill,
                width: `${Math.min((elapsed / 90) * 100, 95)}%`,
              }}
            />
          </div>
        )}

        {/* Time elapsed */}
        <p style={styles.elapsed}>
          {allOnline
            ? "Launching app..."
            : timedOut
            ? "Services may be under maintenance. Try refreshing the page."
            : `Please wait — free servers take 30–90s to wake up (${elapsed}s)`}
        </p>

        {/* Retry button on timeout */}
        {timedOut && (
          <button style={styles.retryBtn} onClick={() => window.location.reload()}>
            🔄 Retry
          </button>
        )}

      </div>
    </div>
  );
}

// ── Inline styles (self-contained component) ─────────────────────────────────
const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "#0f172a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    fontFamily: "'Inter', sans-serif",
  },
  card: {
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "16px",
    padding: "48px 56px",
    textAlign: "center",
    maxWidth: "420px",
    width: "90%",
    boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
  },
  logo: {
    fontSize: "2rem",
    fontWeight: "800",
    color: "#f8fafc",
    marginBottom: "12px",
    letterSpacing: "-0.5px",
  },
  subtitle: {
    color: "#94a3b8",
    fontSize: "0.95rem",
    marginBottom: "28px",
    minHeight: "22px",
  },
  serviceList: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    marginBottom: "28px",
  },
  serviceRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    backgroundColor: "#0f172a",
    borderRadius: "8px",
    padding: "12px 16px",
    border: "1px solid #334155",
  },
  serviceIcon: {
    fontSize: "1.1rem",
    minWidth: "22px",
    display: "flex",
    alignItems: "center",
  },
  serviceName: {
    flex: 1,
    color: "#e2e8f0",
    fontSize: "0.9rem",
    fontWeight: "500",
    textAlign: "left",
  },
  serviceStatus: {
    fontSize: "0.8rem",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  spinner: {
    display: "inline-block",
    width: "14px",
    height: "14px",
    border: "2px solid #334155",
    borderTop: "2px solid #06b6d4",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  progressBar: {
    height: "4px",
    backgroundColor: "#334155",
    borderRadius: "2px",
    overflow: "hidden",
    marginBottom: "16px",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#06b6d4",
    borderRadius: "2px",
    transition: "width 1s linear",
  },
  elapsed: {
    color: "#64748b",
    fontSize: "0.78rem",
    marginTop: "4px",
  },
  retryBtn: {
    marginTop: "16px",
    backgroundColor: "#06b6d4",
    color: "#000",
    border: "none",
    borderRadius: "8px",
    padding: "10px 24px",
    fontWeight: "700",
    fontSize: "0.9rem",
    cursor: "pointer",
  },
};
