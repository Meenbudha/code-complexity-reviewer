import React from 'react';
import SkeletonLoader from './SkeletonLoader';

function ResultPanel({ result, loading }) {
  if (loading) return <SkeletonLoader />;
  if (!result) return <div style={{ textAlign: "center", marginTop: "50px", color: "var(--text-dim)" }}>Ready to analyze</div>;

  const renderInteractiveList = (items, type) => {
    const isWarning = type === 'warning';
    const accentColor = isWarning ? 'var(--warning)' : 'var(--primary)';
    const bgColor = isWarning ? 'rgba(245, 158, 11, 0.05)' : 'rgba(6, 182, 212, 0.05)';
    const borderColor = isWarning ? 'rgba(245, 158, 11, 0.2)' : 'rgba(6, 182, 212, 0.2)';

    return (
      <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "12px" }}>
        {items.map((item, i) => {
          // Remove literal "Label:" or "**Label:**" if the AI mistakenly included it verbatim
          const cleanText = item.replace(/^\*?\*?Label:\*?\*?\s*/i, '');

          return (
            <li 
              key={i} 
              style={{ 
                display: "flex", 
                alignItems: "flex-start",
                gap: "12px",
                padding: "14px 16px",
                backgroundColor: bgColor,
                border: `1px solid ${borderColor}`,
                borderRadius: "8px",
                transition: "all 0.2s ease-in-out",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                 e.currentTarget.style.transform = "translateY(-2px)";
                 e.currentTarget.style.boxShadow = `0 4px 12px ${isWarning ? 'rgba(245,158,11,0.1)' : 'rgba(6,182,212,0.1)'}`;
                 e.currentTarget.style.borderColor = accentColor;
              }}
              onMouseLeave={(e) => {
                 e.currentTarget.style.transform = "translateY(0)";
                 e.currentTarget.style.boxShadow = "none";
                 e.currentTarget.style.borderColor = borderColor;
              }}
            >
              <div style={{ fontSize: "1.1rem", marginTop: "2px" }}>{isWarning ? '⚡' : '✨'}</div>
              <div style={{ color: "var(--text-main)", fontSize: "0.95rem", lineHeight: "1.5" }}>
                {cleanText}
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
        {/* Time Complexity */}
        <div style={{ backgroundColor: "var(--bg-input)", padding: "15px", borderRadius: "8px", borderTop: "3px solid var(--primary)", boxShadow: "0 2px 4px var(--shadow)", transition: "transform 0.2s" }}
             onMouseEnter={e => e.currentTarget.style.transform = "scale(1.02)"}
             onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
          <div style={{ fontSize: "0.75rem", fontWeight: "bold", letterSpacing: "0.5px", color: "var(--text-dim)" }}>TIME COMPLEXITY</div>
          <div style={{ fontSize: "1.3rem", fontWeight: "bold", color: "var(--primary)", marginTop: "6px" }}>{result.time || "N/A"}</div>
        </div>
        {/* Space Complexity */}
        <div style={{ backgroundColor: "var(--bg-input)", padding: "15px", borderRadius: "8px", borderTop: "3px solid var(--secondary)", boxShadow: "0 2px 4px var(--shadow)", transition: "transform 0.2s" }}
             onMouseEnter={e => e.currentTarget.style.transform = "scale(1.02)"}
             onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
          <div style={{ fontSize: "0.75rem", fontWeight: "bold", letterSpacing: "0.5px", color: "var(--text-dim)" }}>SPACE COMPLEXITY</div>
          <div style={{ fontSize: "1.3rem", fontWeight: "bold", color: "var(--secondary)", marginTop: "6px" }}>{result.space || "N/A"}</div>
        </div>
      </div>

      {result.warnings?.length > 0 && (
        <div>
          <h4 style={{ margin: "0 0 12px 0", color: "var(--error)", fontSize: "1rem", textTransform: "uppercase", letterSpacing: "1px", display: "flex", alignItems: "center", gap: "8px" }}>
            Security & Performance Risks
          </h4>
          {renderInteractiveList(result.warnings, 'warning')}
        </div>
      )}
      
      {result.suggestions?.length > 0 && (
        <div style={{ marginTop: "10px" }}>
          <h4 style={{ margin: "0 0 12px 0", color: "var(--primary)", fontSize: "1rem", textTransform: "uppercase", letterSpacing: "1px", display: "flex", alignItems: "center", gap: "8px" }}>
            Actionable Improvements
          </h4>
          {renderInteractiveList(result.suggestions, 'tip')}
        </div>
      )}
    </div>
  );
}

export default ResultPanel;