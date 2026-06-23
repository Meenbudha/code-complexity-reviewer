import React from 'react';

function Header({ darkMode, setDarkMode, userSlot }) {
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
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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

      {/* Right side — user badge + theme toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {userSlot && userSlot}
        <button
          onClick={() => setDarkMode(!darkMode)}
          style={{
            background: "transparent",
            border: "1px solid var(--border)",
            color: "var(--text-main)",
            padding: "6px 12px",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "1.2rem"
          }}
          title="Toggle Theme"
        >
          {darkMode ? "🔆" : "🌙"}
        </button>
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