import React, { useState, useRef, useEffect } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import CodeEditor from "./components/CodeEditor";
import ResultPanel from "./components/ResultPanel";
import ComplexityGraph from "./components/ComplexityGraph";
import AiAssistant from "./components/AiAssistant";
import "./index.css";

function App() {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("c");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // App State
  const [darkMode, setDarkMode] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Layout State
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [topSectionHeight, setTopSectionHeight] = useState(600);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef(null);

  // --- 1. Load History from MongoDB on Startup ---
  useEffect(() => {
    fetch("http://localhost:5000/history")
      .then(res => res.json())
      .then(data => {
        // Format DB data for Sidebar
        const formattedHistory = data.map(item => ({
          id: item._id, // MongoDB ID
          code: item.code,
          language: item.language,
          result: item.result,
          summary: `${item.language.toUpperCase()} Analysis`,
          timestamp: new Date(item.timestamp)
        }));
        setHistory(formattedHistory);
      })
      .catch(err => console.error("Failed to load history:", err));
  }, []);

  // --- 2. Language Validation Logic (Regex Heuristics) ---
  const validateLanguage = (code, selectedLanguage) => {
    // 1. Python Heuristics
    const isPython = /def\s+|import\s+|from\s+.*import|print\(|if\s+.*:|elif\s+|else:|for\s+.*in\s+.*:|#\s+/.test(code);
    
    // 2. Java Heuristics
    const isJava = /public\s+class|private\s+class|System\.out\.println|public\s+static\s+void\s+main|String\[\]|import\s+java\./.test(code);

    // 3. C Heuristics
    const isC = /#include\s+<|printf\(|int\s+main\s*\(|scanf\(|const\s+char|char\s+\*/.test(code);

    if (selectedLanguage === "c") {
      if (isPython) return { valid: false, detected: "python" };
      if (isJava) return { valid: false, detected: "java" };
      return { valid: true };
    }
    
    if (selectedLanguage === "java") {
      if (isPython) return { valid: false, detected: "python" };
      if (isC) return { valid: false, detected: "c" };
      return { valid: true };
    }

    if (selectedLanguage === "python") {
      if (isC) return { valid: false, detected: "c" };
      if (isJava) return { valid: false, detected: "java" };
      return { valid: true };
    }

    return { valid: true };
  };

  // --- 3. Resize Logic (Vertical Only) ---
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
        // Limit max height to 70% of window
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

  // --- 4. Analysis Logic with Validation ---
  const analyzeCode = async () => {
    // 1. Reset State IMMEDIATELY
    setResult(null); // Clear previous result
    setLoading(true); // Start loading
    setHasAnalyzed(true); // Ensure panel structure stays visible (showing loader)
    setRefreshKey((prev) => prev + 1); // Force re-render key
    
    // Smooth transition delay
    await new Promise(r => setTimeout(r, 600));

    // A. Validate Language First
    const validation = validateLanguage(code, language);

    if (!validation.valid) {
      const detectedLang = validation.detected ? validation.detected.charAt(0).toUpperCase() + validation.detected.slice(1) : "another language";
      const selectedLang = language.charAt(0).toUpperCase() + language.slice(1);
      
      const errorResult = {
        time: "N/A",
        space: "N/A",
        warnings: [`⚠️ Language Mismatch Detected`],
        suggestions: [
          `You selected ${selectedLang}, but your code looks like ${detectedLang}.`,
          `Please change the dropdown to "${detectedLang}" or paste valid ${selectedLang} code.`
        ]
      };

      setResult(errorResult);
      setLoading(false);
      return; 
    }

    // B. Proceed if Valid
    try {
      const response = await fetch("http://localhost:5000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language })
      });
      const data = await response.json();
      
      // Update with new data
      setResult(data);
      
      // Add to History (UI Update)
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
       setResult({ time: "Error", warnings: ["Backend unreachable"], suggestions: [] });
    } finally {
      setLoading(false);
    }
  };

  const loadFromHistory = (item) => {
    setResult(null); // Clear current result first
    setLoading(true); // Show loader
    setHasAnalyzed(true); // Ensure panel opens
    
    // Short timeout to simulate loading/refresh
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
    setHasAnalyzed(false); // Only close panel on explicit reset
  };

  return (
    <div className={`app-shell ${darkMode ? '' : 'light-mode'}`}>
      
      {/* 1. LEFT SIDEBAR */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        history={history} 
        onSelect={loadFromHistory}
        onNew={resetAnalysis}
        darkMode={darkMode}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
      />

      {/* 2. MAIN CONTENT AREA */}
      <div className="main-content">
        
        {/* Header */}
        <Header darkMode={darkMode} setDarkMode={setDarkMode} />

        {/* Scrollable Content */}
        <div className="scrollable-workspace">
          <div style={{ width: "100%", maxWidth: "1600px", margin: "0 auto", padding: "0 50px", flex: 1, display: "flex", flexDirection: "column", minHeight: "100%" }}>
            
            {/* Hero Section */}
            <div className={`welcome-hero ${hasAnalyzed ? 'hidden' : ''}`}>
              <h1 style={{ fontSize: "2.5rem", marginBottom: "10px", color: "var(--text-hero)" }}>
                Code<span style={{ color: "var(--primary)" }}>Mind</span> AI
              </h1>
              <p style={{ color: "var(--text-dim)", fontSize: "1.1rem" }}>
                Advanced Complexity Analysis & AI Review
              </p>
            </div>

            {/* Workspace (Editor + Result) */}
            <div 
              ref={containerRef}
              style={{ 
                height: `${topSectionHeight}px`, 
                display: "flex", 
                justifyContent: hasAnalyzed ? "flex-start" : "center", 
                transition: isResizing ? "none" : "height 0.2s ease",
                marginBottom: "5px"
              }}
            >
              {/* Editor */}
              <div 
                className={`editor-wrapper ${hasAnalyzed ? 'analyzed' : 'initial'}`} 
                style={{ width: hasAnalyzed ? "auto" : undefined, flex: hasAnalyzed ? 1 : undefined, minWidth: 0, height: "100%" }}
              >
                <div style={{ paddingBottom: "10px", display: "flex", alignItems: "center", gap: "10px", height: "42px" }}>
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
                <div style={{ flex: 1, border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden", boxShadow: "0 0 20px var(--shadow)", backgroundColor: "var(--bg-panel)" }}>
                   <CodeEditor code={code} setCode={setCode} darkMode={darkMode} />
                </div>
                <div style={{ paddingTop: "15px", display: "flex", justifyContent: "flex-end" }}>
                   <button 
                      onClick={analyzeCode}
                      disabled={loading}
                      style={{ backgroundColor: loading ? "#444" : "var(--primary)", color: loading ? "#888" : "#000", border: "none", padding: "10px 30px", borderRadius: "6px", fontWeight: "bold", cursor: loading ? "not-allowed" : "pointer" }}
                    >
                      {loading ? "PROCESSING..." : "ANALYZE CODE"}
                    </button>
                </div>
              </div>

              {/* Result Panel (Right Side - Fixed Width) */}
              {hasAnalyzed && (
                <div className="analysis-panel" style={{ width: "420px", flexShrink: 0, height: "100%", display: "flex", flexDirection: "column", backgroundColor: "transparent", border: "none", paddingLeft: "20px" }}>
                   <div style={{ paddingBottom: "10px", height: "42px" }}></div>
                   <div style={{ flex: 1, overflowY: "auto", backgroundColor: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: "8px", padding: "20px", boxShadow: "0 0 20px var(--shadow)" }}>
                      <div style={{ paddingBottom: "10px", marginBottom: "20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <h3 style={{ margin: "0", color: "var(--primary)", letterSpacing: "1px", fontSize: "1.0rem", fontWeight: "700" }}>ANALYSIS REPORT</h3>
                          <span style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>AI & Metrics</span>
                      </div>
                      
                      {/* STRICT CONDITIONAL RENDERING: SHOW LOADER OR RESULT, NEVER BOTH */}
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
                   <div style={{ height: "55px" }}></div>
                </div>
              )}
            </div>

            {/* Bottom Resize Handle */}
            <div 
              onMouseDown={startResizing}
              style={{ height: "15px", width: "100%", cursor: "row-resize", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.8 }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
              onMouseLeave={(e) => e.currentTarget.style.opacity = 0.8}
            >
              <div style={{ width: "60px", height: "4px", backgroundColor: "var(--border)", borderRadius: "2px", boxShadow: "0 0 5px var(--shadow)" }}></div>
            </div>

            {/* Bottom AI */}
            <div style={{ padding: "20px 0 40px 0", display: "flex", justifyContent: "center" }}>
              <div style={{ width: hasAnalyzed ? "100%" : "70%", maxWidth: hasAnalyzed ? "none" : "900px", transition: "width 0.5s ease" }}>
                <AiAssistant code={code} />
              </div>
            </div>

          </div>
        </div>
        
        {/* CSS for Spinner */}
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