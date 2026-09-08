import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

/* ── Animated code preview (left panel) ──────────────────────────── */
const CODE_LINES = [
  { i:0, tokens:[{t:"kw",v:"function "},{t:"fn",v:"mergeSort"},{t:"pl",v:"(arr) {"}] },
  { i:1, tokens:[{t:"kw",v:"if "},{t:"pl",v:"(arr.length <= "},{t:"nu",v:"1"},{t:"pl",v:") "},{t:"kw",v:"return"},{t:"pl",v:" arr;"}] },
  { i:1, tokens:[{t:"kw",v:"const "},{t:"pl",v:"mid = Math.floor(arr.length / "},{t:"nu",v:"2"},{t:"pl",v:");"}] },
  { i:1, tokens:[{t:"kw",v:"const "},{t:"pl",v:"left = mergeSort(arr.slice("},{t:"nu",v:"0"},{t:"pl",v:", mid));"}] },
  { i:1, tokens:[{t:"kw",v:"const "},{t:"pl",v:"right = mergeSort(arr.slice(mid));"}] },
  { i:1, tokens:[{t:"kw",v:"return "},{t:"fn",v:"merge"},{t:"pl",v:"(left, right);"}] },
  { i:0, tokens:[{t:"pl",v:"}"}] },
];
const TC = {kw:"#c792ea",fn:"#82aaff",nu:"#f78c6c",pl:"#a6accd"};

function CodePreview() {
  const [vis, setVis] = useState(0);
  const [res, setRes] = useState(false);
  const [bub, setBub] = useState(false);
  useEffect(() => {
    let n = 0;
    const t = setInterval(() => {
      n++; setVis(n);
      if (n >= CODE_LINES.length) { clearInterval(t); setTimeout(()=>setRes(true),400); setTimeout(()=>setBub(true),900); }
    }, 180);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{position:"relative",width:"100%",maxWidth:"420px"}}>
      <div style={{background:"rgba(13,20,40,0.95)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"14px",overflow:"hidden",boxShadow:"0 32px 80px rgba(0,0,0,0.7)"}}>
        <div style={{display:"flex",alignItems:"center",gap:"6px",padding:"10px 16px",background:"rgba(255,255,255,0.04)",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
          {["#ef4444","#f59e0b","#10b981"].map(c=><div key={c} style={{width:"9px",height:"9px",borderRadius:"50%",background:c}}/>)}
          <span style={{marginLeft:"10px",fontSize:"0.7rem",color:"rgba(255,255,255,0.3)",fontFamily:"monospace"}}>mergeSort.js</span>
        </div>
        <div style={{padding:"16px 20px",fontFamily:"monospace",fontSize:"0.77rem",lineHeight:"1.85",minHeight:"148px"}}>
          {CODE_LINES.slice(0,vis).map((line,li)=>(
            <div key={li} style={{display:"flex"}}>
              <span style={{color:"rgba(255,255,255,0.18)",marginRight:"16px",fontSize:"0.65rem",userSelect:"none"}}>{String(li+1).padStart(2," ")}</span>
              <span style={{paddingLeft:`${line.i*16}px`}}>{line.tokens.map((tok,ti)=><span key={ti} style={{color:TC[tok.t]}}>{tok.v}</span>)}</span>
            </div>
          ))}
          {vis < CODE_LINES.length && <div style={{display:"inline-block",width:"2px",height:"14px",background:"#06b6d4",marginLeft:`${(CODE_LINES[vis]?.i||0)*16+34}px`,animation:"blink .7s step-end infinite"}}/>}
        </div>
      </div>
      {res && (
        <div style={{display:"flex",gap:"10px",marginTop:"10px",animation:"fadeUp .4s ease"}}>
          {[{label:"Time Complexity",val:"O(n log n)",color:"#06b6d4",bg:"rgba(6,182,212,0.1)",bd:"rgba(6,182,212,0.25)"},{label:"Space Complexity",val:"O(n)",color:"#a78bfa",bg:"rgba(167,139,250,0.1)",bd:"rgba(167,139,250,0.25)"}].map(c=>(
            <div key={c.label} style={{flex:1,padding:"10px 14px",borderRadius:"10px",background:c.bg,border:`1px solid ${c.bd}`,backdropFilter:"blur(6px)"}}>
              <div style={{fontSize:"0.62rem",color:"rgba(255,255,255,0.45)",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:"4px"}}>{c.label}</div>
              <div style={{fontSize:"1rem",fontWeight:"800",color:c.color,fontFamily:"monospace"}}>{c.val}</div>
            </div>
          ))}
        </div>
      )}
      {bub && (
        <div style={{position:"absolute",right:"-20px",top:"32px",background:"rgba(22,32,52,0.97)",border:"1px solid rgba(6,182,212,0.35)",borderRadius:"12px",padding:"10px 14px",maxWidth:"180px",boxShadow:"0 12px 40px rgba(6,182,212,0.2)",animation:"fadeUp .5s ease"}}>
          <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"5px"}}>
            <div style={{width:"16px",height:"16px",borderRadius:"50%",background:"linear-gradient(135deg,#06b6d4,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none"><polygon points="12 2 21 7 21 17 12 22 3 17 3 7" stroke="#fff" strokeWidth="2.5" strokeLinejoin="round"/></svg>
            </div>
            <span style={{fontSize:"0.62rem",fontWeight:"700",color:"#06b6d4"}}>CodeMind AI</span>
          </div>
          <p style={{margin:0,fontSize:"0.7rem",color:"rgba(255,255,255,0.7)",lineHeight:1.5}}>Optimal divide-and-conquer strategy detected.</p>
        </div>
      )}
    </div>
  );
}

export default function LoginPage({ onSwitchToRegister }) {
  const { login } = useAuth();
  const [form, setForm] = useState({ email:"", password:"" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [focused, setFocused] = useState(null);

  const handleChange = (e) => { setError(""); setForm(p=>({...p,[e.target.name]:e.target.value})); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/auth/login`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
      const data = await res.json();
      if (!res.ok) { setError(data.error||"Login failed."); return; }
      login(data.user, data.token);
    } catch { setError("Cannot connect to server."); }
    finally { setLoading(false); }
  };

  const inputStyle = (name) => ({
    width:"100%", padding:"13px 16px",
    background: "#fff",
    border:`1.5px solid ${focused===name ? "#06b6d4" : "#e5e7eb"}`,
    borderRadius:"10px", color:"#111827", fontSize:"0.9rem",
    fontFamily:"inherit", boxSizing:"border-box", outline:"none",
    boxShadow: focused===name ? "0 0 0 3px rgba(6,182,212,0.12)" : "none",
    transition:"all 0.18s ease",
  });

  return (
    <div style={{
      minHeight:"100vh", width:"100%", display:"flex", alignItems:"center", justifyContent:"center",
      background:"linear-gradient(135deg,#0a0d1a 0%,#0f1628 40%,#060a14 100%)",
      fontFamily:"'Inter',-apple-system,sans-serif", padding:"24px", boxSizing:"border-box",
    }}>
      <style>{`
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes floatUp{0%,100%{transform:translateY(0)}50%{transform:translateY(-16px)}}
        @keyframes gradMove{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        @keyframes spinRing{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:scale(0.97)}to{opacity:1;transform:scale(1)}}
        .lp-card{animation:fadeIn .5s cubic-bezier(0.16,1,0.3,1) forwards}
        .lp-btn{transition:all .2s ease;cursor:pointer}
        .lp-btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 10px 30px rgba(6,182,212,0.45)!important}
        .lp-btn:active:not(:disabled){transform:translateY(0)}
        .mesh{background-image:linear-gradient(rgba(6,182,212,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(6,182,212,0.05) 1px,transparent 1px);background-size:36px 36px}
        ::placeholder{color:#9ca3af!important}
      `}</style>

      {/* ── Floating card ──────────────────────────────────────────────── */}
      <div className="lp-card" style={{
        display:"flex", width:"100%", maxWidth:"1080px", minHeight:"620px",
        borderRadius:"24px", overflow:"hidden",
        boxShadow:"0 40px 120px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.06)",
      }}>

        {/* ═══ LEFT — dark hero ══════════════════════════════════════════ */}
        <div className="mesh" style={{
          flex:1, display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center",
          padding:"52px 48px", background:"#0c1120",
          position:"relative", overflow:"hidden",
        }}>
          {/* Glow blobs */}
          <div style={{position:"absolute",width:"500px",height:"500px",borderRadius:"50%",background:"radial-gradient(circle,rgba(6,182,212,0.09) 0%,transparent 65%)",top:"-160px",left:"-100px",animation:"floatUp 12s ease-in-out infinite",pointerEvents:"none"}}/>
          <div style={{position:"absolute",width:"400px",height:"400px",borderRadius:"50%",background:"radial-gradient(circle,rgba(139,92,246,0.07) 0%,transparent 65%)",bottom:"-120px",right:"-60px",animation:"floatUp 15s ease-in-out infinite 5s",pointerEvents:"none"}}/>

          {/* Top label */}
          <div style={{position:"absolute",top:"28px",left:"48px",fontSize:"0.75rem",color:"rgba(255,255,255,0.35)",letterSpacing:"0.3px"}}>
            AI-powered code complexity analysis &amp; smart insights
          </div>

          {/* Headline */}
          <div style={{width:"100%",maxWidth:"420px",marginBottom:"36px",alignSelf:"flex-start"}}>
            <div style={{display:"inline-flex",alignItems:"center",gap:"7px",background:"rgba(6,182,212,0.1)",border:"1px solid rgba(6,182,212,0.2)",borderRadius:"100px",padding:"4px 12px",marginBottom:"18px"}}>
              <div style={{width:"6px",height:"6px",borderRadius:"50%",background:"#06b6d4",boxShadow:"0 0 8px #06b6d4"}}/>
              <span style={{fontSize:"0.7rem",fontWeight:"600",color:"#06b6d4",letterSpacing:"0.3px"}}>CodeMind Neural AI Engine</span>
            </div>
            <h1 style={{
              margin:0, fontSize:"2.75rem", fontWeight:"900", lineHeight:1.1, letterSpacing:"-1.5px", color:"#fff",
            }}>
              Understand your<br/>
              <span style={{background:"linear-gradient(90deg,#06b6d4,#8b5cf6,#06b6d4)",backgroundSize:"200%",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",animation:"gradMove 4s ease infinite"}}>code instantly.</span>
            </h1>
            <p style={{margin:"14px 0 0",fontSize:"0.9rem",color:"rgba(255,255,255,0.45)",lineHeight:1.7}}>
              Paste any snippet — get time &amp; space complexity, bug detection, and AI explanations in real time.
            </p>
          </div>

          {/* Product preview */}
          <div style={{width:"100%",maxWidth:"420px",alignSelf:"flex-start"}}>
            <CodePreview/>
          </div>
        </div>

        {/* ═══ RIGHT — white form panel ══════════════════════════════════ */}
        <div style={{
          width:"420px", flexShrink:0, display:"flex", flexDirection:"column",
          background:"#ffffff", position:"relative",
        }}>
          {/* Top nav row */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"28px 40px 0"}}>
            {/* Logo */}
            <div style={{display:"flex",alignItems:"center",gap:"9px"}}>
              <div style={{position:"relative",flexShrink:0}}>
                <img src="/codemind-logo.png" alt="CodeMind AI" style={{width:"32px",height:"32px",borderRadius:"8px",objectFit:"contain",display:"block"}}/>
                <div style={{position:"absolute",inset:"-2px",borderRadius:"10px",background:"conic-gradient(from 0deg,#06b6d4,#8b5cf6,#06b6d4)",zIndex:-1,animation:"spinRing 4s linear infinite",opacity:0.7}}/>
              </div>
              <span style={{fontSize:"0.95rem",fontWeight:"800",color:"#111827",letterSpacing:"-0.2px"}}>
                Code<span style={{color:"#06b6d4"}}>Mind</span><span style={{fontSize:"0.6em",color:"#0891b2",marginLeft:"3px",letterSpacing:"2px"}}>AI</span>
              </span>
            </div>
            {/* Sign up link */}
            <button onClick={onSwitchToRegister} id="switch-to-register-btn"
              style={{background:"none",border:"none",cursor:"pointer",fontSize:"0.85rem",fontWeight:"600",color:"#6b7280",fontFamily:"inherit",display:"flex",alignItems:"center",gap:"4px",padding:0,transition:"color .2s"}}
              onMouseEnter={e=>e.currentTarget.style.color="#06b6d4"} onMouseLeave={e=>e.currentTarget.style.color="#6b7280"}>
              Sign Up
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
          </div>

          {/* Form area — vertically centered */}
          <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",padding:"0 40px 28px"}}>
            <h2 style={{margin:"0 0 32px",fontSize:"2rem",fontWeight:"800",color:"#111827",letterSpacing:"-0.6px"}}>Sign In</h2>

            <form onSubmit={handleSubmit} style={{display:"flex",flexDirection:"column",gap:"14px"}}>
              {/* Email */}
              <div style={{position:"relative"}}>
                <input id="login-email" type="email" name="email" placeholder="Email or Username"
                  value={form.email} onChange={handleChange} required autoComplete="email"
                  onFocus={()=>setFocused("email")} onBlur={()=>setFocused(null)}
                  style={inputStyle("email")}/>
              </div>

              {/* Password */}
              <div style={{position:"relative"}}>
                <input id="login-password" type={showPass?"text":"password"} name="password" placeholder="Password"
                  value={form.password} onChange={handleChange} required autoComplete="current-password"
                  onFocus={()=>setFocused("password")} onBlur={()=>setFocused(null)}
                  style={{...inputStyle("password"),paddingRight:"44px"}}/>
                <button type="button" onClick={()=>setShowPass(v=>!v)} tabIndex={-1}
                  style={{position:"absolute",right:"14px",top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#9ca3af",display:"flex",padding:"4px",transition:"color .2s"}}
                  onMouseEnter={e=>e.currentTarget.style.color="#06b6d4"} onMouseLeave={e=>e.currentTarget.style.color="#9ca3af"}>
                  {showPass
                    ?<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    :<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>

              {/* Error */}
              {error && (
                <div role="alert" style={{display:"flex",alignItems:"center",gap:"8px",padding:"10px 14px",background:"#fef2f2",border:"1px solid #fecaca",borderRadius:"8px",color:"#dc2626",fontSize:"0.84rem"}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{flexShrink:0}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button type="submit" id="login-submit-btn" className="lp-btn" disabled={loading}
                style={{
                  width:"100%", padding:"14px", marginTop:"4px",
                  background: loading ? "#e5e7eb" : "linear-gradient(135deg,#06b6d4 0%,#0891b2 60%,#7c3aed 100%)",
                  color: loading ? "#9ca3af" : "#fff",
                  border:"none", borderRadius:"10px", fontSize:"0.95rem", fontWeight:"700",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:"8px",
                  boxShadow: loading ? "none" : "0 4px 20px rgba(6,182,212,0.35)",
                  fontFamily:"inherit", letterSpacing:"0.2px",
                }}>
                {loading
                  ?<><span style={{width:"16px",height:"16px",border:"2px solid #d1d5db",borderTopColor:"#6b7280",borderRadius:"50%",animation:"spin .7s linear infinite",flexShrink:0}}/>Signing in...</>
                  :<>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 8 16 12 12 16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                    Sign In
                  </>
                }
              </button>
            </form>
          </div>

          {/* Footer */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"20px 40px",borderTop:"1px solid #f3f4f6"}}>
            <span style={{fontSize:"0.72rem",color:"#9ca3af"}}>© 2025 CodeMind AI</span>
            <div style={{display:"flex",gap:"16px"}}>
              <a href="#!" style={{fontSize:"0.72rem",color:"#6b7280",textDecoration:"none",transition:"color .2s"}} onMouseEnter={e=>e.target.style.color="#06b6d4"} onMouseLeave={e=>e.target.style.color="#6b7280"}>Privacy</a>
              <a href="#!" style={{fontSize:"0.72rem",color:"#6b7280",textDecoration:"none",transition:"color .2s"}} onMouseEnter={e=>e.target.style.color="#06b6d4"} onMouseLeave={e=>e.target.style.color="#6b7280"}>Terms</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}