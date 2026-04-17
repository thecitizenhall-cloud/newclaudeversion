"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const T = {
  bg:       "#0F0E0C",
  surface:  "#1A1916",
  border:   "#2C2A26",
  borderHi: "#4A4640",
  cream:    "#F2EDE4",
  creamDim: "#9A9188",
  amber:    "#D4922A",
  amberLo:  "#3A2A0F",
  amberHi:  "#F0B84A",
  green:    "#2D6A4F",
  greenHi:  "#4CAF80",
  red:      "#C0392B",
  redLo:    "#3A1010",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${T.bg}; color: ${T.cream}; font-family: 'DM Sans', sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
  @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.4} }
  @keyframes spin   { to { transform:rotate(360deg); } }
  @keyframes scanline { from{transform:translateY(0)} to{transform:translateY(100%)} }
  @keyframes geoRing  { 0%{transform:scale(1);opacity:0.8} 100%{transform:scale(2.8);opacity:0} }
  .th-card { background:${T.surface}; border:1px solid ${T.border}; border-radius:16px; width:100%; max-width:480px; overflow:hidden; animation:fadeUp 0.5s ease both; }
  .th-header { padding:32px 36px 24px; border-bottom:1px solid ${T.border}; position:relative; }
  .th-logo { display:flex; align-items:center; gap:10px; margin-bottom:28px; }
  .th-logo-mark { width:28px; height:28px; border:2px solid ${T.amber}; border-radius:6px; display:flex; align-items:center; justify-content:center; }
  .th-logo-mark svg { width:14px; height:14px; }
  .th-logo-name { font-family:'DM Serif Display',serif; font-size:17px; color:${T.cream}; letter-spacing:0.02em; }
  .th-step-title { font-family:'DM Serif Display',serif; font-size:26px; line-height:1.2; color:${T.cream}; margin-bottom:8px; }
  .th-step-title em { font-style:italic; color:${T.amberHi}; }
  .th-step-sub { font-size:14px; color:${T.creamDim}; line-height:1.6; font-weight:300; }
  .th-progress { display:flex; gap:6px; position:absolute; top:32px; right:36px; }
  .th-progress-dot { width:6px; height:6px; border-radius:50%; background:${T.border}; transition:background 0.3s,transform 0.3s; }
  .th-progress-dot.active { background:${T.amber}; transform:scale(1.3); }
  .th-progress-dot.done   { background:${T.green}; }
  .th-body { padding:28px 36px 32px; }
  .th-field { margin-bottom:18px; animation:fadeUp 0.4s ease both; }
  .th-label { font-size:12px; font-weight:500; color:${T.creamDim}; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:8px; display:block; }
  .th-input { width:100%; background:${T.bg}; border:1px solid ${T.border}; border-radius:8px; padding:12px 14px; font-family:'DM Sans',sans-serif; font-size:15px; color:${T.cream}; outline:none; transition:border-color 0.2s,box-shadow 0.2s; }
  .th-input:focus { border-color:${T.amber}; box-shadow:0 0 0 3px ${T.amberLo}; }
  .th-input::placeholder { color:${T.borderHi}; }
  .th-input-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .th-btn { width:100%; padding:14px; border-radius:8px; border:none; font-family:'DM Sans',sans-serif; font-size:15px; font-weight:500; cursor:pointer; transition:all 0.2s; margin-top:8px; }
  .th-btn-primary { background:${T.amber}; color:#0F0E0C; }
  .th-btn-primary:hover { background:${T.amberHi}; transform:translateY(-1px); }
  .th-btn-primary:disabled { opacity:0.4; cursor:not-allowed; transform:none; }
  .th-btn-ghost { background:transparent; color:${T.creamDim}; border:1px solid ${T.border}; margin-top:10px; font-size:13px; }
  .th-btn-ghost:hover { border-color:${T.borderHi}; color:${T.cream}; }
  .th-terms { font-size:12px; color:${T.borderHi}; text-align:center; margin-top:16px; line-height:1.6; }
  .th-terms a { color:${T.creamDim}; text-decoration:underline; cursor:pointer; }
  .th-divider { display:flex; align-items:center; gap:12px; margin:16px 0; }
  .th-divider-line { flex:1; height:1px; background:${T.border}; }
  .th-divider-text { font-size:12px; color:${T.borderHi}; }
  .geo-map { background:${T.bg}; border:1px solid ${T.border}; border-radius:12px; height:160px; position:relative; overflow:hidden; margin-bottom:18px; display:flex; align-items:center; justify-content:center; }
  .geo-grid { position:absolute; inset:0; background-image:linear-gradient(${T.border} 1px,transparent 1px),linear-gradient(90deg,${T.border} 1px,transparent 1px); background-size:32px 32px; opacity:0.5; }
  .geo-ring { position:absolute; width:40px; height:40px; border-radius:50%; border:2px solid ${T.amber}; animation:geoRing 2s ease-out infinite; }
  .geo-ring:nth-child(2){animation-delay:0.6s} .geo-ring:nth-child(3){animation-delay:1.2s}
  .geo-dot { width:10px; height:10px; border-radius:50%; background:${T.amber}; position:relative; z-index:2; box-shadow:0 0 0 3px ${T.amberLo}; }
  .geo-label { position:absolute; bottom:10px; right:12px; font-size:11px; color:${T.creamDim}; font-weight:300; }
  .hood-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:18px; }
  .hood-item { background:${T.bg}; border:1px solid ${T.border}; border-radius:8px; padding:12px 14px; cursor:pointer; transition:all 0.2s; display:flex; align-items:center; justify-content:space-between; }
  .hood-item:hover{border-color:${T.borderHi}} .hood-item.selected{border-color:${T.amber};background:${T.amberLo}}
  .hood-name{font-size:14px;color:${T.cream};font-weight:400} .hood-dist{font-size:11px;color:${T.creamDim};font-weight:300}
  .hood-check{width:18px;height:18px;border-radius:50%;border:1.5px solid ${T.border};display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all 0.2s}
  .hood-item.selected .hood-check{background:${T.amber};border-color:${T.amber}}
  .zk-chamber{background:${T.bg};border:1px solid ${T.border};border-radius:12px;padding:24px;margin-bottom:18px;position:relative;overflow:hidden}
  .zk-scanline{position:absolute;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,${T.amber}44,transparent);animation:scanline 2.5s linear infinite;pointer-events:none}
  .zk-title{font-size:12px;font-weight:500;color:${T.creamDim};text-transform:uppercase;letter-spacing:0.1em;margin-bottom:16px}
  .zk-rows{display:flex;flex-direction:column;gap:10px}
  .zk-row{display:flex;align-items:center;gap:12px;font-size:13px}
  .zk-row-icon{width:28px;height:28px;border-radius:6px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:13px}
  .zk-row-icon.ok{background:#0D2B1F;color:${T.greenHi}} .zk-row-icon.no{background:${T.redLo};color:${T.red}} .zk-row-icon.enc{background:${T.amberLo};color:${T.amberHi}}
  .zk-row-text{color:${T.creamDim};flex:1} .zk-row-text strong{color:${T.cream};font-weight:500}
  .zk-proof-area{margin-top:16px;border-top:1px solid ${T.border};padding-top:16px}
  .zk-proof-label{font-size:11px;color:${T.borderHi};text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px}
  .zk-hash{font-family:'Courier New',monospace;font-size:11px;color:${T.amber};word-break:break-all;line-height:1.7;opacity:0;transition:opacity 0.6s}
  .zk-hash.visible{opacity:1}
  .zk-generating{display:flex;align-items:center;gap:8px;font-size:13px;color:${T.creamDim};margin-top:12px}
  .zk-spinner{width:14px;height:14px;border:2px solid ${T.border};border-top-color:${T.amber};border-radius:50%;animation:spin 0.8s linear infinite;flex-shrink:0}
  .privacy-chips{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:18px}
  .privacy-chip{display:flex;align-items:center;gap:6px;background:#0D2B1F;border:1px solid #1B4A35;border-radius:99px;padding:5px 12px;font-size:12px;color:${T.greenHi};font-weight:400}
  .privacy-chip-dot{width:6px;height:6px;border-radius:50%;background:${T.greenHi}}
  .success-ring{width:72px;height:72px;border-radius:50%;border:2px solid ${T.greenHi};display:flex;align-items:center;justify-content:center;margin:0 auto 24px;animation:fadeIn 0.5s ease}
  .member-card{background:${T.bg};border:1px solid ${T.border};border-radius:10px;padding:16px;display:flex;align-items:center;gap:14px;margin-bottom:16px}
  .member-avatar{width:44px;height:44px;border-radius:10px;background:${T.amberLo};border:1px solid ${T.amber};display:flex;align-items:center;justify-content:center;font-family:'DM Serif Display',serif;font-size:18px;color:${T.amberHi};flex-shrink:0}
  .member-info{flex:1} .member-name{font-size:15px;color:${T.cream};font-weight:500}
  .member-hood{font-size:12px;color:${T.creamDim};margin-top:2px;display:flex;align-items:center;gap:5px}
  .member-badge{display:inline-flex;align-items:center;gap:5px;background:#0D2B1F;border:1px solid #1B4A35;border-radius:99px;padding:3px 9px;font-size:11px;color:${T.greenHi}}
  .next-steps{display:flex;flex-direction:column;gap:8px;margin-bottom:20px}
  .next-step{display:flex;align-items:center;gap:12px;padding:12px 14px;background:${T.bg};border:1px solid ${T.border};border-radius:8px;font-size:13px;color:${T.creamDim};cursor:pointer;transition:all 0.15s}
  .next-step:hover{border-color:${T.borderHi};color:${T.cream}}
  .next-step-num{width:22px;height:22px;border-radius:50%;background:${T.amberLo};border:1px solid ${T.amber};font-size:11px;color:${T.amberHi};display:flex;align-items:center;justify-content:center;flex-shrink:0;font-weight:500}
  .error-msg{background:${T.redLo};border:1px solid ${T.red}44;border-radius:6px;padding:10px 12px;font-size:13px;color:#E57373;margin-top:10px;animation:fadeIn 0.3s ease}
  .tab-row{display:flex;gap:0;margin-bottom:20px;border:1px solid ${T.border};border-radius:8px;overflow:hidden}
  .tab-btn{flex:1;padding:10px;background:transparent;border:none;font-family:'DM Sans',sans-serif;font-size:13px;color:${T.creamDim};cursor:pointer;transition:all 0.15s}
  .tab-btn.active{background:${T.amberLo};color:${T.amberHi}}
  .tab-btn:hover:not(.active){background:${T.surface};color:${T.cream}}
`;

const NEARBY = [
  { id:"rv", name:"Riverdale", dist:"0.3 mi" },
  { id:"mt", name:"Midtown",   dist:"0.7 mi" },
  { id:"es", name:"Eastside",  dist:"1.1 mi" },
  { id:"hc", name:"Hillcrest", dist:"1.4 mi" },
];

function fakeHash() {
  const hex = "0123456789abcdef";
  return Array.from({ length: 64 }, () => hex[Math.floor(Math.random() * 16)]).join("");
}

function LogoMark() {
  return (
    <svg viewBox="0 0 14 14" fill="none">
      <rect x="1" y="7" width="5" height="6" rx="1" fill={T.amber}/>
      <rect x="8" y="4" width="5" height="9" rx="1" fill={T.amber} opacity="0.6"/>
      <rect x="1" y="1" width="5" height="4" rx="1" fill={T.amber} opacity="0.4"/>
    </svg>
  );
}

function CheckIcon({ color = T.greenHi, size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

function ArrowRight({ color = T.creamDim }) {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M8 4l3 3-3 3" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

// ── Step 1: Account (real Supabase auth) ──────────────────────────────────
function StepAccount({ onNext }) {
  const [mode, setMode]       = useState("signup"); // "signup" | "signin"
  const [form, setForm]       = useState({ first:"", last:"", email:"", password:"" });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const validSignup = form.first && form.last && form.email.includes("@") && form.password.length >= 6;
  const validSignin = form.email.includes("@") && form.password.length >= 1;

  async function handleSubmit() {
    setError("");
    setLoading(true);

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: {
              display_name: `${form.first} ${form.last}`,
            },
          },
        });
        if (error) throw error;
        // Some Supabase projects require email confirmation.
        // If session is null, the user needs to confirm their email first.
        if (data.session) {
          onNext({
            name: `${form.first} ${form.last}`,
            email: form.email,
            initials: `${form.first[0]}${form.last[0]}`.toUpperCase(),
          });
        } else {
          setError("Check your email for a confirmation link, then sign in below.");
          setMode("signin");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (error) throw error;
        const name = data.user?.user_metadata?.display_name || form.email.split("@")[0];
        const parts = name.split(" ");
        onNext({
          name,
          email: form.email,
          initials: parts.length >= 2
            ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
            : name.slice(0, 2).toUpperCase(),
        });
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="th-header">
        <div className="th-logo"><div className="th-logo-mark"><LogoMark /></div><span className="th-logo-name">Townhall</span></div>
        <div className="th-progress"><div className="th-progress-dot active"/><div className="th-progress-dot"/><div className="th-progress-dot"/></div>
        <h1 className="th-step-title">{mode === "signup" ? <>Create your <em>account</em></> : <>Welcome <em>back</em></>}</h1>
        <p className="th-step-sub">{mode === "signup" ? "Your civic identity — pseudonymous by default, verified by place." : "Sign in to continue to your neighborhood."}</p>
      </div>
      <div className="th-body">
        <div className="tab-row">
          <button className={`tab-btn${mode==="signup"?" active":""}`} onClick={() => { setMode("signup"); setError(""); }}>New account</button>
          <button className={`tab-btn${mode==="signin"?" active":""}`} onClick={() => { setMode("signin"); setError(""); }}>Sign in</button>
        </div>

        {mode === "signup" && (
          <div className="th-field" style={{ animationDelay:"0.05s" }}>
            <div className="th-input-row">
              <div><label className="th-label">First name</label><input className="th-input" placeholder="Maya" value={form.first} onChange={e => setForm(f => ({ ...f, first:e.target.value }))}/></div>
              <div><label className="th-label">Last name</label><input className="th-input" placeholder="Chen" value={form.last} onChange={e => setForm(f => ({ ...f, last:e.target.value }))}/></div>
            </div>
          </div>
        )}

        <div className="th-field">
          <label className="th-label">Email</label>
          <input className="th-input" type="email" placeholder="you@email.com" value={form.email} onChange={e => setForm(f => ({ ...f, email:e.target.value }))}/>
        </div>

        <div className="th-field">
          <label className="th-label">Password {mode==="signup" && <span style={{ color:T.borderHi, fontWeight:300 }}>— min 6 characters</span>}</label>
          <input className="th-input" type="password" placeholder="••••••••" value={form.password} onChange={e => setForm(f => ({ ...f, password:e.target.value }))}
            onKeyDown={e => { if (e.key === "Enter") handleSubmit(); }}/>
        </div>

        {error && <div className="error-msg">{error}</div>}

        <button className="th-btn th-btn-primary"
          onClick={handleSubmit}
          disabled={(mode==="signup" ? !validSignup : !validSignin) || loading}>
          {loading
            ? <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}><span className="zk-spinner"/> {mode==="signup" ? "Creating account…" : "Signing in…"}</span>
            : mode==="signup" ? "Continue →" : "Sign in →"}
        </button>

        <div className="th-terms">
          By continuing you agree to Townhall&apos;s <a>Terms of Use</a> and <a>Privacy Policy</a>.<br/>
          Your address is <strong style={{ color:T.cream }}>never stored</strong>.
        </div>
      </div>
    </>
  );
}

// ── Step 2: Neighborhood ──────────────────────────────────────────────────
function StepNeighborhood({ onNext }) {
  const [locating, setLocating] = useState(true);
  const [selected, setSelected] = useState(null);
  const [locLabel, setLocLabel] = useState("Locating you…");

  useEffect(() => {
    const t1 = setTimeout(() => setLocLabel("Signal acquired"), 1200);
    const t2 = setTimeout(() => setLocating(false), 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <>
      <div className="th-header">
        <div className="th-logo"><div className="th-logo-mark"><LogoMark /></div><span className="th-logo-name">Townhall</span></div>
        <div className="th-progress"><div className="th-progress-dot done"/><div className="th-progress-dot active"/><div className="th-progress-dot"/></div>
        <h1 className="th-step-title">Your <em>neighborhood</em></h1>
        <p className="th-step-sub">We detect nearby communities. Your exact location is used once and discarded.</p>
      </div>
      <div className="th-body">
        <div className="geo-map">
          <div className="geo-grid"/>
          {locating ? (<><div className="geo-ring"/><div className="geo-ring"/><div className="geo-ring"/><div className="geo-dot"/></>) : <div className="geo-dot" style={{ animation:"none" }}/>}
          <div className="geo-label">{locating ? <span style={{ animation:"pulse 1s ease infinite", display:"inline-block" }}>{locLabel}</span> : "40.7128° N, 74.0060° W"}</div>
        </div>
        {!locating && (
          <>
            <label className="th-label" style={{ marginBottom:10, display:"block" }}>Neighborhoods near you</label>
            <div className="hood-grid">
              {NEARBY.map(h => (
                <div key={h.id} className={`hood-item${selected===h.id?" selected":""}`} onClick={() => setSelected(h.id)}>
                  <div><div className="hood-name">{h.name}</div><div className="hood-dist">{h.dist} away</div></div>
                  <div className="hood-check">{selected===h.id && <CheckIcon color={T.bg} size={11}/>}</div>
                </div>
              ))}
            </div>
          </>
        )}
        <button className="th-btn th-btn-primary" disabled={!selected} onClick={() => onNext({ hood: NEARBY.find(h => h.id===selected) })}>Continue →</button>
        <button className="th-btn th-btn-ghost">I don&apos;t see my neighborhood — create one</button>
      </div>
    </>
  );
}

// ── Step 3: ZK Proof ──────────────────────────────────────────────────────
function StepZK({ hood, onNext }) {
  const [phase, setPhase]     = useState("intro");
  const [hash, setHash]       = useState("");
  const [proofHash, setProofHash] = useState("");

  function startGeneration() {
    setPhase("generating");
    setTimeout(() => setHash(fakeHash()), 600);
    setTimeout(() => setProofHash(fakeHash()), 1400);
    setTimeout(() => setPhase("done"), 2200);
  }

  return (
    <>
      <div className="th-header">
        <div className="th-logo"><div className="th-logo-mark"><LogoMark /></div><span className="th-logo-name">Townhall</span></div>
        <div className="th-progress"><div className="th-progress-dot done"/><div className="th-progress-dot done"/><div className="th-progress-dot active"/></div>
        <h1 className="th-step-title"><em>Prove</em> your residency</h1>
        <p className="th-step-sub">Your address stays with you. We generate a cryptographic proof that you&apos;re a {hood.name} resident — without ever seeing your location.</p>
      </div>
      <div className="th-body">
        <div className="privacy-chips">
          {["Address never stored","No tracking after this","Proof is yours"].map(c => (
            <div key={c} className="privacy-chip"><div className="privacy-chip-dot"/>{c}</div>
          ))}
        </div>
        <div className="zk-chamber">
          {phase !== "intro" && <div className="zk-scanline"/>}
          <div className="zk-title">Zero-knowledge proof chamber</div>
          <div className="zk-rows">
            <div className="zk-row"><div className="zk-row-icon no">✕</div><span className="zk-row-text"><strong>Not stored:</strong> your GPS coordinates</span></div>
            <div className="zk-row"><div className="zk-row-icon no">✕</div><span className="zk-row-text"><strong>Not stored:</strong> your home address</span></div>
            <div className="zk-row"><div className="zk-row-icon enc">◈</div><span className="zk-row-text"><strong>Committed:</strong> location within {hood.name} boundary</span></div>
            <div className="zk-row"><div className="zk-row-icon ok">✓</div><span className="zk-row-text"><strong>Stored:</strong> proof you&apos;re a verified resident</span></div>
          </div>
          <div className="zk-proof-area">
            <div className="zk-proof-label">Commitment hash</div>
            <div className={`zk-hash${hash?" visible":""}`}>{hash || "—"}</div>
            {proofHash && (<><div className="zk-proof-label" style={{ marginTop:10 }}>Residency proof</div><div className={`zk-hash${proofHash?" visible":""}`}>{proofHash}</div></>)}
            {phase==="generating" && !proofHash && <div className="zk-generating"><div className="zk-spinner"/>Generating proof…</div>}
            {phase==="done" && <div style={{ marginTop:12, display:"flex", alignItems:"center", gap:8, fontSize:13, color:T.greenHi }}><CheckIcon color={T.greenHi} size={14}/>Proof verified · {hood.name} resident confirmed</div>}
          </div>
        </div>
        {phase==="intro"      && <button className="th-btn th-btn-primary" onClick={startGeneration}>Generate my residency proof</button>}
        {phase==="generating" && <button className="th-btn th-btn-primary" disabled><span style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}><span className="zk-spinner"/> Generating…</span></button>}
        {phase==="done"       && <button className="th-btn th-btn-primary" onClick={onNext}>Enter Townhall →</button>}
      </div>
    </>
  );
}

// ── Step 4: Welcome ───────────────────────────────────────────────────────
function StepWelcome({ user, hood }) {
  async function handleEnter() {
    // Save neighborhood choice to user metadata in Supabase
    await supabase.auth.updateUser({
      data: { neighborhood: hood.name, neighborhood_id: hood.id },
    });
    // Auth state change in index.jsx will automatically navigate to feed
  }

  return (
    <>
      <div className="th-header">
        <div className="th-logo"><div className="th-logo-mark"><LogoMark /></div><span className="th-logo-name">Townhall</span></div>
        <h1 className="th-step-title" style={{ marginTop:8 }}>Welcome to <em>{hood.name}</em></h1>
        <p className="th-step-sub">You&apos;re a verified resident. Your voice counts.</p>
      </div>
      <div className="th-body">
        <div className="success-ring"><CheckIcon color={T.greenHi} size={32}/></div>
        <div className="member-card">
          <div className="member-avatar">{user.initials}</div>
          <div className="member-info">
            <div className="member-name">{user.name}</div>
            <div className="member-hood">
              <span>{hood.name} resident</span>
              <span className="member-badge"><div style={{ width:5,height:5,borderRadius:"50%",background:T.greenHi }}/>ZK verified</span>
            </div>
          </div>
        </div>
        <label className="th-label" style={{ marginBottom:10, display:"block" }}>What to do next</label>
        <div className="next-steps">
          {["Browse your neighborhood banter feed","See open civic issues in "+hood.name,"Ask the expert panel a question"].map((s,i) => (
            <div key={s} className="next-step"><div className="next-step-num">{i+1}</div><span style={{ flex:1 }}>{s}</span><ArrowRight/></div>
          ))}
        </div>
        <button className="th-btn th-btn-primary" onClick={handleEnter}>Open Townhall</button>
      </div>
    </>
  );
}

// ── App shell ─────────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const [step, setStep] = useState(1);
  const [user, setUser] = useState(null);
  const [hood, setHood] = useState(null);

  return (
    <>
      <style>{css}</style>
      <div className="th-card" key={step}>
        {step === 1 && <StepAccount onNext={data => { setUser(data); setStep(2); }}/>}
        {step === 2 && <StepNeighborhood onNext={data => { setHood(data.hood); setStep(3); }}/>}
        {step === 3 && <StepZK hood={hood} onNext={() => setStep(4)}/>}
        {step === 4 && <StepWelcome user={user} hood={hood}/>}
      </div>
    </>
  );
}
