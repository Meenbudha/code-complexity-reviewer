import React from "react";

function Sidebar({ isOpen, history, onSelect, onNew, darkMode, toggleSidebar }) {
  return (
    <div
      style={{
        width: isOpen ? "260px" : "68px", // Collapsed width just for the hamburger button
        height: "100vh",
        backgroundColor: "var(--bg-panel)",
        borderRight: "1px solid var(--border)",
        transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        position: "relative",
        zIndex: 20
      }}
    >
      <div style={{ padding: "10px", width: "260px" }}> {/* Fixed width inner container */}
        
        {/* Menu Toggle Button (Hamburger) - Always visible */}
        <div 
          onClick={toggleSidebar}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center", // Center the icon
            width: "40px", // Fixed dimensions
            height: "40px",
            borderRadius: "50%",
            cursor: "pointer",
            color: "var(--text-dim)",
            marginBottom: "20px",
            marginLeft: "4px", // Align to match padding
            transition: "background-color 0.2s",
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
          title={isOpen ? "Collapse Menu" : "Expand Menu"}
        >
          <span style={{ fontSize: "1.5rem", lineHeight: 1 }}>☰</span>
        </div>

        {/* Content - Only visible when open */}
        <div style={{ 
            opacity: isOpen ? 1 : 0, 
            pointerEvents: isOpen ? "auto" : "none",
            transition: "opacity 0.2s ease-in-out",
            visibility: isOpen ? "visible" : "hidden" // Ensure it takes no interaction when hidden
        }}>
            
            {/* New Analysis Button */}
            <div
            onClick={onNew}
            style={{
                display: "flex",
                alignItems: "center",
                padding: "10px 14px",
                backgroundColor: "var(--bg-input)",
                borderRadius: "16px",
                cursor: "pointer",
                color: "var(--text-dim)",
                marginBottom: "30px",
                transition: "background-color 0.2s",
                height: "44px",
                whiteSpace: "nowrap"
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = darkMode ? "#333" : "#e5e7eb"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "var(--bg-input)"}
            title="New Analysis"
            >
            <span style={{ fontSize: "1.5rem", lineHeight: 1 }}>+</span>
            <span style={{ 
                fontSize: "0.9rem", 
                fontWeight: "500", 
                marginLeft: "12px",
            }}>
                New Analysis
            </span>
            </div>

            {/* History Label */}
            <div style={{ 
            fontSize: "0.75rem", 
            fontWeight: "bold", 
            color: "var(--text-dim)", 
            marginBottom: "10px", 
            paddingLeft: "14px",
            whiteSpace: "nowrap",
            height: "20px"
            }}>
            Recent
            </div>

            {/* History List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "5px", overflowY: "auto", maxHeight: "calc(100vh - 200px)" }}>
            {history.length === 0 ? (
                <div style={{ padding: "10px 14px", fontSize: "0.8rem", color: "var(--text-dim)", fontStyle: "italic" }}>
                No history yet.
                </div>
            ) : (
                history.map((item) => (
                <div
                    key={item.id}
                    onClick={() => onSelect(item)}
                    style={{
                    padding: "10px 14px",
                    borderRadius: "20px",
                    cursor: "pointer",
                    color: "var(--text-main)",
                    fontSize: "0.9rem",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "flex",
                    alignItems: "center",
                    transition: "background-color 0.2s",
                    height: "40px"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    title={item.summary}
                >
                    <span style={{ fontSize: "1.1rem" }}>📄</span>
                    <span style={{ 
                    marginLeft: "12px", 
                    overflow: "hidden", 
                    textOverflow: "ellipsis" 
                    }}>
                    {item.summary}
                    </span>
                </div>
                ))
            )}
            </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;