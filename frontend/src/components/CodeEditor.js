import React from 'react';

function CodeEditor({ code, setCode }) {
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ 
        padding: "8px 20px", 
        backgroundColor: "rgba(0,0,0,0.05)", 
        color: "var(--text-dim)", 
        fontSize: "1.2rem", 
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", gap: "10px"
      }}>
        <span style={{ color: "var(--primary)" }}>●</span> EDITOR
      </div>
      
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="// Paste your code here..."
        spellCheck="false"
        style={{
          flex: 1,
          width: "100%",
          backgroundColor: "var(--bg-panel)", // CSS Variable
          color: "var(--text-main)",          // CSS Variable
          border: "none",
          resize: "none",
          padding: "20px",
          fontFamily: "'Fira Code', monospace",
          fontSize: "18px",
          outline: "none"
        }}
      />
    </div>
  );
}

export default CodeEditor;