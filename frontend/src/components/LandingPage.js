import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

const PRESET_DEMOS = [
  {
    id: "mergesort",
    title: "Merge Sort",
    lang: "javascript",
    time: "O(n log n)",
    space: "O(n)",
    rating: "Optimal",
    ratingColor: "#10b981",
    insight: "Efficient divide-and-conquer strategy with guaranteed O(n log n) worst-case time complexity. Space requires auxiliary array of size n.",
    code: `function mergeSort(arr) {
  if (arr.length <= 1) return arr;
  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));
  return merge(left, right);
}`
  },
  {
    id: "binsearch",
    title: "Binary Search",
    lang: "python",
    time: "O(log n)",
    space: "O(1)",
    rating: "Best-in-Class",
    ratingColor: "#06b6d4",
    insight: "Logarithmic search halving search space every iteration. Constant auxiliary space makes it memory-optimal.",
    code: `def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1`
  },
  {
    id: "nested",
    title: "Nested Loops (Matrix)",
    lang: "cpp",
    time: "O(n²)",
    space: "O(1)",
    rating: "Suboptimal",
    ratingColor: "#f59e0b",
    insight: "Quadratic time complexity due to nested iterations over matrix dimensions. Can cause performance bottlenecks for n > 10,000.",
    code: `void printMatrix(const vector<vector<int>>& mat) {
    int n = mat.size();
    for (int i = 0; i < n; ++i) {
        for (int j = 0; j < n; ++j) {
            cout << mat[i][j] << " ";
        }
        cout << "\\n";
    }
}`
  },
  {
    id: "fib",
    title: "Recursive Fibonacci",
    lang: "python",
    time: "O(2ⁿ)",
    space: "O(n)",
    rating: "Critical Bottleneck",
    ratingColor: "#ef4444",
    insight: "Exponential recursion tree with overlapping subproblems. Recommend refactoring to Memoization / DP for O(n) time.",
    code: `def fib(n):
    if n <= 1:
        return n
    # Redundant branch calculations
    return fib(n - 1) + fib(n - 2)`
  }
];

export default function LandingPage({
  onNavigate,
  serviceStatus = "online", // "online" | "waking"
}) {
  const { isAuthenticated, user, isPro } = useAuth();
  const [selectedDemo, setSelectedDemo] = useState(PRESET_DEMOS[0]);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedDemo.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const initials = user?.name
    ? user.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <div style={{
      height: "100vh",
      overflowY: "auto",
      backgroundColor: "#080c18",
      color: "#f8fafc",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      position: "relative",
      scrollBehavior: "smooth"
    }}>
      {/* ── STYLES ───────────────────────────────────────────────────────── */}
      <style>{`
        @keyframes subtleGlow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
        @keyframes floatAnim {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
        .landing-nav-link {
          color: #94a3b8;
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 500;
          transition: color 0.2s ease;
          cursor: pointer;
        }
        .landing-nav-link:hover {
          color: #38bdf8;
        }
        .cta-btn-primary {
          background: linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%);
          color: #ffffff;
          border: none;
          padding: 12px 26px;
          border-radius: 12px;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.25s ease;
          box-shadow: 0 4px 20px rgba(6, 182, 212, 0.35);
          display: inline-flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
        }
        .cta-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(6, 182, 212, 0.5);
          filter: brightness(1.08);
        }
        .cta-btn-secondary {
          background: rgba(30, 41, 59, 0.7);
          color: #e2e8f0;
          border: 1px solid rgba(51, 65, 85, 0.8);
          padding: 12px 24px;
          border-radius: 12px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          backdrop-filter: blur(8px);
        }
        .cta-btn-secondary:hover {
          background: rgba(51, 65, 85, 0.9);
          border-color: rgba(6, 182, 212, 0.5);
          color: #ffffff;
          transform: translateY(-2px);
        }
        .feature-card {
          background: linear-gradient(160deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%);
          border: 1px solid rgba(51, 65, 85, 0.6);
          border-radius: 20px;
          padding: 30px;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          backdrop-filter: blur(12px);
          position: relative;
          overflow: hidden;
        }
        .feature-card:hover {
          transform: translateY(-6px);
          border-color: rgba(6, 182, 212, 0.5);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), 0 0 30px rgba(6, 182, 212, 0.12);
        }
        .demo-tab-btn {
          padding: 8px 16px;
          border-radius: 10px;
          font-size: 0.85rem;
          font-weight: 600;
          border: 1px solid transparent;
          cursor: pointer;
          transition: all 0.2s ease;
          background: transparent;
          color: #94a3b8;
        }
        .demo-tab-btn.active {
          background: rgba(6, 182, 212, 0.15);
          border-color: rgba(6, 182, 212, 0.4);
          color: #38bdf8;
        }
        .demo-tab-btn:hover:not(.active) {
          background: rgba(255, 255, 255, 0.05);
          color: #e2e8f0;
        }
        .mesh-bg {
          background-image: 
            radial-gradient(circle at 20% 15%, rgba(6, 182, 212, 0.12) 0%, transparent 40%),
            radial-gradient(circle at 80% 25%, rgba(139, 92, 246, 0.12) 0%, transparent 45%),
            radial-gradient(circle at 50% 80%, rgba(6, 182, 212, 0.08) 0%, transparent 50%);
        }
      `}</style>

      {/* ── TOP STICKY NAVBAR ────────────────────────────────────────────── */}
      <header style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "rgba(8, 12, 24, 0.85)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(51, 65, 85, 0.4)",
        padding: "0 28px",
        height: "70px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        {/* Brand / Logo */}
        <div 
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}
        >
          <div style={{ position: "relative" }}>
            <img
              src="/codemind-logo.png"
              alt="CodeMind AI Logo"
              style={{
                height: "38px",
                width: "38px",
                objectFit: "contain",
                borderRadius: "10px",
                filter: "drop-shadow(0 0 10px rgba(6, 182, 212, 0.6))",
              }}
            />
            <div style={{
              position: "absolute",
              inset: "-2px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #06b6d4, #8b5cf6)",
              zIndex: -1,
              opacity: 0.6,
              filter: "blur(4px)"
            }} />
          </div>
          <div>
            <h1 style={{
              margin: 0,
              fontSize: "1.25rem",
              fontWeight: "800",
              letterSpacing: "-0.5px",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}>
              <span style={{ color: "#ffffff" }}>Code</span>
              <span style={{
                background: "linear-gradient(135deg, #06b6d4, #8b5cf6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>Mind</span>
              <span style={{
                fontSize: "0.65rem",
                fontWeight: "700",
                color: "#38bdf8",
                background: "rgba(6, 182, 212, 0.15)",
                border: "1px solid rgba(6, 182, 212, 0.3)",
                padding: "2px 6px",
                borderRadius: "6px",
                marginLeft: "4px",
                letterSpacing: "1px",
              }}>AI</span>
            </h1>
          </div>
        </div>

        {/* Center Nav Links */}
        <nav style={{ display: "flex", alignItems: "center", gap: "28px" }} className="desktop-nav">
          <a href="#features" className="landing-nav-link">Features</a>
          <a href="#demo" className="landing-nav-link">Live Demo</a>
          <a href="#how-it-works" className="landing-nav-link">How It Works</a>
          <button 
            onClick={() => onNavigate("pricing")} 
            className="landing-nav-link" 
            style={{ background: "none", border: "none", padding: 0 }}
          >
            Pricing
          </button>
        </nav>

        {/* Right side — Status indicator & Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          {/* Subtle Service Status Badge */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "7px",
            padding: "5px 12px",
            borderRadius: "20px",
            background: serviceStatus === "online" ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.12)",
            border: `1px solid ${serviceStatus === "online" ? "rgba(16, 185, 129, 0.25)" : "rgba(245, 158, 11, 0.3)"}`,
            fontSize: "0.75rem",
            fontWeight: "600",
            color: serviceStatus === "online" ? "#10b981" : "#f59e0b",
          }}>
            <div style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              backgroundColor: serviceStatus === "online" ? "#10b981" : "#f59e0b",
              boxShadow: serviceStatus === "online" ? "0 0 8px #10b981" : "0 0 8px #f59e0b",
              animation: serviceStatus === "online" ? "none" : "pulseDot 1.5s infinite"
            }} />
            <span>{serviceStatus === "online" ? "AI Engine Ready" : "Warming Engine..."}</span>
          </div>

          {/* Conditional Auth CTAs */}
          {isAuthenticated ? (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "4px 10px 4px 6px",
                borderRadius: "20px",
                background: "rgba(30, 41, 59, 0.7)",
                border: "1px solid rgba(51, 65, 85, 0.8)",
              }}>
                <div style={{
                  width: "26px",
                  height: "26px",
                  borderRadius: "50%",
                  background: isPro ? "linear-gradient(135deg, #f59e0b, #d97706)" : "linear-gradient(135deg, #06b6d4, #8b5cf6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.7rem",
                  fontWeight: "700",
                  color: "#fff"
                }}>
                  {initials}
                </div>
                <span style={{ fontSize: "0.82rem", fontWeight: "600", color: "#e2e8f0" }}>{user?.name || "Member"}</span>
              </div>

              <button
                id="landing-workspace-btn"
                onClick={() => onNavigate("dashboard")}
                className="cta-btn-primary"
                style={{ padding: "8px 18px", fontSize: "0.85rem" }}
              >
                Launch Workspace
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button
                id="landing-signin-btn"
                onClick={() => onNavigate("login")}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#e2e8f0",
                  fontWeight: "600",
                  fontSize: "0.88rem",
                  cursor: "pointer",
                  padding: "8px 14px",
                  borderRadius: "8px",
                  transition: "color 0.2s ease"
                }}
                onMouseEnter={e => e.currentTarget.style.color = "#38bdf8"}
                onMouseLeave={e => e.currentTarget.style.color = "#e2e8f0"}
              >
                Sign In
              </button>

              <button
                id="landing-register-btn"
                onClick={() => onNavigate("register")}
                className="cta-btn-primary"
                style={{ padding: "8px 18px", fontSize: "0.85rem" }}
              >
                Get Started Free
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── HERO SECTION ─────────────────────────────────────────────────── */}
      <section className="mesh-bg" style={{
        padding: "70px 24px 80px",
        maxWidth: "1280px",
        margin: "0 auto",
        position: "relative",
      }}>
        {/* Ambient background glow */}
        <div style={{
          position: "absolute",
          top: "10%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "650px",
          height: "350px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, rgba(139, 92, 246, 0.08) 50%, transparent 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
          zIndex: 0,
          animation: "subtleGlow 8s ease-in-out infinite"
        }} />

        <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: "860px", margin: "0 auto 50px" }}>
          {/* Hero pill badge */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 16px",
            borderRadius: "30px",
            background: "rgba(6, 182, 212, 0.1)",
            border: "1px solid rgba(6, 182, 212, 0.3)",
            marginBottom: "24px",
            boxShadow: "0 0 20px rgba(6, 182, 212, 0.2)"
          }}>
            <span style={{ fontSize: "0.9rem" }}>⚡</span>
            <span style={{
              fontSize: "0.82rem",
              fontWeight: "700",
              color: "#38bdf8",
              letterSpacing: "0.5px",
              textTransform: "uppercase"
            }}>
              Next-Gen Algorithm Complexity Intelligence
            </span>
          </div>

          {/* Hero Headline */}
          <h2 style={{
            fontSize: "clamp(2.5rem, 5vw, 4rem)",
            fontWeight: "900",
            lineHeight: 1.12,
            letterSpacing: "-1.5px",
            margin: "0 0 20px",
            color: "#ffffff"
          }}>
            Master Algorithm Complexity.<br />
            <span style={{
              background: "linear-gradient(135deg, #38bdf8 0%, #818cf8 50%, #c084fc 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              Powered by Real-Time AI.
            </span>
          </h2>

          {/* Hero Subtitle */}
          <p style={{
            fontSize: "clamp(1rem, 2vw, 1.2rem)",
            lineHeight: 1.65,
            color: "#94a3b8",
            margin: "0 auto 36px",
            maxWidth: "700px"
          }}>
            Instantly predict Big-O time and space bounds (<span style={{ color: "#38bdf8", fontWeight: "600" }}>O(n log n)</span>, <span style={{ color: "#a855f7", fontWeight: "600" }}>O(1)</span>), pinpoint AST bottlenecks, and generate optimized code refactors for LeetCode, system design, and production workloads.
          </p>

          {/* Hero CTA Button Group */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", flexWrap: "wrap" }}>
            <button
              id="hero-start-btn"
              onClick={() => onNavigate(isAuthenticated ? "dashboard" : "register")}
              className="cta-btn-primary"
              style={{ padding: "14px 32px", fontSize: "1.05rem" }}
            >
              <span>{isAuthenticated ? "Go to Workspace →" : "Get Started for Free"}</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>

            <a href="#demo" className="cta-btn-secondary" style={{ padding: "14px 28px", fontSize: "1.05rem", textDecoration: "none" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.5">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <span>Interactive Live Demo</span>
            </a>
          </div>

          {/* Trust badges */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "24px",
            marginTop: "32px",
            fontSize: "0.8rem",
            color: "#64748b",
            flexWrap: "wrap"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ color: "#10b981" }}>✓</span> No credit card required
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ color: "#10b981" }}>✓</span> Dual AST + ML analysis
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ color: "#10b981" }}>✓</span> Python, C++, Java, JS, Go
            </div>
          </div>
        </div>

        {/* ── INTERACTIVE HERO CODE SHOWCASE ──────────────────────────────── */}
        <div id="demo" style={{
          position: "relative",
          zIndex: 1,
          maxWidth: "1060px",
          margin: "0 auto",
          background: "linear-gradient(160deg, rgba(22, 32, 52, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)",
          borderRadius: "24px",
          border: "1px solid rgba(51, 65, 85, 0.8)",
          boxShadow: "0 30px 100px rgba(0, 0, 0, 0.7), 0 0 40px rgba(6, 182, 212, 0.15)",
          overflow: "hidden",
        }}>
          {/* Top Bar with preset selector */}
          <div style={{
            padding: "16px 22px",
            background: "rgba(15, 23, 42, 0.9)",
            borderBottom: "1px solid rgba(51, 65, 85, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px"
          }}>
            {/* Window controls + Tag */}
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{ display: "flex", gap: "7px" }}>
                <div style={{ width: "11px", height: "11px", borderRadius: "50%", background: "#ef4444" }} />
                <div style={{ width: "11px", height: "11px", borderRadius: "50%", background: "#f59e0b" }} />
                <div style={{ width: "11px", height: "11px", borderRadius: "50%", background: "#10b981" }} />
              </div>
              <span style={{ fontSize: "0.8rem", color: "#64748b", fontFamily: "monospace" }}>
                codemind-analyzer://playground
              </span>
            </div>

            {/* Algorithm Selector Tabs */}
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {PRESET_DEMOS.map(demo => (
                <button
                  key={demo.id}
                  onClick={() => setSelectedDemo(demo)}
                  className={`demo-tab-btn ${selectedDemo.id === demo.id ? "active" : ""}`}
                >
                  {demo.title}
                </button>
              ))}
            </div>
          </div>

          {/* Main Showcase Body (Split View) */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
            minHeight: "360px",
          }}>
            {/* Left: Code Snippet */}
            <div style={{
              padding: "24px",
              background: "rgba(11, 17, 32, 0.9)",
              borderRight: "1px solid rgba(51, 65, 85, 0.5)",
              position: "relative",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between"
            }}>
              <div>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "16px"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{
                      fontSize: "0.72rem",
                      fontWeight: "700",
                      color: "#38bdf8",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      background: "rgba(6, 182, 212, 0.12)",
                      padding: "3px 8px",
                      borderRadius: "6px"
                    }}>
                      {selectedDemo.lang}
                    </span>
                    <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "#e2e8f0" }}>
                      {selectedDemo.title}
                    </span>
                  </div>

                  <button
                    onClick={handleCopy}
                    style={{
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(51, 65, 85, 0.7)",
                      color: copied ? "#10b981" : "#94a3b8",
                      borderRadius: "6px",
                      padding: "4px 10px",
                      fontSize: "0.75rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px"
                    }}
                  >
                    {copied ? "✓ Copied" : "Copy"}
                  </button>
                </div>

                <pre style={{
                  margin: 0,
                  fontFamily: "'Fira Code', 'Consolas', monospace",
                  fontSize: "0.88rem",
                  lineHeight: "1.75",
                  color: "#e2e8f0",
                  whiteSpace: "pre-wrap",
                  overflowX: "auto",
                }}>
                  <code>{selectedDemo.code}</code>
                </pre>
              </div>

              <div style={{ marginTop: "24px", display: "flex", alignItems: "center", gap: "10px" }}>
                <button
                  onClick={() => onNavigate(isAuthenticated ? "dashboard" : "register")}
                  style={{
                    background: "rgba(6, 182, 212, 0.15)",
                    border: "1px solid rgba(6, 182, 212, 0.4)",
                    color: "#38bdf8",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    fontSize: "0.82rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <span>Open in Full Editor →</span>
                </button>
              </div>
            </div>

            {/* Right: Instant AI Analysis Output */}
            <div style={{
              padding: "24px",
              background: "rgba(15, 23, 42, 0.75)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "20px"
            }}>
              <div>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "18px"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#06b6d4" }} />
                    <span style={{ fontSize: "0.8rem", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px" }}>
                      AI Complexity Report
                    </span>
                  </div>

                  <span style={{
                    fontSize: "0.72rem",
                    fontWeight: "700",
                    padding: "3px 10px",
                    borderRadius: "20px",
                    background: `${selectedDemo.ratingColor}20`,
                    color: selectedDemo.ratingColor,
                    border: `1px solid ${selectedDemo.ratingColor}40`
                  }}>
                    {selectedDemo.rating}
                  </span>
                </div>

                {/* Big-O Badges */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                  <div style={{
                    background: "rgba(6, 182, 212, 0.08)",
                    border: "1px solid rgba(6, 182, 212, 0.25)",
                    borderRadius: "14px",
                    padding: "16px",
                  }}>
                    <div style={{ fontSize: "0.72rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: "600", marginBottom: "4px" }}>
                      Time Complexity
                    </div>
                    <div style={{ fontSize: "1.6rem", fontWeight: "900", color: "#38bdf8", fontFamily: "monospace" }}>
                      {selectedDemo.time}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "4px" }}>
                      Worst-case theoretical
                    </div>
                  </div>

                  <div style={{
                    background: "rgba(139, 92, 246, 0.08)",
                    border: "1px solid rgba(139, 92, 246, 0.25)",
                    borderRadius: "14px",
                    padding: "16px",
                  }}>
                    <div style={{ fontSize: "0.72rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: "600", marginBottom: "4px" }}>
                      Space Complexity
                    </div>
                    <div style={{ fontSize: "1.6rem", fontWeight: "900", color: "#c084fc", fontFamily: "monospace" }}>
                      {selectedDemo.space}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "4px" }}>
                      Auxiliary heap & stack
                    </div>
                  </div>
                </div>

                {/* AI Explanation Pill Card */}
                <div style={{
                  background: "rgba(30, 41, 59, 0.6)",
                  border: "1px solid rgba(51, 65, 85, 0.6)",
                  borderRadius: "14px",
                  padding: "16px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <div style={{
                      width: "22px",
                      height: "22px",
                      borderRadius: "6px",
                      background: "linear-gradient(135deg, #06b6d4, #8b5cf6)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.65rem",
                      fontWeight: "800",
                      color: "#fff"
                    }}>
                      AI
                    </div>
                    <span style={{ fontSize: "0.82rem", fontWeight: "700", color: "#e2e8f0" }}>
                      Neural AST Assessment
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "#94a3b8", lineHeight: "1.6" }}>
                    {selectedDemo.insight}
                  </p>
                </div>
              </div>

              {/* Bottom Quick Test CTA */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingTop: "14px",
                borderTop: "1px solid rgba(51, 65, 85, 0.5)",
              }}>
                <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                  Want to test your own custom snippet?
                </span>
                <button
                  onClick={() => onNavigate("dashboard")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#38bdf8",
                    fontSize: "0.82rem",
                    fontWeight: "700",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                >
                  Open Editor →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── KEY CAPABILITIES & FEATURES ──────────────────────────────────── */}
      <section id="features" style={{
        padding: "80px 24px",
        maxWidth: "1280px",
        margin: "0 auto",
      }}>
        <div style={{ textAlign: "center", maxWidth: "720px", margin: "0 auto 60px" }}>
          <div style={{
            fontSize: "0.8rem",
            fontWeight: "700",
            color: "#38bdf8",
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            marginBottom: "12px"
          }}>
            Engine Architecture
          </div>
          <h3 style={{
            fontSize: "clamp(2rem, 3.5vw, 2.75rem)",
            fontWeight: "800",
            letterSpacing: "-1px",
            margin: "0 0 16px",
            color: "#ffffff"
          }}>
            Built for Engineers, Students & System Architects
          </h3>
          <p style={{ fontSize: "1.05rem", color: "#94a3b8", lineHeight: 1.6, margin: 0 }}>
            Combining static syntax tree parsing with neural machine learning models to deliver precision algorithm insights in milliseconds.
          </p>
        </div>

        {/* Feature Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "24px",
        }}>
          {[
            {
              icon: "⚡",
              title: "Deterministic AST Engine",
              desc: "Deep syntax tree traversal analyzes recursion depth, nested loops, branching factor, and memory allocations without needing runtime execution."
            },
            {
              icon: "🧠",
              title: "Neural ML Complexity Model",
              desc: "Trained on millions of competitive programming snippets to classify ambiguous Big-O bounds and dynamic programming patterns accurately."
            },
            {
              icon: "📈",
              title: "Interactive Asymptotic Plots",
              desc: "Visualize your code's growth trajectory side-by-side against standard complexity classes from O(1) to O(2ⁿ) with customizable input sizes."
            },
            {
              icon: "💬",
              title: "Conversational AI Mentor",
              desc: "Ask follow-up questions, request optimal refactorings, or generate interview-ready explanations directly through our streaming assistant."
            },
            {
              icon: "🛡️",
              title: "Security & Risk Auditing",
              desc: "Automatic detection of stack overflow risks, runaway while-loops, unbounded memory allocations, and expensive quadratic string concatenations."
            },
            {
              icon: "🌐",
              title: "Multi-Language Compatibility",
              desc: "Full support for Python, JavaScript, TypeScript, C++, Java, and Go with auto-detection and syntax-aware parsing."
            }
          ].map((f, i) => (
            <div key={i} className="feature-card">
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "rgba(6, 182, 212, 0.12)",
                border: "1px solid rgba(6, 182, 212, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.4rem",
                marginBottom: "20px"
              }}>
                {f.icon}
              </div>
              <h4 style={{ fontSize: "1.2rem", fontWeight: "700", color: "#f8fafc", margin: "0 0 10px" }}>
                {f.title}
              </h4>
              <p style={{ fontSize: "0.92rem", color: "#94a3b8", lineHeight: 1.6, margin: 0 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS SECTION ─────────────────────────────────────────── */}
      <section id="how-it-works" style={{
        padding: "80px 24px",
        background: "rgba(15, 23, 42, 0.5)",
        borderTop: "1px solid rgba(51, 65, 85, 0.4)",
        borderBottom: "1px solid rgba(51, 65, 85, 0.4)",
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", maxWidth: "650px", margin: "0 auto 60px" }}>
            <div style={{
              fontSize: "0.8rem",
              fontWeight: "700",
              color: "#818cf8",
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              marginBottom: "12px"
            }}>
              Workflow
            </div>
            <h3 style={{ fontSize: "clamp(2rem, 3.5vw, 2.5rem)", fontWeight: "800", color: "#ffffff", margin: "0 0 16px" }}>
              Three Simple Steps to Flawless Code
            </h3>
            <p style={{ fontSize: "1rem", color: "#94a3b8", margin: 0 }}>
              From raw code snippet to production-grade optimization in under 5 seconds.
            </p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "30px",
          }}>
            {[
              {
                step: "01",
                title: "Input Code Snippet",
                desc: "Paste your function or algorithm in Python, C++, Java, or JS. Auto-detect identifies the language instantly."
              },
              {
                step: "02",
                title: "Dual AI & AST Inspection",
                desc: "Our engine walks the syntax tree, measures loop nesting, and evaluates execution bounds against neural models."
              },
              {
                step: "03",
                title: "Receive Complexity & Refactor",
                desc: "Get certified Big-O ratings, asymptotic graph visualizer, and click-to-apply AI refactored code."
              }
            ].map((s, idx) => (
              <div key={idx} style={{
                background: "rgba(30, 41, 59, 0.5)",
                border: "1px solid rgba(51, 65, 85, 0.6)",
                borderRadius: "20px",
                padding: "32px",
                position: "relative"
              }}>
                <div style={{
                  fontSize: "2.5rem",
                  fontWeight: "900",
                  color: "rgba(6, 182, 212, 0.25)",
                  fontFamily: "monospace",
                  marginBottom: "16px"
                }}>
                  {s.step}
                </div>
                <h4 style={{ fontSize: "1.2rem", fontWeight: "700", color: "#ffffff", margin: "0 0 10px" }}>
                  {s.title}
                </h4>
                <p style={{ fontSize: "0.9rem", color: "#94a3b8", lineHeight: 1.6, margin: 0 }}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS & SOCIAL PROOF ─────────────────────────────────────────── */}
      <section style={{
        padding: "60px 24px",
        maxWidth: "1100px",
        margin: "0 auto",
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "24px",
          textAlign: "center"
        }}>
          {[
            { value: "10,000+", label: "Algorithms Analyzed" },
            { value: "99.8%", label: "AST Parse Accuracy" },
            { value: "< 350ms", label: "Average Inference Time" },
            { value: "6+", label: "Supported Languages" },
          ].map((st, i) => (
            <div key={i} style={{
              padding: "24px",
              background: "rgba(30, 41, 59, 0.4)",
              borderRadius: "16px",
              border: "1px solid rgba(51, 65, 85, 0.5)"
            }}>
              <div style={{
                fontSize: "2.2rem",
                fontWeight: "900",
                color: "#38bdf8",
                marginBottom: "6px",
                letterSpacing: "-0.5px"
              }}>
                {st.value}
              </div>
              <div style={{ fontSize: "0.85rem", color: "#94a3b8", fontWeight: "500" }}>
                {st.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING BANNER CALLOUT ───────────────────────────────────────── */}
      <section style={{
        padding: "80px 24px",
        maxWidth: "1060px",
        margin: "0 auto",
      }}>
        <div style={{
          background: "linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(139, 92, 246, 0.18) 100%)",
          border: "1px solid rgba(6, 182, 212, 0.4)",
          borderRadius: "28px",
          padding: "50px 40px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)"
        }}>
          <h3 style={{
            fontSize: "clamp(1.8rem, 3vw, 2.5rem)",
            fontWeight: "800",
            color: "#ffffff",
            margin: "0 0 16px"
          }}>
            Accelerate Your Engineering Career with Pro
          </h3>
          <p style={{
            fontSize: "1.05rem",
            color: "#cbd5e1",
            maxWidth: "640px",
            margin: "0 auto 32px",
            lineHeight: 1.6
          }}>
            Unlock unlimited AI code reviews, interactive asymptotic charts, PDF complexity exports, and 24/7 priority support.
          </p>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", flexWrap: "wrap" }}>
            <button
              onClick={() => onNavigate("pricing")}
              className="cta-btn-primary"
              style={{ padding: "14px 32px", fontSize: "1rem" }}
            >
              👑 View Pro Plans & Pricing
            </button>
            <button
              onClick={() => onNavigate(isAuthenticated ? "dashboard" : "register")}
              className="cta-btn-secondary"
              style={{ padding: "14px 26px", fontSize: "1rem" }}
            >
              Start Free (No Card Needed)
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: "1px solid rgba(51, 65, 85, 0.5)",
        background: "rgba(11, 17, 32, 0.98)",
        padding: "40px 24px 30px",
      }}>
        <div style={{
          maxWidth: "1280px",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "20px"
        }}>
          {/* Logo & Copyright */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <img
              src="/codemind-logo.png"
              alt="CodeMind AI"
              style={{ width: "30px", height: "30px", borderRadius: "8px" }}
            />
            <span style={{ fontSize: "0.95rem", fontWeight: "700", color: "#f8fafc" }}>
              CodeMind <span style={{ color: "#38bdf8" }}>AI</span>
            </span>
            <span style={{ fontSize: "0.8rem", color: "#64748b", marginLeft: "8px" }}>
              © {new Date().getFullYear()} CodeMind AI. All rights reserved.
            </span>
          </div>

          {/* Footer Navigation */}
          <div style={{ display: "flex", alignItems: "center", gap: "20px", fontSize: "0.85rem", color: "#94a3b8" }}>
            <a href="#features" className="landing-nav-link">Features</a>
            <a href="#demo" className="landing-nav-link">Demo</a>
            <button 
              onClick={() => onNavigate("pricing")} 
              className="landing-nav-link"
              style={{ background: "none", border: "none", padding: 0 }}
            >
              Pricing
            </button>
            <button 
              onClick={() => onNavigate(isAuthenticated ? "dashboard" : "login")}
              className="landing-nav-link"
              style={{ background: "none", border: "none", padding: 0, color: "#38bdf8" }}
            >
              {isAuthenticated ? "Launch Dashboard" : "Sign In"}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
