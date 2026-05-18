import React from 'react';
import SkeletonLoader from './SkeletonLoader';

function ResultPanel({ result, loading }) {
  if (loading) return <SkeletonLoader />;
  if (!result) return <div style={{ textAlign: "center", marginTop: "50px", color: "var(--text-dim)" }}>Ready to analyze</div>;


  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
        {/* Time Complexity */}
        <div style={{ backgroundColor: "var(--bg-input)", padding: "15px", borderRadius: "6px", borderTop: "3px solid var(--primary)", boxShadow: "0 2px 4px var(--shadow)" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: "bold", letterSpacing: "0.5px", color: "var(--text-dim)" }}>TIME COMPLEXITY</div>
          <div style={{ fontSize: "1.2rem", fontWeight: "bold", color: "var(--primary)", marginTop: "4px" }}>{result.time || "N/A"}</div>
        </div>
        {/* Space Complexity */}
        <div style={{ backgroundColor: "var(--bg-input)", padding: "15px", borderRadius: "6px", borderTop: "3px solid var(--secondary)", boxShadow: "0 2px 4px var(--shadow)" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: "bold", letterSpacing: "0.5px", color: "var(--text-dim)" }}>SPACE COMPLEXITY</div>
          <div style={{ fontSize: "1.2rem", fontWeight: "bold", color: "var(--secondary)", marginTop: "4px" }}>{result.space || "N/A"}</div>
        </div>
      </div>

      {result.warnings?.length > 0 && (
        <div style={{ backgroundColor: "rgba(250, 205, 61, 0.1)", borderLeft: "4px solid var(--warning)", padding: "12px", borderRadius: "4px" }}>
          <h4 style={{ margin: "0 0 8px 0", color: "var(--warning)", fontSize: "1.1rem" }}>⚠️ WARNINGS</h4>
          <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "0.9rem", color: "var(--text-main)", lineHeight: "1.5" }}>
             {result.warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}
      
      {result.suggestions?.length > 0 && (
        <div style={{ backgroundColor: "rgba(44, 204, 195, 0.1)", borderLeft: "4px solid var(--primary)", padding: "12px", borderRadius: "4px" }}>
          <h4 style={{ margin: "0 0 8px 0", color: "var(--primary)", fontSize: "1.1rem" }}>💡 TIPS</h4>
          <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "0.9rem", color: "var(--text-main)", lineHeight: "1.5" }}>
             {result.suggestions.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

export default ResultPanel;