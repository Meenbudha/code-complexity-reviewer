import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const CodeBlock = ({ inline, className, children, ...props }) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const codeString = String(children).replace(/\n$/, '');

  const copyToClipboard = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!inline && match) {
    return (
      <div style={{ position: 'relative', marginTop: '10px', marginBottom: '10px', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          backgroundColor: '#2d2d2d', padding: '5px 15px', borderBottom: '1px solid #1e1e1e'
        }}>
          <span style={{ color: '#858585', fontSize: '0.75rem', fontFamily: 'monospace', textTransform: 'uppercase' }}>{match[1]}</span>
          <button onClick={copyToClipboard} style={{
            background: 'none', border: 'none', color: '#858585', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem'
          }}>
            {copied ? (
              <><span style={{color: 'var(--primary)'}}>✓</span> Copied</>
            ) : (
              <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> Copy</>
            )}
          </button>
        </div>
        <SyntaxHighlighter style={vscDarkPlus} language={match[1]} PreTag="div" customStyle={{ margin: 0, padding: '15px' }} {...props}>
          {codeString}
        </SyntaxHighlighter>
      </div>
    );
  }
  return <code className={className} style={{backgroundColor: 'rgba(255,255,255,0.1)', padding: '2px 4px', borderRadius: '4px', color: 'var(--primary)'}} {...props}>{children}</code>;
};function AiAssistant({ code }) {
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  
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
        body: JSON.stringify({ code, question: q, history: history.slice(-6) }) // Send last 6 messages
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
        
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          {/* New Chat Button */}
          {history.length > 0 && isExpanded && (
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                setHistory([]); 
                setQuestion(""); 
              }} 
              style={{
                backgroundColor: "transparent",
                border: "1px solid var(--border)",
                color: "var(--text-dim)",
                padding: "6px 12px",
                borderRadius: "20px",
                fontSize: "0.8rem",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--text-main)";
                e.currentTarget.style.borderColor = "var(--text-dim)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--text-dim)";
                e.currentTarget.style.borderColor = "var(--border)";
              }}
            >
              + New Chat
            </button>
          )}
          <span style={{ color: "var(--text-dim)" }}>{isExpanded ? "▲" : "▼"}</span>
        </div>
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
              whiteSpace: msg.role === 'user' ? "pre-wrap" : "normal"
            }}>
              {msg.role === 'user' ? (
                msg.text
              ) : (
                <div className="markdown-body">
                  <ReactMarkdown
                    components={{
                      code: CodeBlock,
                      h3({children}) { return <h3 style={{ margin: "16px 0 8px 0", color: "var(--primary)", fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "6px" }}>{children}</h3>; },
                      p({children}) { return <p style={{ margin: "0 0 10px 0", lineHeight: "1.6" }}>{children}</p>; },
                      ul({children}) { return <ul style={{ margin: "10px 0", paddingLeft: "20px", lineHeight: "1.6" }}>{children}</ul>; },
                      li({children}) { return <li style={{ marginBottom: "6px" }}>{children}</li>; },
                      strong({children}) { return <strong style={{ color: "var(--text-hero)", fontWeight: "600" }}>{children}</strong>; }
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {/* --- PREMIUM SKELETON LOADING INDICATOR --- */}
        {loading && (
          <div style={{ alignSelf: 'flex-start', width: "85%", margin: "10px 0" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginBottom: "4px" }}>AI</div>
            <div style={{ 
              backgroundColor: "var(--bg-panel)", 
              border: "1px solid var(--border)", 
              padding: "18px 22px", 
              borderRadius: "20px", 
              borderTopLeftRadius: "4px",
              display: "flex",
              flexDirection: "column",
              gap: "12px"
            }}>
              <div className="skeleton-bone" style={{ width: "100%", height: "12px", borderRadius: "4px" }}></div>
              <div className="skeleton-bone" style={{ width: "90%", height: "12px", borderRadius: "4px" }}></div>
              <div className="skeleton-bone" style={{ width: "65%", height: "12px", borderRadius: "4px" }}></div>
            </div>
          </div>
        )}
        
        <div ref={chatEndRef} />
      </div>

      {/* Input Area (Claude-style) */}
      <div style={{ 
        padding: isExpanded ? "20px 30px" : "0 30px", 
        height: isExpanded ? "auto" : "0", 
        overflow: "hidden", 
        backgroundColor: "var(--bg-input)", 
        borderTop: isExpanded ? "1px solid var(--border)" : "none", 
        display: "flex", 
        flexDirection: "column"
      }}>
        <div style={{
          display: "flex",
          flexDirection: "column",
          backgroundColor: "var(--bg-main)",
          border: "1px solid var(--border)",
          borderRadius: "16px",
          padding: "12px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          transition: "border-color 0.2s"
        }}
        onFocus={(e) => e.currentTarget.style.borderColor = "var(--text-dim)"}
        onBlur={(e) => e.currentTarget.style.borderColor = "var(--border)"}
        >
          <textarea 
            value={question} 
            onChange={(e) => {
              setQuestion(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
            }} 
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if(question.trim() && !loading) askAI();
              }
            }}
            placeholder="Write a message..." 
            disabled={loading}
            rows={1}
            style={{ 
              width: "100%", 
              backgroundColor: "transparent", 
              color: "var(--text-main)", 
              border: "none", 
              outline: "none",
              fontSize: "0.95rem",
              resize: "none",
              lineHeight: "1.5",
              minHeight: "24px",
              maxHeight: "150px",
              overflowY: "auto",
              fontFamily: "inherit",
              padding: "4px 4px 8px 4px",
              opacity: loading ? 0.7 : 1
            }} 
          />
          
          {/* Bottom Toolbar (Claude-style) */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {/* Left: Plus Icon */}
            <div 
              style={{ 
                color: "var(--text-dim)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", 
                width: "32px", height: "32px", borderRadius: "8px", transition: "background 0.2s" 
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)"}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </div>

            {/* Right: Model Selector & Send Button */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div 
                style={{ 
                  color: "var(--text-dim)", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer",
                  padding: "6px 10px", borderRadius: "8px", transition: "background 0.2s"
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)"}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
              >
                CodeMind AI 
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>

              <button 
                onClick={askAI} 
                disabled={loading || !question.trim()}
                style={{ 
                  width: "32px",
                  height: "32px",
                  padding: "0",
                  backgroundColor: (loading || !question.trim()) ? "transparent" : "var(--primary)", 
                  color: (loading || !question.trim()) ? "var(--text-dim)" : "#000", 
                  border: "none", 
                  borderRadius: "8px", 
                  cursor: (loading || !question.trim()) ? "default" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s"
                }}
              >
                {loading ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ animation: "spin 1.5s linear infinite" }}>
                     <path d="M12 2L14.4 8.6L21 11L14.4 13.4L12 20L9.6 13.4L3 11L9.6 8.6L12 2Z" />
                  </svg>
                ) : (
                  // Send Arrow matching Claude/modern aesthetic
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "1px", marginTop: "1px" }}>
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
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
        @keyframes typing {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50% { transform: translateY(-4px); opacity: 1; background-color: var(--primary); }
        }
        .typing-dot {
          width: 8px;
          height: 8px;
          background-color: var(--text-dim);
          border-radius: 50%;
          animation: typing 1.4s infinite ease-in-out both;
        }
      `}</style>
    </div>
  );
}

export default AiAssistant;