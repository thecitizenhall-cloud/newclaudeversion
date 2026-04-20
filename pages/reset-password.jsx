import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const T = {
  bg:"#0F0E0C", surface:"#1A1916", border:"#2C2A26",
  cream:"#F2EDE4", creamDim:"#9A9188", creamFaint:"#4A4640",
  amber:"#D4922A", amberLo:"#2A1E08", amberMid:"#8C5E14", amberHi:"#F0B84A",
  teal:"#1D9E75", tealLo:"#0A2A1E", tealHi:"#4CAF80",
  red:"#C0392B", redLo:"#2A0E0A", redHi:"#E57373",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  body { background:${T.bg}; color:${T.cream}; font-family:'DM Sans',sans-serif; min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin   { to{transform:rotate(360deg)} }
`;

export default function ResetPassword() {
  const [password,   setPassword]   = useState("");
  const [confirm,    setConfirm]    = useState("");
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [done,       setDone]       = useState(false);
  const [validSession, setValidSession] = useState(false);

  useEffect(() => {
    // Supabase puts the access token in the URL hash on redirect
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setValidSession(true);
    });

    // Listen for the PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setValidSession(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit() {
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setError("Passwords don't match."); return; }
    setLoading(true); setError("");

    const { error } = await supabase.auth.updateUser({ password });
    if (error) { setError(error.message); }
    else { setDone(true); setTimeout(() => { window.location.href = "/"; }, 2500); }
    setLoading(false);
  }

  return (
    <>
      <style>{css}</style>
      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:16, width:"100%", maxWidth:420, overflow:"hidden", animation:"fadeUp 0.5s ease" }}>

        {/* Header */}
        <div style={{ padding:"28px 32px 22px", borderBottom:`1px solid ${T.border}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:20 }}>
            <div style={{ width:26, height:26, border:`1.5px solid ${T.amber}`, borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="7" width="5" height="6" rx="1" fill={T.amber}/>
                <rect x="8" y="4" width="5" height="9" rx="1" fill={T.amber} opacity="0.6"/>
                <rect x="1" y="1" width="5" height="4" rx="1" fill={T.amber} opacity="0.4"/>
              </svg>
            </div>
            <span style={{ fontFamily:"'DM Serif Display',serif", fontSize:16, color:T.cream }}>Townhall Café</span>
          </div>
          <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:24, color:T.cream, marginBottom:6 }}>
            Set a new <em style={{ fontStyle:"italic", color:T.amberHi }}>password</em>
          </div>
          <div style={{ fontSize:13, color:T.creamDim }}>Choose something memorable — at least 6 characters.</div>
        </div>

        <div style={{ padding:"24px 32px 28px" }}>
          {!validSession ? (
            <div style={{ textAlign:"center", color:T.creamDim, fontSize:13, lineHeight:1.7 }}>
              <div style={{ fontSize:20, marginBottom:12 }}>⏳</div>
              Waiting for reset link verification…<br/>
              <span style={{ fontSize:11, color:T.creamFaint }}>Make sure you opened this link from your email.</span>
            </div>
          ) : done ? (
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:24, marginBottom:12 }}>✓</div>
              <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:17, color:T.cream, marginBottom:6 }}>Password updated</div>
              <div style={{ fontSize:13, color:T.creamDim }}>Redirecting you to the app…</div>
            </div>
          ) : (
            <>
              <div style={{ marginBottom:16 }}>
                <label style={{ display:"block", fontSize:11, fontWeight:500, color:T.creamDim, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6 }}>
                  New password
                </label>
                <input type="password" placeholder="••••••••" value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ width:"100%", background:T.bg, border:`1px solid ${T.border}`, borderRadius:8, padding:"11px 14px", fontFamily:"'DM Sans',sans-serif", fontSize:14, color:T.cream, outline:"none" }}/>
              </div>
              <div style={{ marginBottom:16 }}>
                <label style={{ display:"block", fontSize:11, fontWeight:500, color:T.creamDim, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6 }}>
                  Confirm password
                </label>
                <input type="password" placeholder="••••••••" value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleSubmit(); }}
                  style={{ width:"100%", background:T.bg, border:`1px solid ${T.border}`, borderRadius:8, padding:"11px 14px", fontFamily:"'DM Sans',sans-serif", fontSize:14, color:T.cream, outline:"none" }}/>
              </div>

              {error && (
                <div style={{ background:T.redLo, border:`1px solid ${T.red}44`, borderRadius:6, padding:"9px 12px", fontSize:12, color:T.redHi, marginBottom:14 }}>
                  {error}
                </div>
              )}

              <button onClick={handleSubmit} disabled={!password || !confirm || loading}
                style={{ width:"100%", background:T.amber, color:T.bg, border:"none", borderRadius:8, padding:"13px", fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:500, cursor:"pointer", opacity:(!password||!confirm||loading)?0.4:1, transition:"opacity 0.2s" }}>
                {loading
                  ? <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                      <span style={{ width:14, height:14, border:"2px solid rgba(0,0,0,0.2)", borderTopColor:T.bg, borderRadius:"50%", animation:"spin 0.8s linear infinite", display:"inline-block" }}/>
                      Updating…
                    </span>
                  : "Update password →"}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
