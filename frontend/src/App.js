import React, { useState, useRef, useEffect, useCallback } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import CodeEditor from "./components/CodeEditor";
import ResultPanel from "./components/ResultPanel";
import ComplexityGraph from "./components/ComplexityGraph";
import AiAssistant from "./components/AiAssistant";
import WarmupScreen from "./components/WarmupScreen";
import "./index.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

function App() {
  // --- Warmup gate: show splash until backend + ML service are awake ---
  const [isWarmedUp, setIsWarmedUp] = useState(false);
  const handleWarmupReady = useCallback(() => setIsWarmedUp(true), []);

  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("c");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Theme & Layout
  const [darkMode, setDarkMode] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Data State
  const [history, setHistory] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true); // skeleton in sidebar
  
  // Layout Logic
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [topSectionHeight, setTopSectionHeight] = useState(window.innerHeight < 800 ? window.innerHeight * 0.6 : 600);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef(null);

  // --- 1. Load History from MongoDB on Startup ---
  useEffect(() => {
    setIsHistoryLoading(true);
    fetch(`${BACKEND_URL}/history`)
      .then(res => res.json())
      .then(data => {
        const formattedHistory = data.map(item => ({
          id: item._id, 
          code: item.code,
          language: item.language,
          result: item.result,
          summary: `${item.language.toUpperCase()} Analysis`,
          timestamp: new Date(item.timestamp)
        }));
        setHistory(formattedHistory);
      })
      .catch(err => console.error("Failed to load history:", err))
      .finally(() => setIsHistoryLoading(false));
  }, []);

  // --- 3. Resize Logic ---
  const startResizing = (e) => {
    e.preventDefault();
    setIsResizing(true);
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const newHeight = e.clientY - rect.top;
        const maxHeight = window.innerHeight * 0.7;
        if (newHeight > 400 && newHeight < maxHeight) {
          setTopSectionHeight(newHeight);
        }
      }
    };
    const stopResizing = () => {
      setIsResizing(false);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };
    if (isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", stopResizing);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing]);

  // --- 4. Analysis Logic ---
  const analyzeCode = async () => {
    if (!code.trim()) {
      alert("Please paste some code before analyzing.");
      return;
    }
    setRefreshKey((prev) => prev + 1);
    setResult(null); 
    setLoading(true); 
    setHasAnalyzed(true); 

    try {
      const response = await fetch(`${BACKEND_URL}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language })
      });
      const data = await response.json();

      // Handle language mismatch (422) from ML service
      // ML sends: { error: "...", code: 422, detail: "detected:java" }
      if (data.error && data.code === 422) {
        const detectedLang = data.detail?.startsWith("detected:")
          ? data.detail.split(":")[1]
          : null;
        const errorResult = {
          time: "N/A",
          space: "N/A",
          warnings: [`⚠️ ${data.error}`],
          suggestions: detectedLang
            ? [`Please change the dropdown to "${detectedLang.charAt(0).toUpperCase() + detectedLang.slice(1)}".`]
            : ["Please select the correct language from the dropdown."]
        };
        setResult(errorResult);
        return;
      }

      setResult(data);
      
      const newEntry = {
        id: data._id || Date.now(), 
        code: code,
        language: language,
        result: data,
        summary: `${language.toUpperCase()} Analysis`,
        timestamp: new Date()
      };
      setHistory(prev => [newEntry, ...prev]);

    } catch (error) {
       setResult({ 
         time: "Error", 
         space: "Error",
         warnings: ["Backend service is unreachable."], 
         suggestions: ["Please ensure the Node.js server is running."] 
        });
    } finally {
      setLoading(false);
    }
  };

  const loadFromHistory = (item) => {
    setResult(null); 
    setLoading(true); 
    setHasAnalyzed(true); 
    
    setTimeout(() => {
        setCode(item.code);
        setLanguage(item.language);
        setResult(item.result);
        setLoading(false);
        setRefreshKey(prev => prev + 1); 
    }, 300);
  };

  const resetAnalysis = () => {
    setCode("");
    setResult(null);
    setHasAnalyzed(false); 
  };

  // --- Show warmup screen until services are awake ---
  if (!isWarmedUp) {
    return <WarmupScreen onReady={handleWarmupReady} />;
  }

  return (
    <div className={`app-shell ${darkMode ? '' : 'light-mode'}`}>
      
      <Sidebar 
        isOpen={isSidebarOpen} 
        history={history} 
        onSelect={loadFromHistory}
        onNew={resetAnalysis}
        darkMode={darkMode}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isLoading={isHistoryLoading}
      />

      <div className="main-content">
        <Header darkMode={darkMode} setDarkMode={setDarkMode} />

        <div className="scrollable-workspace">
          <div style={{ width: "100%", maxWidth: "1280px", margin: "0 auto", padding: "0 50px", flex: 1, display: "flex", flexDirection: "column", minHeight: "100%" }}>
            
            <div className={`welcome-hero ${hasAnalyzed ? 'hidden' : ''}`}>
              <h1 style={{ fontSize: "2.5rem", marginBottom: "10px", color: "var(--text-hero)" }}>
                Code<span style={{ color: "var(--primary)" }}>Mind</span> AI
              </h1>
              <p style={{ color: "var(--text-dim)", fontSize: "1.1rem" }}>
                Advanced Complexity Analysis & AI Review
              </p>
            </div>

            <div 
              ref={containerRef}
              style={{ 
                height: `${topSectionHeight}px`, 
                display: "flex", 
                gap: hasAnalyzed ? "20px" : "0",
                justifyContent: hasAnalyzed ? "flex-start" : "center", 
                transition: isResizing ? "none" : "height 0.2s ease",
                marginBottom: "5px"
              }}
            >
              <div 
                className={`editor-wrapper ${hasAnalyzed ? 'analyzed' : 'initial'}`} 
                style={{ width: hasAnalyzed ? "auto" : undefined, flex: hasAnalyzed ? 1 : undefined, minWidth: 0, height: "100%" }}
              >
                <div style={{ paddingBottom: "10px", display: "flex", alignItems: "center", justifyContent: "space-between", height: "52px" }}>
                   <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                     <label style={{ color: "var(--text-dim)" }}>Language:</label>
                     <select 
                        value={language} 
                        onChange={(e) => setLanguage(e.target.value)}
                        style={{ backgroundColor: "var(--bg-panel)", color: "var(--text-main)", border: "1px solid var(--border)", padding: "6px 12px", borderRadius: "4px", outline: "none" }}
                      >
                        <option value="c">C Language</option>
                        <option value="java">Java</option>
                        <option value="python">Python</option>
                      </select>
                   </div>
                   <button 
                      onClick={analyzeCode}
                      disabled={loading}
                      style={{ 
                        backgroundColor: loading ? "var(--border)" : "var(--primary)", 
                        color: loading ? "var(--text-dim)" : "#000", 
                        border: "none", 
                        padding: "8px 24px", 
                        borderRadius: "6px", 
                        fontWeight: "bold", 
                        cursor: loading ? "not-allowed" : "pointer",
                        transition: "all 0.2s",
                        boxShadow: loading ? "none" : "0 4px 10px rgba(6,182,212,0.3)"
                      }}
                    >
                      {loading ? "PROCESSING..." : "ANALYZE CODE"}
                    </button>
                </div>
                <div style={{ flex: 1, border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden", boxShadow: "0 0 20px var(--shadow)", backgroundColor: "var(--bg-panel)", display: "flex", flexDirection: "column" }}>
                   <CodeEditor code={code} setCode={setCode} darkMode={darkMode} />
                </div>
              </div>

              {hasAnalyzed && (
                <div className="analysis-panel" style={{ width: "370px", flexShrink: 0, height: "100%", display: "flex", flexDirection: "column", backgroundColor: "transparent", border: "none" }}>
                   <div style={{ paddingBottom: "10px", display: "flex", alignItems: "center", justifyContent: "space-between", height: "52px" }}>
                       <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                         <label style={{ color: "var(--text-dim)", fontWeight: "bold" }}>Report:</label>
                         <span style={{ color: "var(--primary)", fontWeight: "700", letterSpacing: "1px" }}>Complexity Insights</span>
                       </div>
                   </div>
                   <div style={{ flex: 1, overflowY: "auto", backgroundColor: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: "8px", padding: "20px", boxShadow: "0 0 20px var(--shadow)" }}>
                      
                      {loading ? (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "300px", color: "var(--text-dim)" }}>
                           <div className="loader-spinner" style={{ width: "40px", height: "40px", border: "3px solid var(--border)", borderTop: "3px solid var(--primary)", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: "15px" }}></div>
                           <span>Analyzing Code...</span>
                        </div>
                      ) : (
                        result && (
                          <>
                            <ResultPanel key={refreshKey} result={result} loading={loading} darkMode={darkMode} />
                            {result.time && result.time !== "N/A" && <ComplexityGraph key={refreshKey} complexity={result.time} darkMode={darkMode} />}
                          </>
                        )
                      )}
                   </div>
                </div>
              )}
            </div>

            <div 
              onMouseDown={startResizing}
              style={{ height: "15px", width: "100%", cursor: "row-resize", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.8 }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
              onMouseLeave={(e) => e.currentTarget.style.opacity = 0.8}
            >
              <div style={{ width: "60px", height: "4px", backgroundColor: "var(--border)", borderRadius: "2px", boxShadow: "0 0 5px var(--shadow)" }}></div>
            </div>

            <div style={{ padding: "20px 0 40px 0", display: "flex", justifyContent: "center" }}>
              <div style={{ width: hasAnalyzed ? "100%" : "70%", maxWidth: hasAnalyzed ? "1000px" : "900px", transition: "width 0.5s ease" }}>
                <AiAssistant code={code} />
              </div>
            </div>

          </div>
        </div>
        
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}

export default App;