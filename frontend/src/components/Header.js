import React from 'react';

function Header({ darkMode, setDarkMode }) {
  return (
    <header style={{
      height: "60px",
      backgroundColor: "var(--bg-main)", // Matches body bg for cleaner look
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 20px",
      flexShrink: 0
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
        
        {/* Brand / Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ 
            width: "12px", 
            height: "12px", 
            backgroundColor: "var(--primary)", 
            borderRadius: "50%",
            boxShadow: "0 0 10px var(--primary)"
          }}></div>
          <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700", letterSpacing: "1px" }}>
            <span style={{ color: "var(--text-main)" }}>CODE</span>
            <span style={{ color: "var(--primary)" }}>MIND</span>
          </h2>
        </div>
      </div>

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
    </header>
  );
}

export default Header;