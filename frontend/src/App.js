import React, { useState, useRef, useEffect } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import CodeEditor from "./components/CodeEditor";
import ResultPanel from "./components/ResultPanel";
import ComplexityGraph from "./components/ComplexityGraph";
import AiAssistant from "./components/AiAssistant";
import "./index.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

function App() {
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
  
  // Layout Logic
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [topSectionHeight, setTopSectionHeight] = useState(600);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef(null);

  // --- 1. Load History from MongoDB on Startup ---
  useEffect(() => {
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
      .catch(err => console.error("Failed to load history:", err));
  }, []);

  // --- 2. Language Validation Logic (IMPROVED) ---
  const validateLanguage = (code, selectedLanguage) => {
    // Using stricter boundaries and specific keywords to prevent overlaps
    const hasPythonKeywords = /\bdef\b\s+\w+\s*\(|\bprint\s*\(|\bif\b.*:|\belif\b.*:|\belse\s*:|\bfor\b.*\bin\b.*:/.test(code);
    const hasJavaKeywords = /\bpublic\s+class\b|\bprivate\s+class\b|System\.out\.print|\bpublic\s+static\s+void\s+main\b|\bString\s*\[\s*\]|\bimport\s+java\./.test(code);
    const hasCKeywords = /#include\s*<|\bprintf\s*\(|\bint\s+main\s*\(|\bscanf\s*\(/.test(code);

    if (selectedLanguage === "java") {
      if (hasJavaKeywords) return { valid: true }; // Prioritize true matches
      if (hasCKeywords) return { valid: false, detected: "c" };
      if (hasPythonKeywords) return { valid: false, detected: "python" };
      return { valid: true }; // Default to true if ambiguous
    }
    
    if (selectedLanguage === "c") {
      if (hasCKeywords) return { valid: true };
      if (hasJavaKeywords) return { valid: false, detected: "java" };
      if (hasPythonKeywords) return { valid: false, detected: "python" };
      return { valid: true };
    }

    if (selectedLanguage === "python") {
      if (hasPythonKeywords) return { valid: true };
      if (hasJavaKeywords) return { valid: false, detected: "java" };
      if (hasCKeywords) return { valid: false, detected: "c" };
      return { valid: true };
    }

    return { valid: true };
  };

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
    setRefreshKey((prev) => prev + 1);
    setResult(null); 
    setLoading(true); 
    setHasAnalyzed(true); 
    
    await new Promise(r => setTimeout(r, 600));

    // A. Validate Language First
    const validation = validateLanguage(code, language);

    if (!validation.valid) {
      const detectedLang = validation.detected ? validation.detected.charAt(0).toUpperCase() + validation.detected.slice(1) : "another language";
      const selectedLang = language.charAt(0).toUpperCase() + language.slice(1);
      
      const errorResult = {
        time: "N/A",
        space: "N/A",
        warnings: [`⚠️ Language Mismatch: You selected ${selectedLang} but code looks like ${detectedLang}.`],
        suggestions: [
          `Please change the dropdown to "${detectedLang}".`,
          `Or paste valid ${selectedLang} code to proceed.`
        ]
      };

      setResult(errorResult);
      setLoading(false);
      return; 
    }

    // B. Proceed if Valid
    try {
      // FIX: Changed hardcoded URL to template literal using BACKEND_URL
      const response = await fetch(`${BACKEND_URL}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language })
      });
      const data = await response.json();
      
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
       setResult({ time: "Error", warnings: ["Backend unreachable"], suggestions: [] });
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

  return (
    <div className={`app-shell ${darkMode ? '' : 'light-mode'}`}>
      
      <Sidebar 
        isOpen={isSidebarOpen} 
        history={history} 
        onSelect={loadFromHistory}
        onNew={resetAnalysis}
        darkMode={darkMode}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
      />

      <div className="main-content">
        <Header darkMode={darkMode} setDarkMode={setDarkMode} />

        <div className="scrollable-workspace">
          <div style={{ width: "100%", maxWidth: "1600px", margin: "0 auto", padding: "0 50px", flex: 1, display: "flex", flexDirection: "column", minHeight: "100%" }}>
            
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
                justifyContent: hasAnalyzed ? "flex-start" : "center", 
                transition: isResizing ? "none" : "height 0.2s ease",
                marginBottom: "5px"
              }}
            >
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

              {hasAnalyzed && (
                <div className="analysis-panel" style={{ width: "420px", flexShrink: 0, height: "100%", display: "flex", flexDirection: "column", backgroundColor: "transparent", border: "none", paddingLeft: "20px" }}>
                   <div style={{ paddingBottom: "10px", height: "42px" }}></div>
                   <div style={{ flex: 1, overflowY: "auto", backgroundColor: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: "8px", padding: "20px", boxShadow: "0 0 20px var(--shadow)" }}>
                      <div style={{ paddingBottom: "10px", marginBottom: "20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <h3 style={{ margin: "0", color: "var(--primary)", letterSpacing: "1px", fontSize: "1.0rem", fontWeight: "700" }}>ANALYSIS REPORT</h3>
                          <span style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>AI & Metrics</span>
                      </div>
                      
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

            <div 
              onMouseDown={startResizing}
              style={{ height: "15px", width: "100%", cursor: "row-resize", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.8 }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
              onMouseLeave={(e) => e.currentTarget.style.opacity = 0.8}
            >
              <div style={{ width: "60px", height: "4px", backgroundColor: "var(--border)", borderRadius: "2px", boxShadow: "0 0 5px var(--shadow)" }}></div>
            </div>

            <div style={{ padding: "20px 0 40px 0", display: "flex", justifyContent: "center" }}>
              <div style={{ width: hasAnalyzed ? "100%" : "70%", maxWidth: hasAnalyzed ? "none" : "900px", transition: "width 0.5s ease" }}>
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