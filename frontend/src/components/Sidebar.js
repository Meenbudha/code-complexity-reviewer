import React from "react";

/* Thin shimmer bone for sidebar history placeholder */
function SidebarBone({ width = "80%" }) {
  return (
    <div
      className="skeleton-bone"
      style={{ width, height: "13px", borderRadius: "20px" }}
    />
  );
}

function Sidebar({ isOpen, history, onSelect, onNew, darkMode, toggleSidebar, isLoading, onOpenPricing, isPro }) {
  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="sidebar-mobile-backdrop"
          onClick={toggleSidebar}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.65)",
            zIndex: 90,
            backdropFilter: "blur(3px)",
          }}
        />
      )}

      <div
        className={`app-sidebar ${isOpen ? "sidebar-open" : ""}`}
        style={{
          width: isOpen ? "260px" : "68px",
          height: "100vh",
          backgroundColor: "var(--bg-panel)",
          borderRight: "1px solid var(--border)",
          transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          position: "relative",
          zIndex: 95
        }}
      >
        <style>{`
          @media (max-width: 768px) {
            .app-sidebar {
              position: fixed !important;
              top: 0 !important;
              left: 0 !important;
              height: 100vh !important;
              width: 280px !important;
              z-index: 100 !important;
              transform: translateX(-100%);
              transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
              box-shadow: 0 0 50px rgba(0, 0, 0, 0.8) !important;
            }
            .app-sidebar.sidebar-open {
              transform: translateX(0) !important;
            }
          }
          @media (min-width: 769px) {
            .sidebar-mobile-backdrop {
              display: none !important;
            }
          }
        `}</style>
        <div style={{ padding: "10px", width: "260px" }}>

        {/* Menu Toggle Button */}
        <div
          onClick={toggleSidebar}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            cursor: "pointer",
            color: "var(--text-dim)",
            marginBottom: "20px",
            marginLeft: "4px",
            transition: "background-color 0.2s",
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
          title={isOpen ? "Collapse Menu" : "Expand Menu"}
        >
          <span style={{ fontSize: "1.5rem", lineHeight: 1 }}>☰</span>
        </div>

        {/* Content — only visible when sidebar is open */}
        <div style={{
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 0.2s ease-in-out",
          visibility: isOpen ? "visible" : "hidden"
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
              marginBottom: "12px",
              transition: "background-color 0.2s",
              height: "44px",
              whiteSpace: "nowrap"
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = darkMode ? "#333" : "#e5e7eb"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "var(--bg-input)"}
            title="New Analysis"
          >
            <span style={{ fontSize: "1.5rem", lineHeight: 1 }}>+</span>
            <span style={{ fontSize: "0.9rem", fontWeight: "500", marginLeft: "12px" }}>
              New Analysis
            </span>
          </div>

          {/* Pro Subscription Button */}
          {onOpenPricing && (
            <div
              onClick={onOpenPricing}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "10px 14px",
                backgroundColor: isPro ? "rgba(245, 158, 11, 0.12)" : "rgba(6, 182, 212, 0.12)",
                border: isPro ? "1px solid rgba(245, 158, 11, 0.3)" : "1px solid rgba(6, 182, 212, 0.3)",
                borderRadius: "16px",
                cursor: "pointer",
                color: isPro ? "#f59e0b" : "#06b6d4",
                marginBottom: "24px",
                transition: "all 0.2s",
                height: "44px",
                whiteSpace: "nowrap"
              }}
              title="View Pro Subscription & Pricing"
            >
              <span style={{ fontSize: "1.2rem", lineHeight: 1 }}>{isPro ? "👑" : "⚡"}</span>
              <span style={{ fontSize: "0.88rem", fontWeight: "700", marginLeft: "12px" }}>
                {isPro ? "Pro Membership" : "Upgrade to Pro"}
              </span>
            </div>
          )}

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

          {/* History List — skeleton while loading, real items after */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "5px",
            overflowY: "auto",
            maxHeight: "calc(100vh - 200px)"
          }}>
            {isLoading ? (
              /* Shimmer skeleton — 4 placeholder rows */
              <div style={{ padding: "4px 14px", display: "flex", flexDirection: "column", gap: "12px" }}>
                {[90, 75, 85, 60].map((w, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      className="skeleton-bone"
                      style={{ width: "20px", height: "20px", borderRadius: "50%", flexShrink: 0 }}
                    />
                    <SidebarBone width={`${w}%`} />
                  </div>
                ))}
              </div>
            ) : history.length === 0 ? (
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
                  <span style={{ marginLeft: "12px", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {item.summary}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  </>
);
}

export default Sidebar;