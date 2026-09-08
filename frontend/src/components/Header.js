import React from 'react';

function Header({ userSlot, onOpenPricing, isPro }) {
  return (
    <header style={{
      height: "60px",
      backgroundColor: "var(--bg-main)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 20px",
      flexShrink: 0,
      borderBottom: "1px solid rgba(108, 99, 255, 0.15)"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>

        {/* Brand / Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }} onClick={onOpenPricing ? () => {} : null}>
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
      </div>

      {/* Right side — Pro upgrade button + user badge */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
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