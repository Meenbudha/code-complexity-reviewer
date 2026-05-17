import React, { useState, useRef, useEffect } from 'react';

function AiAssistant({ code }) {
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Updated fallback URL to match App.js fetch URL
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
  
  // --- Resizing State ---
  const [chatHeight, setChatHeight] = useState(400);
  const [resizeDirection, setResizeDirection] = useState(null); // 'top' or 'bottom'
  
  const chatEndRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [history, isExpanded, loading]);

  // --- Resizing Logic ---
  const startResizingTop = (e) => {
    e.preventDefault();
    setResizeDirection('top');
  };

  const startResizingBottom = (e) => {
    e.preventDefault();
    setResizeDirection('bottom');
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!resizeDirection) return;
      
      setChatHeight((prev) => {
        let newHeight = prev;
        
        if (resizeDirection === 'top') {
          // Dragging UP increases height (Top Handle)
          newHeight = prev - e.movementY;
        } else {
          // Dragging DOWN increases height (Bottom Handle)
          newHeight = prev + e.movementY;
        }

        // Limit minimum height
        return newHeight < 200 ? 200 : newHeight;
      });
    };

    const stopResizing = () => {
      setResizeDirection(null);
    };

    if (resizeDirection) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", stopResizing);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resizeDirection]);

  const askAI = async () => {
    if (!question.trim()) return;
    setIsExpanded(true);
    
    // Add user question immediately
    const newHistory = [...history, { role: 'user', text: question }];
    setHistory(newHistory);
    
    const q = question; 
    setQuestion(""); 
    setLoading(true); // Start loading state

    try {
      const res = await fetch(`${BACKEND_URL}/ask-ai`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, question: q })
      });
      const data = await res.json();
      setHistory([...newHistory, { role: 'ai', text: data.answer }]);
    } catch (err) {
      console.error("AI request failed:", err);
      setHistory([...newHistory, { role: 'ai', text: "Error: AI Service Unavailable" }]);
    } finally { setLoading(false); }
  };

  return (
    <div style={{ 
      display: "flex", flexDirection: "column", border: "1px solid var(--border)", 
      borderRadius: "30px", 
      backgroundColor: "var(--bg-input)", overflow: "hidden",
      boxShadow: isExpanded ? "0 10px 30px var(--shadow)" : "none", transition: "all 0.5s ease"
    }}>
      
      {/* --- Top Resize Handle --- */}
      {isExpanded && (
        <div 
          onMouseDown={startResizingTop}
          style={{
            height: "12px",
            width: "100%",
            cursor: "ns-resize",
            backgroundColor: "var(--bg-panel)",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          <div style={{ width: "40px", height: "4px", backgroundColor: "var(--border)", borderRadius: "2px" }}></div>
        </div>
      )}

      {/* Header */}
      <div onClick={() => setIsExpanded(!isExpanded)} style={{ padding: "15px 30px", backgroundColor: "var(--bg-panel)", borderBottom: isExpanded ? "1px solid var(--border)" : "none", display: "flex", justifyContent: "space-between", cursor: "pointer" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: "36px", height: "36px", borderRadius: "10px",
            background: "linear-gradient(135deg, rgba(6,182,212,0.15) 0%, rgba(139,92,246,0.15) 100%)",
            boxShadow: "0 0 15px rgba(6,182,212,0.2)"
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="aiGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--primary)" />
                  <stop offset="100%" stopColor="var(--secondary)" />
                </linearGradient>
              </defs>
              <polygon points="12 2 21 7 21 17 12 22 3 17 3 7" stroke="url(#aiGradient)" strokeWidth="2" strokeLinejoin="round" />
              <circle cx="12" cy="12" r="3" fill="url(#aiGradient)" />
              <path d="M12 2v6m0 8v6M3 7l5 3m8 4l5 3M3 17l5-3m8-4l5-3" stroke="url(#aiGradient)" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <span style={{ fontWeight: "700", fontSize: "1.1rem", color: "var(--text-main)", letterSpacing: "0.5px" }}>
            AI Assistant
          </span>
        </div>
        <span style={{ color: "var(--text-dim)" }}>{isExpanded ? "▲" : "▼"}</span>
      </div>

      {/* Chat History Area (Dynamic Height) */}
      <div style={{ 
        height: isExpanded ? `${chatHeight}px` : "0", 
        overflowY: "auto", 
        padding: isExpanded ? "20px 30px" : "0 30px", 
        backgroundColor: "var(--bg-main)", 
        transition: resizeDirection ? "none" : "all 0.5s ease" 
      }}>
        {history.map((msg, i) => (
          <div key={i} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: "85%", margin: "10px 0", textAlign: msg.role === 'user' ? 'right' : 'left' }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginBottom: "4px" }}>{msg.role === 'user' ? 'YOU' : 'AI'}</div>
            <div style={{ 
              backgroundColor: msg.role === 'user' ? "rgba(86, 38, 196, 0.1)" : "var(--bg-panel)", 
              border: "1px solid var(--border)", 
              padding: "15px 22px", 
              borderRadius: "20px", 
              borderTopRightRadius: msg.role === 'user' ? "4px" : "20px",
              borderTopLeftRadius: msg.role === 'ai' ? "4px" : "20px",
              color: "var(--text-main)",
              fontSize: "0.95rem",
              lineHeight: "1.5",
              whiteSpace: "pre-wrap"
            }}>{msg.text}</div>
          </div>
        ))}
        
        {/* --- LOADING INDICATOR --- */}
        {loading && (
          <div style={{ alignSelf: 'flex-start', maxWidth: "85%", margin: "10px 0" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginBottom: "4px" }}>AI</div>
            <div style={{ 
              backgroundColor: "var(--bg-panel)", 
              border: "1px solid var(--border)", 
              padding: "15px 22px", 
              borderRadius: "20px", 
              borderTopLeftRadius: "4px",
              color: "var(--text-main)",
              display: "flex",
              alignItems: "center",
              gap: "10px"
            }}>
              <span className="loader-text" style={{ fontSize: "0.95rem" }}>Thinking...</span>
            </div>
          </div>
        )}
        
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div style={{ 
        padding: "20px 30px", 
        backgroundColor: "var(--bg-input)", 
        borderTop: isExpanded ? "1px solid var(--border)" : "none", 
        display: "flex", 
        gap: "10px" 
      }}>
        <input 
          value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && askAI()}
          placeholder="Ask a question..." 
          disabled={loading} // Disable input while loading
          style={{ 
            flex: 1, 
            padding: "12px 20px", 
            borderRadius: "50px", 
            border: "1px solid var(--border)", 
            backgroundColor: "var(--bg-main)", 
            color: "var(--text-main)", 
            outline: "none",
            fontSize: "0.95rem",
            opacity: loading ? 0.7 : 1
          }} 
        />
        
        {/* --- Gemini-style Loading/Send Button --- */}
        <button 
          onClick={askAI} 
          disabled={loading}
          style={{ 
            width: "44px",
            height: "44px",
            padding: "0",
            backgroundColor: loading ? "var(--bg-panel)" : "var(--secondary)", 
            color: loading ? "var(--primary)" : "#fff", 
            border: loading ? "1px solid var(--border)" : "none", 
            borderRadius: "50%", 
            cursor: loading ? "default" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s"
          }}
        >
          {loading ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{ animation: "spin 1.5s linear infinite" }}>
               <path d="M12 2L14.4 8.6L21 11L14.4 13.4L12 20L9.6 13.4L3 11L9.6 8.6L12 2Z" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "2px" }}>
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          )}
        </button>
      </div>

      {/* --- Bottom Resize Handle --- */}
      {isExpanded && (
        <div 
          onMouseDown={startResizingBottom}
          style={{
            height: "12px",
            width: "100%",
            cursor: "ns-resize",
            backgroundColor: "var(--bg-input)",
            borderTop: "none", 
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            paddingBottom: "4px"
          }}
        >
          <div style={{ width: "40px", height: "4px", backgroundColor: "var(--border)", borderRadius: "2px" }}></div>
        </div>
      )}
      
      {/* Animation Style */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default AiAssistant;