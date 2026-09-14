import React from 'react';

function Header({ userSlot, onOpenPricing, isPro, onGoHome, serviceStatus = "online", onToggleSidebar }) {
  return (
    <header style={{
      height: "60px",
      backgroundColor: "var(--bg-main)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 16px",
      flexShrink: 0,
      borderBottom: "1px solid rgba(108, 99, 255, 0.15)",
      position: "relative",
      zIndex: 10
    }}>
      <style>{`
        @media (max-width: 768px) {
          .desktop-home-label { display: none !important; }
          .header-home-btn { padding: 5px 8px !important; }
        }
        @media (min-width: 769px) {
          .mobile-hamburger-btn { display: none !important; }
        }
        @media (max-width: 600px) {
          .status-pill-mobile { display: none !important; }
          .header-brand-ai { display: none !important; }
          .header-brand-text { display: none !important; }
        }
      `}</style>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>

        {/* Mobile Sidebar Hamburger Toggle */}
        {onToggleSidebar && (
          <button
            className="mobile-hamburger-btn"
            onClick={onToggleSidebar}
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(51, 65, 85, 0.7)",
              borderRadius: "8px",
              color: "#94a3b8",
              width: "34px",
              height: "34px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: "1.1rem",
              padding: 0
            }}
            title="Open History"
          >
            ☰
          </button>
        )}

        {/* Brand / Logo */}
        <div 
          style={{ display: "flex", alignItems: "center", gap: "8px", cursor: onGoHome ? "pointer" : "default" }} 
          onClick={onGoHome || undefined}
          title={onGoHome ? "Return to CodeMind AI Home" : undefined}
        >
          <img
            src="/codemind-logo.png"
            alt="CodeMind AI Logo"
            style={{
              height: "36px",
              width: "36px",
              objectFit: "contain",
              borderRadius: "8px",
              filter: "drop-shadow(0 0 8px rgba(108, 99, 255, 0.6))",
              animation: "logoPulse 3s ease-in-out infinite"
            }}
          />
          <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700", letterSpacing: "1px", fontFamily: "'Inter', sans-serif" }}>
            <span style={{ color: "var(--text-main)" }}>CODE</span>
            <span style={{ color: "var(--primary)" }}>MIND</span>
            <span style={{
              fontSize: "0.65rem",
              fontWeight: "600",
              color: "#00D4FF",
              marginLeft: "4px",
              letterSpacing: "2px",
              verticalAlign: "middle",
              opacity: 0.9
            }}>AI</span>
          </h2>
        </div>

        {/* Home Navigation button */}
        {onGoHome && (
          <button
            onClick={onGoHome}
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(51, 65, 85, 0.6)",
              color: "#94a3b8",
              padding: "4px 10px",
              borderRadius: "8px",
              fontSize: "0.78rem",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              transition: "all 0.2s"
            }}
            onMouseEnter={e => { e.currentTarget.style.color = "#38bdf8"; e.currentTarget.style.borderColor = "rgba(6, 182, 212, 0.4)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.borderColor = "rgba(51, 65, 85, 0.6)"; }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span className="desktop-home-label">Home</span>
          </button>
        )}
      </div>

      {/* Right side — Status, Pro upgrade button + user badge */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }} className="header-actions-mobile">
        {/* Subtle Service status */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "5px",
          padding: "4px 8px",
          borderRadius: "16px",
          background: serviceStatus === "online" ? "rgba(16, 185, 129, 0.08)" : "rgba(245, 158, 11, 0.1)",
          border: `1px solid ${serviceStatus === "online" ? "rgba(16, 185, 129, 0.2)" : "rgba(245, 158, 11, 0.25)"}`,
          fontSize: "0.72rem",
          fontWeight: "600",
          color: serviceStatus === "online" ? "#10b981" : "#f59e0b",
        }} className="status-pill-mobile">
          <div style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            backgroundColor: serviceStatus === "online" ? "#10b981" : "#f59e0b",
            boxShadow: serviceStatus === "online" ? "0 0 6px #10b981" : "0 0 6px #f59e0b"
          }} />
          <span className="status-text-full">{serviceStatus === "online" ? "Online" : "Warming"}</span>
        </div>

        {onOpenPricing && (
          <button
            onClick={onOpenPricing}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              backgroundColor: isPro ? "rgba(245, 158, 11, 0.15)" : "linear-gradient(135deg, #06b6d4, #8b5cf6)",
              background: isPro ? "rgba(245, 158, 11, 0.15)" : "linear-gradient(135deg, #06b6d4, #8b5cf6)",
              border: isPro ? "1px solid #f59e0b" : "none",
              color: isPro ? "#f59e0b" : "#000",
              padding: "7px 16px",
              borderRadius: "20px",
              fontWeight: "800",
              fontSize: "0.82rem",
              cursor: "pointer",
              boxShadow: isPro ? "none" : "0 0 15px rgba(6, 182, 212, 0.4)",
              transition: "transform 0.2s, box-shadow 0.2s"
            }}
            title={isPro ? "View Pro Membership" : "Upgrade to CodeMind Pro"}
          >
            <span>{isPro ? "👑 Pro Member" : "⚡ Go Pro"}</span>
          </button>
        )}

        {userSlot && userSlot}
      </div>

      <style>{`
        @keyframes logoPulse {
          0%, 100% { filter: drop-shadow(0 0 8px rgba(108, 99, 255, 0.6)); }
          50% { filter: drop-shadow(0 0 16px rgba(0, 212, 255, 0.8)); }
        }
      `}</style>
    </header>
  );
}

export default Header;