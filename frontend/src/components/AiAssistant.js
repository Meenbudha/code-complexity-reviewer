import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useAuth } from '../context/AuthContext';

/* ─── Inline Styles & Animations ────────────────────────────────────────── */
const styles = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse-dot {
    0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
    40%            { transform: scale(1);   opacity: 1; }
  }
  @keyframes shimmer {
    0%   { background-position: -600px 0; }
    100% { background-position:  600px 0; }
  }
  @keyframes wave {
    0%, 100% { height: 5px; }
    50%       { height: 15px; }
  }

  .ai-message-in { animation: fadeSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

  .copilot-shell {
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .copilot-shell:focus-within {
    border-color: rgba(6, 182, 212, 0.5) !important;
    box-shadow: 0 12px 35px rgba(0,0,0,0.5), 0 0 25px rgba(6,182,212,0.18) !important;
  }

  .copilot-pill-btn {
    transition: all 0.2s ease;
  }
  .copilot-pill-btn:hover {
    background: rgba(255, 255, 255, 0.12) !important;
    border-color: rgba(255, 255, 255, 0.25) !important;
    color: #ffffff !important;
  }

  .copilot-send-btn {
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .copilot-send-btn:not(:disabled):hover {
    transform: scale(1.08);
    background: linear-gradient(135deg, #06b6d4, #8b5cf6) !important;
    box-shadow: 0 4px 18px rgba(6,182,212,0.45) !important;
  }
  .copilot-send-btn:not(:disabled):active { transform: scale(0.95); }

  .wave-bar {
    width: 2.5px;
    background: #06b6d4;
    border-radius: 2px;
    animation: wave 1.2s ease-in-out infinite;
  }
  .wave-bar:nth-child(2) { animation-delay: 0.2s; }
  .wave-bar:nth-child(3) { animation-delay: 0.4s; }
  .wave-bar:nth-child(4) { animation-delay: 0.6s; }

  .ai-textarea:focus { outline: none; }

  .ai-new-chat-btn:hover {
    background: rgba(6,182,212,0.1) !important;
    border-color: var(--primary) !important;
    color: var(--primary) !important;
  }

  .typing-dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    background: var(--primary);
    display: inline-block;
    animation: pulse-dot 1.2s infinite ease-in-out both;
  }
  .typing-dot:nth-child(2) { animation-delay: 0.2s; }
  .typing-dot:nth-child(3) { animation-delay: 0.4s; }

  .skeleton-bone {
    background: linear-gradient(
      90deg,
      var(--bg-input) 25%,
      var(--border)   50%,
      var(--bg-input) 75%
    );
    background-size: 600px 100%;
    animation: shimmer 1.6s ease-in-out infinite;
    border-radius: 6px;
  }

  .ai-copy-btn:hover { color: var(--primary) !important; background: rgba(6,182,212,0.08) !important; border-radius: 5px; }

  .ai-scroll::-webkit-scrollbar { width: 5px; }
  .ai-scroll::-webkit-scrollbar-track { background: transparent; }
  .ai-scroll::-webkit-scrollbar-thumb { background: var(--scroll-thumb); border-radius: 4px; }
`;

/* ─── Code Block Renderer ─────────────────────────────────────────── */
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
      <div style={{ position: 'relative', margin: '12px 0', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(51,65,85,0.7)' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '6px 14px', backgroundColor: 'rgba(15,23,42,0.9)',
          borderBottom: '1px solid rgba(51,65,85,0.5)', fontSize: '0.75rem', color: 'var(--text-dim)'
        }}>
          <span style={{ textTransform: 'lowercase', fontFamily: 'monospace', fontWeight: 600 }}>{match[1]}</span>
          <button className="ai-copy-btn" onClick={copyToClipboard} style={{
            background: 'none', border: 'none', color: 'var(--text-dim)',
            cursor: 'pointer', fontSize: '0.75rem', padding: '3px 8px', transition: 'all 0.2s', fontFamily: 'inherit'
          }}>
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={match[1]}
          PreTag="div"
          customStyle={{ margin: 0, padding: '14px', fontSize: '0.85rem', lineHeight: '1.5', background: '#0b1120' }}
          {...props}
        >
          {codeString}
        </SyntaxHighlighter>
      </div>
    );
  }

  return (
    <code style={{
      backgroundColor: 'rgba(6,182,212,0.1)', color: '#06b6d4',
      padding: '2px 6px', borderRadius: '4px', fontSize: '0.85em', fontFamily: 'monospace'
    }} {...props}>
      {children}
    </code>
  );
};

/* ─── User & AI Avatars ───────────────────────────────────────────── */
const UserAvatar = () => (
  <div style={{
    width: '32px', height: '32px', borderRadius: '10px',
    background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', boxShadow: '0 2px 8px rgba(139,92,246,0.3)', flexShrink: 0
  }}>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  </div>
);

const AIAvatar = () => (
  <div style={{
    width: '32px', height: '32px', borderRadius: '10px',
    background: 'linear-gradient(135deg, rgba(6,182,212,0.2) 0%, rgba(139,92,246,0.2) 100%)',
    border: '1px solid rgba(6,182,212,0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 2px 10px rgba(6,182,212,0.2)', flexShrink: 0
  }}>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="aiAv" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" /><stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <polygon points="12 2 21 7 21 17 12 22 3 17 3 7" stroke="url(#aiAv)" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.5" fill="url(#aiAv)" />
    </svg>
  </div>
);

/* ─── Main Component ──────────────────────────────────────────────── */
function AiAssistant({ code }) {
  const { token } = useAuth();
  const [question, setQuestion] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Default to collapsed (compact Copilot AI Search Bar) on initial page load
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [smartMode, setSmartMode] = useState('Smart ⚡');

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  const [chatHeight, setChatHeight] = useState(380);
  const [resizeDirection, setResizeDirection] = useState(null);

  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (isExpanded) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history, isExpanded, loading]);

  const startResizing = (dir) => (e) => {
    e.preventDefault();
    setResizeDirection(dir);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!resizeDirection) return;
      setChatHeight((prev) => {
        const next = resizeDirection === 'top' ? prev - e.movementY : prev + e.movementY;
        return Math.max(200, Math.min(next, 650));
      });
    };
    const stop = () => setResizeDirection(null);
    if (resizeDirection) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', stop);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stop);
    };
  }, [resizeDirection]);

  const askAI = async (overridePrompt) => {
    const qText = overridePrompt || question;
    if (!qText.trim() || loading) return;

    setIsExpanded(true);
    setIsMenuOpen(false);

    const newHistory = [...history, { role: 'user', text: qText }];
    setHistory(newHistory);
    setQuestion('');
    setLoading(true);

    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    try {
      const res = await fetch(`${BACKEND_URL}/ask-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code, question: qText, history: history.slice(-6) }),
      });
      const data = await res.json();
      setHistory([...newHistory, { role: 'ai', text: data.answer || 'No response from AI.' }]);
    } catch (err) {
      console.error('AI request failed:', err);
      setHistory([...newHistory, { role: 'ai', text: 'CodeMind AI Service is currently experiencing high load. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      askAI();
    }
  };

  const handleTextareaChange = (e) => {
    setQuestion(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px';
  };

  const canSend = question.trim().length > 0 && !loading;

  const quickPrompts = [
    { label: 'Explain this code', icon: '💡' },
    { label: 'Find security & runtime bugs', icon: '🔍' },
    { label: 'How to optimize time complexity?', icon: '⚡' },
    { label: 'Add detailed comments & docs', icon: '📝' },
    { label: 'Convert to another language', icon: '🔄' },
  ];

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <style>{styles}</style>

      {/* Quick Action Popover Menu (when clicking + button) */}
      {isMenuOpen && (
        <div
          ref={menuRef}
          className="ai-message-in"
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '20px',
            marginBottom: '12px',
            backgroundColor: 'rgba(15, 23, 42, 0.96)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(6, 182, 212, 0.25)',
            borderRadius: '16px',
            padding: '10px',
            boxShadow: '0 12px 30px rgba(0,0,0,0.5), 0 0 20px rgba(6,182,212,0.15)',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            minWidth: '260px'
          }}
        >
          <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-dim)', padding: '6px 10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Quick AI Actions
          </div>
          {quickPrompts.map((item) => (
            <button
              key={item.label}
              onClick={() => askAI(item.label)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 12px',
                borderRadius: '10px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.2s',
                fontFamily: 'inherit'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(6, 182, 212, 0.12)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Outer Shell Container */}
      <div
        className="copilot-shell"
        style={{
          display: 'flex',
          flexDirection: 'column',
          border: isExpanded ? '1px solid rgba(51,65,85,0.8)' : '1px solid rgba(148,163,184,0.18)',
          borderRadius: '24px',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(16px)',
          overflow: 'hidden',
          boxShadow: isExpanded
            ? '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(6,182,212,0.1), inset 0 1px 0 rgba(255,255,255,0.04)'
            : '0 8px 30px rgba(0,0,0,0.35), 0 0 15px rgba(6,182,212,0.08)',
          transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Resize Handle (when expanded) */}
        {isExpanded && (
          <div
            className="ai-resize-handle"
            onMouseDown={startResizing('top')}
            style={{
              height: '14px', width: '100%', cursor: 'ns-resize',
              backgroundColor: 'rgba(30,41,59,0.7)',
              borderBottom: '1px solid rgba(51,65,85,0.5)',
              display: 'flex', justifyContent: 'center', alignItems: 'center',
            }}
          >
            <div style={{ width: '40px', height: '3px', backgroundColor: 'rgba(71,85,105,0.6)', borderRadius: '2px', transition: 'all 0.25s ease' }} />
          </div>
        )}

        {/* Top Header (only when expanded or has history) */}
        {isExpanded && (
          <div
            className="ai-header"
            onClick={() => setIsExpanded(false)}
            style={{
              padding: '12px 20px',
              background: 'linear-gradient(to right, rgba(30,41,59,0.95), rgba(15,23,42,0.95))',
              borderBottom: '1px solid rgba(51,65,85,0.5)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              cursor: 'pointer', userSelect: 'none'
            }}
          >
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <AIAvatar />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-hero)', letterSpacing: '0.3px' }}>
                  CodeMind AI Assistant
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '1px' }}>
                  {loading ? (
                    <span style={{ color: '#06b6d4', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#06b6d4', boxShadow: '0 0 5px #06b6d4' }} />
                      Thinking...
                    </span>
                  ) : history.length > 0 ? (
                    `${Math.ceil(history.length / 2)} message${Math.ceil(history.length / 2) !== 1 ? 's' : ''}`
                  ) : (
                    'Ask anything about your code'
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {history.length > 0 && (
                <button
                  className="ai-new-chat-btn"
                  onClick={(e) => { e.stopPropagation(); setHistory([]); setQuestion(''); }}
                  style={{
                    backgroundColor: 'transparent', border: '1px solid rgba(51,65,85,0.8)',
                    color: 'var(--text-dim)', padding: '4px 12px', borderRadius: '20px',
                    fontSize: '0.76rem', cursor: 'pointer', transition: 'all 0.2s ease',
                    display: 'flex', alignItems: 'center', gap: '5px', fontFamily: 'inherit'
                  }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  New Chat
                </button>
              )}
              <div
                style={{
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Collapse to search bar"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="18 15 12 9 6 15" />
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* Chat History Panel (Expanded) */}
        {isExpanded && (
          <div
            className="ai-scroll"
            style={{
              height: `${chatHeight}px`,
              overflowY: 'auto',
              padding: '18px 20px',
              background: 'linear-gradient(to bottom, var(--bg-main), rgba(11,17,32,0.97))',
              display: 'flex', flexDirection: 'column', gap: '6px'
            }}
          >
            {/* Empty state */}
            {history.length === 0 && !loading && (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', height: '100%', gap: '16px',
                opacity: 0.75, padding: '20px'
              }}>
                <AIAvatar />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '6px' }}>
                    Start a conversation with CodeMind AI
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
                    Ask about complexity, bugs, refactoring, or anything about your code.
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginTop: '4px' }}>
                  {quickPrompts.slice(0, 4).map((chip) => (
                    <button
                      key={chip.label}
                      onClick={() => askAI(chip.label)}
                      style={{
                        background: 'rgba(6,182,212,0.07)', border: '1px solid rgba(6,182,212,0.18)',
                        color: '#06b6d4', borderRadius: '20px', padding: '5px 13px',
                        fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(6,182,212,0.15)'; e.currentTarget.style.borderColor = '#06b6d4'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(6,182,212,0.07)'; e.currentTarget.style.borderColor = 'rgba(6,182,212,0.18)'; }}
                    >
                      {chip.icon} {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message History */}
            {history.map((msg, i) => (
              <div
                key={i}
                className="ai-message-in"
                style={{
                  display: 'flex',
                  flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                  alignItems: 'flex-start',
                  gap: '10px',
                  marginBottom: '4px',
                }}
              >
                {msg.role === 'user' ? <UserAvatar /> : <AIAvatar />}
                <div style={{ maxWidth: '82%' }}>
                  <div
                    className={msg.role === 'user' ? 'ai-chat-bubble-user' : 'ai-chat-bubble-ai'}
                    style={{
                      backgroundColor: msg.role === 'user' ? 'rgba(139,92,246,0.14)' : 'rgba(30,41,59,0.9)',
                      border: msg.role === 'user' ? '1px solid rgba(139,92,246,0.28)' : '1px solid rgba(51,65,85,0.7)',
                      padding: '13px 18px',
                      borderRadius: '16px',
                      borderTopRightRadius: msg.role === 'user' ? '4px' : '16px',
                      borderTopLeftRadius: msg.role === 'ai' ? '4px' : '16px',
                      color: 'var(--text-main)',
                      fontSize: '0.9rem', lineHeight: '1.6',
                      boxShadow: msg.role === 'user' ? '0 2px 12px rgba(139,92,246,0.1)' : '0 2px 12px rgba(0,0,0,0.2)',
                    }}
                  >
                    {msg.role === 'user' ? (
                      <span style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</span>
                    ) : (
                      <div className="markdown-body">
                        <ReactMarkdown
                          components={{
                            code: CodeBlock,
                            h3({ children }) { return <h3 style={{ margin: '14px 0 8px 0', color: '#06b6d4', fontSize: '1rem', fontWeight: 700 }}>{children}</h3>; },
                            p({ children }) { return <p style={{ margin: '0 0 8px 0', lineHeight: '1.65' }}>{children}</p>; },
                            ul({ children }) { return <ul style={{ margin: '8px 0', paddingLeft: '20px', lineHeight: '1.65' }}>{children}</ul>; },
                            ol({ children }) { return <ol style={{ margin: '8px 0', paddingLeft: '20px', lineHeight: '1.65' }}>{children}</ol>; },
                            li({ children }) { return <li style={{ marginBottom: '4px' }}>{children}</li>; },
                            strong({ children }) { return <strong style={{ color: 'var(--text-hero)', fontWeight: 600 }}>{children}</strong>; },
                          }}
                        >{msg.text}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {loading && (
              <div className="ai-message-in" style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '4px' }}>
                <AIAvatar />
                <div style={{ maxWidth: '80%' }}>
                  <div style={{
                    backgroundColor: 'rgba(30,41,59,0.9)',
                    border: '1px solid rgba(51,65,85,0.7)',
                    padding: '16px 20px',
                    borderRadius: '16px', borderTopLeftRadius: '4px',
                    display: 'flex', flexDirection: 'column', gap: '14px',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.2)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginLeft: '6px' }}>Analyzing your code...</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div className="skeleton-bone" style={{ width: '90%', height: '10px' }} />
                      <div className="skeleton-bone" style={{ width: '75%', height: '10px' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>
        )}

        {/* ─── Compact Copilot AI Search Bar / Input Area (Matching Image #2) ─── */}
        <div style={{
          padding: '14px 18px',
          background: isExpanded ? 'rgba(15,23,42,0.98)' : 'transparent',
          borderTop: isExpanded ? '1px solid rgba(51,65,85,0.5)' : 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          {/* Main Text Input */}
          <textarea
            ref={textareaRef}
            className="ai-textarea"
            value={question}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            onClick={() => {
              if (history.length > 0 && !isExpanded) setIsExpanded(true);
            }}
            placeholder="Message CodeMind AI or ask a question about your code..."
            disabled={loading}
            rows={1}
            style={{
              width: '100%',
              backgroundColor: 'transparent',
              color: 'var(--text-main)',
              border: 'none',
              outline: 'none',
              fontSize: '0.95rem',
              resize: 'none',
              lineHeight: '1.5',
              minHeight: '26px',
              maxHeight: '140px',
              overflowY: 'auto',
              fontFamily: 'inherit',
              padding: '0',
              opacity: loading ? 0.6 : 1,
            }}
          />

          {/* Bottom Controls Bar (Pills + Action Icons) */}
          <div style={{
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center',
            paddingTop: '4px'
          }}>
            {/* Left Controls: (+) Pill & (Smart ∨) Pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* (+) Plus Button Pill */}
              <button
                className="copilot-pill-btn"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                title="Add context or prompt"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.7)',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  fontFamily: 'inherit',
                  flexShrink: 0
                }}
              >
                +
              </button>

              {/* (Smart ∨) Model Dropdown Pill */}
              <button
                className="copilot-pill-btn"
                onClick={() => setSmartMode(smartMode.includes('Smart') ? 'Fast 🚀' : 'Smart ⚡')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: '16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '0.8rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  fontFamily: 'inherit'
                }}
              >
                <span>{smartMode}</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </div>

            {/* Right Controls: Waveform Audio/AI indicator & Send / Expand */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* History Counter Badge (if history exists & collapsed) */}
              {!isExpanded && history.length > 0 && (
                <button
                  onClick={() => setIsExpanded(true)}
                  style={{
                    background: 'rgba(6,182,212,0.1)',
                    border: '1px solid rgba(6,182,212,0.25)',
                    color: '#06b6d4',
                    borderRadius: '12px',
                    padding: '3px 10px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontFamily: 'inherit'
                  }}
                >
                  <span>{Math.ceil(history.length / 2)} chat{Math.ceil(history.length / 2) !== 1 ? 's' : ''}</span>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="18 15 12 9 6 15" />
                  </svg>
                </button>
              )}

              {/* Audio Waveform Indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '16px', padding: '0 4px', opacity: 0.7 }}>
                <div className="wave-bar" />
                <div className="wave-bar" />
                <div className="wave-bar" />
                <div className="wave-bar" />
              </div>

              {/* Send Button */}
              <button
                className="copilot-send-btn"
                onClick={() => askAI()}
                disabled={!canSend}
                style={{
                  width: '34px',
                  height: '34px',
                  padding: '0',
                  backgroundColor: canSend ? '#06b6d4' : 'rgba(255, 255, 255, 0.05)',
                  color: canSend ? '#000' : 'rgba(255, 255, 255, 0.3)',
                  border: canSend ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  cursor: canSend ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'center',
                  boxShadow: canSend ? '0 2px 10px rgba(6,182,212,0.3)' : 'none',
                  flexShrink: 0
                }}
              >
                {loading ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style={{ animation: 'spin 1.2s linear infinite' }}>
                    <path d="M12 2L14.4 8.6L21 11L14.4 13.4L12 20L9.6 13.4L3 11L9.6 8.6L12 2Z" />
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '1px' }}>
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AiAssistant;
