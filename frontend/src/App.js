import React, { useState, useRef, useEffect, useCallback } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import CodeEditor from "./components/CodeEditor";
import ResultPanel from "./components/ResultPanel";
import ComplexityGraph from "./components/ComplexityGraph";
import AiAssistant from "./components/AiAssistant";
import LandingPage from "./components/LandingPage";
import PricingPage from "./components/PricingPage";
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
import { AuthProvider, useAuth } from "./context/AuthContext";
import "./index.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

// ─────────────────────────────────────────────────────────────────────────────
// APP ROUTER — manages seamless navigation (Landing, Login, Register, Dashboard, Pricing)
// ─────────────────────────────────────────────────────────────────────────────
function AppRouter() {
  const { isAuthenticated } = useAuth();
  const [view, setView] = useState("landing"); // "landing" | "dashboard" | "login" | "register" | "pricing"
  const [serviceStatus, setServiceStatus] = useState("online");

  // Non-blocking background health check
  useEffect(() => {
    let isMounted = true;
    const checkServices = async () => {
      try {
        const mlUrl = process.env.REACT_APP_ML_URL || "http://localhost:8000";
        const [bRes, mRes] = await Promise.allSettled([
          fetch(`${BACKEND_URL}/`, { cache: "no-store" }),
          fetch(`${mlUrl}/`, { cache: "no-store" })
        ]);
        const isAllOk = bRes.status === "fulfilled" && bRes.value.ok &&
                        mRes.status === "fulfilled" && mRes.value.ok;
        if (isMounted) {
          setServiceStatus(isAllOk ? "online" : "waking");
        }
      } catch {
        if (isMounted) setServiceStatus("waking");
      }
    };
    checkServices();
    const interval = setInterval(checkServices, 12000);
    return () => { isMounted = false; clearInterval(interval); };
  }, []);

  // When user signs in or registers successfully, transition to dashboard
  useEffect(() => {
    if (isAuthenticated && (view === "login" || view === "register")) {
      setView("dashboard");
    }
  }, [isAuthenticated, view]);

  // 1. Landing Page (Default Real Website Opening View)
  if (view === "landing") {
    return (
      <LandingPage
        onNavigate={(targetView) => {
          if (targetView === "dashboard" && !isAuthenticated) {
            setView("register");
          } else {
            setView(targetView);
          }
        }}
        serviceStatus={serviceStatus}
      />
    );
  }

  // 2. Sign In View
  if (view === "login") {
    return (
      <LoginPage
        onSwitchToRegister={() => setView("register")}
        onBackToHome={() => setView("landing")}
      />
    );
  }

  // 3. Register View
  if (view === "register") {
    return (
      <RegisterPage
        onSwitchToLogin={() => setView("login")}
        onBackToHome={() => setView("landing")}
      />
    );
  }

  // 4. Standalone Pricing View
  if (view === "pricing") {
    return (
      <PricingPage
        onBackToDashboard={() => setView(isAuthenticated ? "dashboard" : "landing")}
      />
    );
  }

  // 5. Workspace / Dashboard View (Protected)
  if (!isAuthenticated) {
    return (
      <LoginPage
        onSwitchToRegister={() => setView("register")}
        onBackToHome={() => setView("landing")}
      />
    );
  }

  return (
    <MainApp
      onGoHome={() => setView("landing")}
      onOpenPricing={() => setView("pricing")}
      serviceStatus={serviceStatus}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// USER BADGE — shown in the top-right corner when logged in
// ─────────────────────────────────────────────────────────────────────────────
function UserBadge({ analysisCount = 0, onLogout }) {
  const { user, logout, isPro } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initials = user?.name
    ? user.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const memberSince = (user?.createdAt && !isNaN(new Date(user.createdAt).getTime()))
    ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" });

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <style>{`
        @keyframes profileDropIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        @keyframes avatarPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(6,182,212,0.5); }
          50%       { box-shadow: 0 0 0 5px rgba(6,182,212,0); }
        }
        .user-badge-trigger:hover { border-color: rgba(6,182,212,0.6) !important; background: rgba(30,41,59,0.9) !important; }
        .profile-menu-item:hover  { background: rgba(255,255,255,0.05) !important; }
        .profile-signout:hover    { background: rgba(239,68,68,0.1) !important; color: #f87171 !important; }
        .profile-stat:hover       { background: rgba(6,182,212,0.08) !important; border-color: rgba(6,182,212,0.3) !important; }
      `}</style>

      {/* ── Trigger button ── */}
      <button
        id="user-badge-btn"
        className="user-badge-trigger"
        onClick={() => setOpen(v => !v)}
        style={{
          display: "flex", alignItems: "center", gap: "9px",
          background: "rgba(30,41,59,0.7)",
          border: isPro ? "1px solid rgba(245,158,11,0.6)" : "1px solid rgba(51,65,85,0.8)",
          borderRadius: "12px", padding: "5px 12px 5px 6px",
          cursor: "pointer", color: "var(--text-main)",
          transition: "all 0.2s ease",
          backdropFilter: "blur(8px)",
          boxShadow: isPro ? "0 0 10px rgba(245,158,11,0.2)" : "0 2px 8px rgba(0,0,0,0.2)",
        }}
      >
        {/* Avatar */}
        <div style={{
          width: "30px", height: "30px", borderRadius: "50%",
          background: isPro ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" : "linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "0.65rem", fontWeight: "800", color: "#fff", flexShrink: 0,
          boxShadow: isPro ? "0 0 0 2px rgba(245,158,11,0.5)" : "0 0 0 2px rgba(6,182,212,0.4)",
          animation: "avatarPulse 3s ease-in-out infinite",
        }}>
          {initials}
        </div>
        <span style={{ fontSize: "0.85rem", fontWeight: "600", maxWidth: "90px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {user?.name || "User"}
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.25s ease", color: "var(--text-dim)", flexShrink: 0 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* ── Dropdown panel ── */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 10px)", right: 0, zIndex: 200,
          background: "linear-gradient(160deg, rgba(22,32,50,0.98) 0%, rgba(15,23,42,0.98) 100%)",
          border: "1px solid rgba(51,65,85,0.8)",
          borderRadius: "16px", minWidth: "260px",
          boxShadow: "0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(6,182,212,0.08), inset 0 1px 0 rgba(255,255,255,0.05)",
          animation: "profileDropIn 0.22s cubic-bezier(0.16,1,0.3,1) forwards",
          backdropFilter: "blur(20px)",
          overflow: "hidden",
        }}>

          {/* ── Top gradient banner ── */}
          <div style={{
            height: "52px",
            background: isPro ? "linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(217,119,6,0.2) 100%)" : "linear-gradient(135deg, rgba(6,182,212,0.18) 0%, rgba(139,92,246,0.18) 100%)",
            borderBottom: "1px solid rgba(51,65,85,0.5)",
            position: "relative",
          }}>
            <div style={{
              position: "absolute", top: "6px", right: "10px",
              fontSize: "0.65rem", fontWeight: "700", letterSpacing: "1px",
              color: isPro ? "#f59e0b" : "#06b6d4", textTransform: "uppercase",
              background: isPro ? "rgba(245,158,11,0.15)" : "rgba(6,182,212,0.12)",
              border: isPro ? "1px solid rgba(245,158,11,0.4)" : "1px solid rgba(6,182,212,0.25)",
              borderRadius: "20px", padding: "3px 9px",
            }}>
              {isPro ? "👑 PRO MEMBER" : "FREE MEMBER"}
            </div>
          </div>

          {/* ── Avatar + name (overlapping the banner) ── */}
          <div style={{ padding: "0 18px 16px", marginTop: "-22px" }}>
            <div style={{
              width: "44px", height: "44px", borderRadius: "50%",
              background: "linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1rem", fontWeight: "800", color: "#fff",
              border: "3px solid rgba(15,23,42,0.98)",
              boxShadow: "0 0 0 1px rgba(6,182,212,0.4), 0 4px 16px rgba(6,182,212,0.25)",
              marginBottom: "10px",
            }}>
              {initials}
            </div>

            <div style={{ fontWeight: "700", fontSize: "1rem", color: "var(--text-hero)", lineHeight: 1.2 }}>
              {user?.name || "User"}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginTop: "3px", display: "flex", alignItems: "center", gap: "5px" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
              </svg>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "190px" }}>
                {user?.email}
              </span>
            </div>

            {/* Member since */}
            <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "6px" }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <span style={{ fontSize: "0.7rem", color: "#06b6d4", fontWeight: "600" }}>
                Member since {memberSince}
              </span>
            </div>
          </div>

          {/* ── Divider ── */}
          <div style={{ height: "1px", background: "rgba(51,65,85,0.6)", margin: "0 18px 14px" }} />

          {/* ── Stats row ── */}
          <div style={{ display: "flex", gap: "8px", padding: "0 18px 16px" }}>
            {[
              { label: "Analyses", value: analysisCount > 0 ? analysisCount : "0", icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
              { label: "AI Chats", value: isPro ? "∞ Pro" : "Active", icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
            ].map(stat => (
              <div
                key={stat.label}
                className="profile-stat"
                style={{
                  flex: 1, textAlign: "center",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(51,65,85,0.5)",
                  borderRadius: "10px", padding: "10px 6px",
                  transition: "all 0.2s",
                }}
              >
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "5px" }}>{stat.icon}</div>
                <div style={{ fontWeight: "700", fontSize: "1rem", color: "var(--text-hero)" }}>{stat.value}</div>
                <div style={{ fontSize: "0.65rem", color: "var(--text-dim)", marginTop: "2px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* ── Divider ── */}
          <div style={{ height: "1px", background: "rgba(51,65,85,0.6)", margin: "0 18px 10px" }} />

          {/* ── Menu items ── */}
          <div style={{ padding: "0 10px 10px" }}>
            {/* Sign out */}
            <button
              id="logout-btn"
              className="profile-signout"
              onClick={() => { setOpen(false); logout(); if (onLogout) onLogout(); }}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: "10px",
                background: "none", border: "none", borderRadius: "10px",
                padding: "10px 12px", cursor: "pointer",
                color: "#ef4444", fontSize: "0.85rem", fontWeight: "600",
                transition: "all 0.15s",
              }}
            >
              <div style={{
                width: "28px", height: "28px", borderRadius: "8px",
                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </div>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN APP — the full dashboard (only shown when authenticated)
// ─────────────────────────────────────────────────────────────────────────────
function MainApp({ onGoHome, onOpenPricing, serviceStatus }) {
  const { token, isPro } = useAuth();

  const [activeTab, setActiveTab] = useState("dashboard"); // "dashboard" | "pricing"

  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("auto");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Layout
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Data State
  const [history, setHistory] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);

  // Layout Logic
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [mobileTab, setMobileTab] = useState("editor"); // "editor" | "results"
  const [topSectionHeight, setTopSectionHeight] = useState(window.innerHeight < 800 ? window.innerHeight * 0.6 : 600);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef(null);

  // --- Helper: authenticated fetch headers ---
  const authHeaders = useCallback(() => ({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  }), [token]);

  // --- 1. Load History from MongoDB on Startup ---
  useEffect(() => {
    setIsHistoryLoading(true);
    fetch(`${BACKEND_URL}/history`, { headers: authHeaders() })
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data)) return;
        const formattedHistory = data.map(item => ({
          id: item._id,
          code: item.code,
          language: item.language,
          result: item.result,
          summary: `${item.language.toUpperCase()} Analysis`,
          timestamp: new Date(item.timestamp)
        }));
        setHistory(formattedHistory);
      })
      .catch(err => console.error("Failed to load history:", err))
      .finally(() => setIsHistoryLoading(false));
  }, [authHeaders]);

  // --- 3. Resize Logic ---
  const startResizing = (e) => {
    e.preventDefault();
    setIsResizing(true);
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const newHeight = e.clientY - rect.top;
        const maxHeight = window.innerHeight * 0.7;
        if (newHeight > 400 && newHeight < maxHeight) {
          setTopSectionHeight(newHeight);
        }
      }
    };
    const stopResizing = () => {
      setIsResizing(false);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };
    if (isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", stopResizing);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing]);

  // --- 4. Analysis Logic ---
  const analyzeCode = async () => {
    if (!code.trim()) {
      alert("Please paste some code before analyzing.");
      return;
    }
    setRefreshKey((prev) => prev + 1);
    setResult(null);
    setLoading(true);
    setHasAnalyzed(true);
    setMobileTab("results");

    try {
      const response = await fetch(`${BACKEND_URL}/analyze`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ code, language })
      });
      const data = await response.json();

      // Handle language mismatch (422) from ML service
      if (data.error && data.code === 422) {
        const detectedLang = data.detail?.startsWith("detected:")
          ? data.detail.split(":")[1]
          : null;
        const errorResult = {
          time: "N/A",
          space: "N/A",
          warnings: [`⚠️ ${data.error}`],
          suggestions: detectedLang
            ? [`Please change the dropdown to "${detectedLang.charAt(0).toUpperCase() + detectedLang.slice(1)}".`]
            : ["Please select the correct language from the dropdown."]
        };
        setResult(errorResult);
        return;
      }

      setResult(data);

      const newEntry = {
        id: data._id || Date.now(),
        code: code,
        language: language,
        result: data,
        summary: `${language.toUpperCase()} Analysis`,
        timestamp: new Date()
      };
      setHistory(prev => [newEntry, ...prev]);

    } catch (error) {
      setResult({
        time: "Error",
        space: "Error",
        warnings: ["Backend service is unreachable."],
        suggestions: ["Please ensure the Node.js server is running."]
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFromHistory = async (item) => {
    setCode(item.code);
    setLanguage(item.language);
    setResult(null);
    setLoading(true);
    setHasAnalyzed(true);
    setMobileTab("results");
    setRefreshKey(prev => prev + 1);

    try {
      const response = await fetch(`${BACKEND_URL}/analyze`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ code: item.code, language: item.language })
      });
      const data = await response.json();
      if (data && !data.error) {
        setResult(data);
      } else {
        // Fall back to stored DB result if AI endpoint returns an error
        setResult(item.result);
      }
    } catch (error) {
      // Fall back to stored DB result if network request fails
      setResult(item.result);
    } finally {
      setLoading(false);
    }
  };

  const resetAnalysis = () => {
    setCode("");
    setResult(null);
    setHasAnalyzed(false);
    setMobileTab("editor");
  };

  if (activeTab === "pricing") {
    return <PricingPage onBackToDashboard={() => setActiveTab("dashboard")} />;
  }

  return (
    <div className="app-shell">

      <Sidebar
        isOpen={isSidebarOpen}
        history={history}
        onSelect={(item) => {
          setActiveTab("dashboard");
          loadFromHistory(item);
        }}
        onNew={() => {
          setActiveTab("dashboard");
          resetAnalysis();
        }}
        darkMode={true}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isLoading={isHistoryLoading}
        onOpenPricing={() => setActiveTab("pricing")}
        isPro={isPro}
      />

      <div className="main-content">
        {/* Header with user badge injected via userSlot prop */}
        <Header
          userSlot={<UserBadge analysisCount={history.length} onLogout={onGoHome} />}
          onOpenPricing={onOpenPricing || (() => setActiveTab("pricing"))}
          onGoHome={onGoHome}
          serviceStatus={serviceStatus}
          isPro={isPro}
          onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
        />

        <div className="scrollable-workspace">
          <div className="workspace-container" style={{ width: "100%", maxWidth: "1280px", margin: "0 auto", flex: 1, display: "flex", flexDirection: "column", minHeight: "100%" }}>

            {/* Mobile View Switcher (Only visible on mobile when analyzed) */}
            {hasAnalyzed && (
              <div className="mobile-view-tabs">
                <button
                  type="button"
                  onClick={() => setMobileTab("editor")}
                  className={`mobile-tab-btn ${mobileTab === "editor" ? "active" : ""}`}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                  </svg>
                  <span>Code Editor</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMobileTab("results")}
                  className={`mobile-tab-btn ${mobileTab === "results" ? "active" : ""}`}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                  <span>Complexity Insights</span>
                  {result && (
                    <span className="mobile-tab-badge">
                      {result.time || "✓"}
                    </span>
                  )}
                </button>
              </div>
            )}

            <div
              ref={containerRef}
              className="editor-result-split"
              style={{
                height: `${topSectionHeight}px`,
                display: "flex",
                gap: hasAnalyzed ? "20px" : "0",
                justifyContent: hasAnalyzed ? "flex-start" : "center",
                transition: isResizing ? "none" : "height 0.2s ease",
                marginBottom: "5px"
              }}
            >
              <div
                className={`editor-wrapper ${hasAnalyzed ? 'analyzed' : 'initial'} ${hasAnalyzed && mobileTab === 'results' ? 'mobile-hide-on-tab' : ''}`}
                style={{ width: hasAnalyzed ? "auto" : undefined, flex: hasAnalyzed ? 1 : undefined, minWidth: 0, height: "100%" }}
              >
                <div className="lang-bar-mobile" style={{ paddingBottom: "10px", display: "flex", alignItems: "center", justifyContent: "space-between", height: "52px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <label style={{ color: "var(--text-dim)", fontWeight: "600", fontSize: "0.9rem" }}>Language:</label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      style={{ backgroundColor: "var(--bg-panel)", color: "var(--text-main)", border: "1px solid var(--border)", padding: "6px 12px", borderRadius: "6px", outline: "none", fontWeight: "500" }}
                    >
                      <option value="auto">⚡ Auto-Detect Language</option>
                      <option value="python">Python</option>
                      <option value="javascript">JavaScript / TypeScript</option>
                      <option value="cpp">C / C++</option>
                      <option value="java">Java</option>
                      <option value="csharp">C# (.NET)</option>
                      <option value="go">Go</option>
                      <option value="rust">Rust</option>
                      <option value="php">PHP</option>
                      <option value="ruby">Ruby</option>
                      <option value="swift">Swift</option>
                      <option value="kotlin">Kotlin</option>
                      <option value="sql">SQL</option>
                      <option value="other">Any Language</option>
                    </select>
                  </div>
                  <button
                    onClick={analyzeCode}
                    disabled={loading}
                    style={{
                      backgroundColor: loading ? "var(--border)" : "var(--primary)",
                      color: loading ? "var(--text-dim)" : "#000",
                      border: "none",
                      padding: "8px 24px",
                      borderRadius: "6px",
                      fontWeight: "bold",
                      cursor: loading ? "not-allowed" : "pointer",
                      transition: "all 0.2s",
                      boxShadow: loading ? "none" : "0 4px 10px rgba(6,182,212,0.3)"
                    }}
                  >
                    {loading ? "PROCESSING..." : "ANALYZE CODE"}
                  </button>
                </div>
                <div style={{ flex: 1, border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden", boxShadow: "0 0 20px var(--shadow)", backgroundColor: "var(--bg-panel)", display: "flex", flexDirection: "column" }}>
                  <CodeEditor code={code} setCode={setCode} darkMode={true} />
                </div>
              </div>

              {hasAnalyzed && (
                <div className={`analysis-panel result-wrapper-mobile ${hasAnalyzed && mobileTab === 'editor' ? 'mobile-hide-on-tab' : ''}`} style={{ height: "100%", display: "flex", flexDirection: "column", backgroundColor: "transparent", border: "none" }}>
                  <div style={{ paddingBottom: "10px", display: "flex", alignItems: "center", justifyContent: "space-between", height: "52px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <label style={{ color: "var(--text-dim)", fontWeight: "bold" }}>Report:</label>
                      <span style={{ color: "var(--primary)", fontWeight: "700", letterSpacing: "1px" }}>Complexity Insights</span>
                    </div>
                  </div>
                  <div style={{ flex: 1, overflowY: "auto", backgroundColor: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: "8px", padding: "20px", boxShadow: "0 0 20px var(--shadow)" }}>
                    {loading ? (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "300px", color: "var(--text-dim)" }}>
                        <div className="loader-spinner" style={{ width: "40px", height: "40px", border: "3px solid var(--border)", borderTop: "3px solid var(--primary)", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: "15px" }}></div>
                        <span>Analyzing Code...</span>
                      </div>
                    ) : (
                      result && (
                        <>
                          <ResultPanel key={refreshKey} result={result} loading={loading} darkMode={true} />
                          {result.time && result.time !== "N/A" && <ComplexityGraph key={refreshKey} complexity={result.time} darkMode={true} />}
                        </>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>

            <div
              className="desktop-resizer"
              onMouseDown={startResizing}
              style={{ height: "15px", width: "100%", cursor: "row-resize", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.8 }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
              onMouseLeave={(e) => e.currentTarget.style.opacity = 0.8}
            >
              <div style={{ width: "60px", height: "4px", backgroundColor: "var(--border)", borderRadius: "2px", boxShadow: "0 0 5px var(--shadow)" }}></div>
            </div>

            <div style={{ padding: "20px 0 40px 0", display: "flex", justifyContent: "center" }}>
              <div className="ai-assistant-container" style={{ width: hasAnalyzed ? "100%" : "70%", maxWidth: hasAnalyzed ? "1000px" : "900px", transition: "width 0.5s ease" }}>
                <AiAssistant code={code} />
              </div>
            </div>

          </div>
        </div>

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT — wraps everything in AuthProvider
// ─────────────────────────────────────────────────────────────────────────────
function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

export default App;