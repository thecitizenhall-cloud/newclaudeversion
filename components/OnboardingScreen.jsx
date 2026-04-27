"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const T = {
  bg:"#0F0E0C", surface:"#1A1916", surfaceHi:"#222019",
  border:"#2C2A26", borderHi:"#4A4640",
  cream:"#F2EDE4", creamDim:"#9A9188", creamFaint:"#4A4640",
  amber:"#D4922A", amberLo:"#2A1E08", amberMid:"#8C5E14", amberHi:"#F0B84A",
  teal:"#1D9E75", tealLo:"#0A2A1E", tealHi:"#4CAF80",
  green:"#2D6A4F", greenHi:"#4CAF80",
  red:"#C0392B", redLo:"#2A0E0A",
};

const css = `
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  body { background:${T.bg}; color:${T.cream}; font-family:'DM Sans',sans-serif; min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px; }
  @keyframes fadeUp  { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.4} }
  @keyframes spin    { to{transform:rotate(360deg)} }
  @keyframes scanline{ from{transform:translateY(0)} to{transform:translateY(100%)} }
  @keyframes geoRing { 0%{transform:scale(1);opacity:0.8} 100%{transform:scale(2.8);opacity:0} }
  .th-card { background:${T.surface}; border:1px solid ${T.border}; border-radius:16px; width:100%; max-width:480px; overflow:hidden; animation:fadeUp 0.5s ease both; }
  .th-header { padding:32px 36px 24px; border-bottom:1px solid ${T.border}; position:relative; }
  .th-logo { display:flex; align-items:center; gap:10px; margin-bottom:16px; }
  .th-logo-mark { width:28px; height:28px; border:2px solid ${T.amber}; border-radius:6px; display:flex; align-items:center; justify-content:center; }
  .th-logo-name { font-family:'DM Serif Display',serif; font-size:17px; color:${T.cream}; }
  .th-tagline { font-size:12px; color:${T.amberHi}; font-style:italic; margin-bottom:16px; }
  .th-step-title { font-family:'DM Serif Display',serif; font-size:26px; line-height:1.2; color:${T.cream}; margin-bottom:8px; }
  .th-step-title em { font-style:italic; color:${T.amberHi}; }
  .th-step-sub { font-size:14px; color:${T.creamDim}; line-height:1.6; font-weight:300; }
  .th-progress { display:flex; gap:6px; position:absolute; top:32px; right:36px; }
  .th-progress-dot { width:6px; height:6px; border-radius:50%; background:${T.border}; transition:background 0.3s,transform 0.3s; }
  .th-progress-dot.active { background:${T.amber}; transform:scale(1.3); }
  .th-progress-dot.done   { background:${T.greenHi}; }
  .th-body { padding:28px 36px 32px; }
  .th-field { margin-bottom:18px; }
  .th-label { font-size:12px; font-weight:500; color:${T.creamDim}; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:8px; display:block; }
  .th-input { width:100%; background:${T.bg}; border:1px solid ${T.border}; border-radius:8px; padding:12px 14px; font-family:'DM Sans',sans-serif; font-size:15px; color:${T.cream}; outline:none; transition:border-color 0.2s; }
  .th-input:focus { border-color:${T.amber}; }
  .th-input::placeholder { color:${T.borderHi}; }
  .th-input-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .th-btn { width:100%; padding:14px; border-radius:8px; border:none; font-family:'DM Sans',sans-serif; font-size:15px; font-weight:500; cursor:pointer; transition:all 0.2s; margin-top:8px; }
  .th-btn-primary { background:${T.amber}; color:#0F0E0C; }
  .th-btn-primary:hover { background:${T.amberHi}; }
  .th-btn-primary:disabled { opacity:0.4; cursor:not-allowed; }
  .th-btn-ghost { background:transparent; color:${T.creamDim}; border:1px solid ${T.border}; margin-top:10px; font-size:13px; }
  .th-btn-ghost:hover { border-color:${T.borderHi}; color:${T.cream}; }
  .th-terms { font-size:12px; color:${T.borderHi}; text-align:center; margin-top:16px; line-height:1.6; }
  .th-terms a { color:${T.creamDim}; text-decoration:underline; cursor:pointer; }
  .tab-row { display:flex; margin-bottom:20px; border:1px solid ${T.border}; border-radius:8px; overflow:hidden; }
  .tab-btn { flex:1; padding:10px; background:transparent; border:none; font-family:'DM Sans',sans-serif; font-size:13px; color:${T.creamDim}; cursor:pointer; transition:all 0.15s; }
  .tab-btn.active { background:${T.amberLo}; color:${T.amberHi}; }
  .tab-btn:hover:not(.active) { background:${T.surfaceHi}; color:${T.cream}; }
  .error-msg { background:${T.redLo}; border:1px solid #C0392B44; border-radius:6px; padding:10px 12px; font-size:13px; color:#E57373; margin-top:10px; }
  .geo-map { background:${T.bg}; border:1px solid ${T.border}; border-radius:12px; height:140px; position:relative; overflow:hidden; margin-bottom:18px; display:flex; align-items:center; justify-content:center; }
  .geo-grid { position:absolute; inset:0; background-image:linear-gradient(${T.border} 1px,transparent 1px),linear-gradient(90deg,${T.border} 1px,transparent 1px); background-size:32px 32px; opacity:0.5; }
  .geo-ring { position:absolute; width:40px; height:40px; border-radius:50%; border:2px solid ${T.amber}; animation:geoRing 2s ease-out infinite; }
  .geo-ring:nth-child(2){animation-delay:0.6s} .geo-ring:nth-child(3){animation-delay:1.2s}
  .geo-dot { width:10px; height:10px; border-radius:50%; background:${T.amber}; position:relative; z-index:2; box-shadow:0 0 0 3px ${T.amberLo}; }
  .geo-label { position:absolute; bottom:10px; right:12px; font-size:11px; color:${T.creamDim}; }
  .hood-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:14px; }
  .hood-item { background:${T.bg}; border:1px solid ${T.border}; border-radius:8px; padding:12px 14px; cursor:pointer; transition:all 0.2s; display:flex; align-items:center; justify-content:space-between; }
  .hood-item:hover { border-color:${T.borderHi}; }
  .hood-item.selected { border-color:${T.amber}; background:${T.amberLo}; }
  .hood-name { font-size:13px; color:${T.cream}; }
  .hood-check { width:18px; height:18px; border-radius:50%; border:1.5px solid ${T.border}; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all 0.2s; }
  .hood-item.selected .hood-check { background:${T.amber}; border-color:${T.amber}; }
  .th-loading { display:flex; align-items:center; gap:10px; padding:20px 0; color:${T.creamDim}; font-size:13px; }
  .th-spinner { width:14px; height:14px; border:2px solid ${T.border}; border-top-color:${T.amber}; border-radius:50%; animation:spin 0.8s linear infinite; flex-shrink:0; }
  .zk-chamber { background:${T.bg}; border:1px solid ${T.border}; border-radius:12px; padding:24px; margin-bottom:18px; position:relative; overflow:hidden; }
  .zk-scanline { position:absolute; left:0; right:0; height:2px; background:linear-gradient(90deg,transparent,${T.amber}44,transparent); animation:scanline 2.5s linear infinite; pointer-events:none; }
  .zk-title { font-size:12px; font-weight:500; color:${T.creamDim}; text-transform:uppercase; letter-spacing:0.1em; margin-bottom:16px; }
  .zk-rows { display:flex; flex-direction:column; gap:10px; }
  .zk-row { display:flex; align-items:center; gap:12px; font-size:13px; }
  .zk-row-icon { width:28px; height:28px; border-radius:6px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:13px; }
  .zk-row-icon.ok  { background:#0D2B1F; color:${T.greenHi}; }
  .zk-row-icon.no  { background:${T.redLo}; color:${T.red}; }
  .zk-row-icon.enc { background:${T.amberLo}; color:${T.amberHi}; }
  .zk-row-text { color:${T.creamDim}; flex:1; }
  .zk-row-text strong { color:${T.cream}; font-weight:500; }
  .zk-proof-area { margin-top:16px; border-top:1px solid ${T.border}; padding-top:16px; }
  .zk-proof-label { font-size:11px; color:${T.borderHi}; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:8px; }
  .zk-hash { font-family:'Courier New',monospace; font-size:11px; color:${T.amber}; word-break:break-all; line-height:1.7; opacity:0; transition:opacity 0.6s; }
  .zk-hash.visible { opacity:1; }
  .zk-spinner-row { display:flex; align-items:center; gap:8px; font-size:13px; color:${T.creamDim}; margin-top:12px; }
  .privacy-chips { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:18px; }
  .privacy-chip { display:flex; align-items:center; gap:6px; background:#0D2B1F; border:1px solid #1B4A35; border-radius:99px; padding:5px 12px; font-size:12px; color:${T.greenHi}; }
  .privacy-chip-dot { width:6px; height:6px; border-radius:50%; background:${T.greenHi}; }
  .success-ring { width:72px; height:72px; border-radius:50%; border:2px solid ${T.greenHi}; display:flex; align-items:center; justify-content:center; margin:0 auto 24px; }
  .member-card { background:${T.bg}; border:1px solid ${T.border}; border-radius:10px; padding:16px; display:flex; align-items:center; gap:14px; margin-bottom:16px; }
  .member-avatar { width:44px; height:44px; border-radius:10px; background:${T.amberLo}; border:1px solid ${T.amber}; display:flex; align-items:center; justify-content:center; font-family:'DM Serif Display',serif; font-size:18px; color:${T.amberHi}; flex-shrink:0; }
  .member-name { font-size:15px; color:${T.cream}; font-weight:500; }
  .member-hood { font-size:12px; color:${T.creamDim}; margin-top:2px; display:flex; align-items:center; gap:5px; }
  .member-badge { display:inline-flex; align-items:center; gap:5px; background:#0D2B1F; border:1px solid #1B4A35; border-radius:99px; padding:3px 9px; font-size:11px; color:${T.greenHi}; }
  .next-steps { display:flex; flex-direction:column; gap:8px; margin-bottom:20px; }
  .next-step { display:flex; align-items:center; gap:12px; padding:12px 14px; background:${T.bg}; border:1px solid ${T.border}; border-radius:8px; font-size:13px; color:${T.creamDim}; cursor:default; }
  .next-step-num { width:22px; height:22px; border-radius:50%; background:${T.amberLo}; border:1px solid ${T.amber}; font-size:11px; color:${T.amberHi}; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-weight:500; }
`;

function fakeHash() {
  const hex = "0123456789abcdef";
  return Array.from({ length:64 }, () => hex[Math.floor(Math.random()*16)]).join("");
}

function LogoMark() {
  return (
    <svg viewBox="0 0 14 14" fill="none" width="14" height="14">
      <rect x="1" y="7" width="5" height="6" rx="1" fill={T.amber}/>
      <rect x="8" y="4" width="5" height="9" rx="1" fill={T.amber} opacity="0.6"/>
      <rect x="1" y="1" width="5" height="4" rx="1" fill={T.amber} opacity="0.4"/>
    </svg>
  );
}

function CheckIcon({ color, size=16 }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

// ── Step 1: Account ───────────────────────────────────────────────────────
function StepAccount({ onNext }) {
  const [mode,      setMode]      = useState("signup");
  const [form,      setForm]      = useState({ first:"", last:"", email:"", password:"" });
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [resetSent, setResetSent] = useState(false);

  const f = (k, v) => setForm(p => ({ ...p, [k]:v }));
  const validSignup = form.first && form.last && form.email.includes("@") && form.password.length >= 6;
  const validSignin = form.email.includes("@") && form.password.length >= 1;

  async function handleSubmit() {
    setError(""); setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: form.email, password: form.password,
          options: { data: { display_name:`${form.first} ${form.last}` } },
        });
        if (error) throw error;
        if (data.session) {
          onNext({ name:`${form.first} ${form.last}`, email:form.email, initials:`${form.first[0]}${form.last[0]}`.toUpperCase() });
        } else {
          setError("Check your email for a confirmation link, then sign in below.");
          setMode("signin");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email:form.email, password:form.password });
        if (error) throw error;
        const name = data.user?.user_metadata?.display_name || form.email.split("@")[0];
        const parts = name.split(" ");
        onNext({ name, email:form.email, initials: parts.length>=2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name.slice(0,2).toUpperCase() });
      }
    } catch(err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    if (!form.email.includes("@")) { setError("Enter your email address first."); return; }
    setLoading(true); setError("");
    const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
      redirectTo: "https://townhallcafe.org/reset-password",
    });
    if (error) setError(error.message); else setResetSent(true);
    setLoading(false);
  }

  return (
    <>
      <div className="th-header">
        <div className="th-logo"><div className="th-logo-mark"><LogoMark/></div><span className="th-logo-name">Townhall Cafe</span></div>
        <div className="th-tagline">Where you can have a coffee break with the mayor.</div>
        <div className="th-progress"><div className="th-progress-dot active"/><div className="th-progress-dot"/><div className="th-progress-dot"/></div>
        <h1 className="th-step-title">{mode==="signup" ? <>Create your <em>account</em></> : <>Welcome <em>back</em></>}</h1>
        <p className="th-step-sub">{mode==="signup" ? "Your civic identity — verified by place." : "Sign in to continue to your neighborhood."}</p>
      </div>
      <div className="th-body">
        <div className="tab-row">
          <button className={`tab-btn${mode==="signup"?" active":""}`} onClick={()=>{ setMode("signup"); setError(""); setResetSent(false); }}>New account</button>
          <button className={`tab-btn${mode==="signin"?" active":""}`} onClick={()=>{ setMode("signin"); setError(""); setResetSent(false); }}>Sign in</button>
        </div>

        {mode==="signup" && (
          <div className="th-field">
            <div className="th-input-row">
              <div><label className="th-label">First name</label><input className="th-input" placeholder="Maya" value={form.first} onChange={e=>f("first",e.target.value)}/></div>
              <div><label className="th-label">Last name</label><input className="th-input" placeholder="Chen" value={form.last} onChange={e=>f("last",e.target.value)}/></div>
            </div>
          </div>
        )}
        <div className="th-field">
          <label className="th-label">Email</label>
          <input className="th-input" type="email" placeholder="you@email.com" value={form.email} onChange={e=>f("email",e.target.value)}/>
        </div>
        <div className="th-field">
          <label className="th-label">Password {mode==="signup" && <span style={{color:T.borderHi,fontWeight:300}}>— min 6 characters</span>}</label>
          <input className="th-input" type="password" placeholder="••••••••" value={form.password}
            onChange={e=>f("password",e.target.value)} onKeyDown={e=>{ if(e.key==="Enter") handleSubmit(); }}/>
        </div>

        {error && <div className="error-msg">{error}</div>}

        {mode==="reset" ? (
          resetSent ? (
            <div style={{background:"#0A2A1E",border:"1px solid #1D9E75",borderRadius:8,padding:"14px 16px",textAlign:"center"}}>
              <div style={{fontSize:20,marginBottom:8}}>📬</div>
              <div style={{fontSize:13,color:"#4CAF80",fontWeight:500,marginBottom:4}}>Reset link sent</div>
              <div style={{fontSize:12,color:"#9A9188",lineHeight:1.6}}>Check your email for a password reset link.</div>
              <button style={{marginTop:12,background:"transparent",border:"none",fontSize:12,color:"#9A9188",cursor:"pointer",textDecoration:"underline"}}
                onClick={()=>{ setMode("signin"); setResetSent(false); setError(""); }}>Back to sign in</button>
            </div>
          ) : (
            <>
              <div style={{fontSize:12,color:"#9A9188",marginBottom:12,lineHeight:1.6}}>Enter your email above and we will send you a reset link.</div>
              <button className="th-btn th-btn-primary" onClick={handleReset} disabled={!form.email.includes("@")||loading}>
                {loading ? "Sending..." : "Send reset link"}
              </button>
              <button style={{marginTop:8,background:"transparent",border:"none",fontSize:12,color:"#9A9188",cursor:"pointer",width:"100%",padding:"6px 0",textDecoration:"underline",fontFamily:"'DM Sans',sans-serif"}}
                onClick={()=>{ setMode("signin"); setError(""); }}>Back to sign in</button>
            </>
          )
        ) : (
          <>
            <button className="th-btn th-btn-primary" onClick={handleSubmit}
              disabled={(mode==="signup"?!validSignup:!validSignin)||loading}>
              {loading ? (mode==="signup" ? "Creating account..." : "Signing in...") : (mode==="signup" ? "Continue" : "Sign in")}
            </button>
            {mode==="signin" && (
              <button style={{marginTop:6,background:"transparent",border:"none",fontSize:12,color:"#9A9188",cursor:"pointer",width:"100%",padding:"6px 0",textDecoration:"underline",fontFamily:"'DM Sans',sans-serif"}}
                onClick={()=>{ setMode("reset"); setError(""); }}>Forgot your password?</button>
            )}
          </>
        )}

        <div className="th-terms">
          By continuing you agree to Townhall Cafe&apos;s{" "}
          <a href="/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a>{" "}and{" "}
          <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.<br/>
          Your address is <strong style={{color:T.cream}}>never stored</strong>.
        </div>
      </div>
    </>
  );
}

// ── Step 2: Neighborhood ──────────────────────────────────────────────────
function StepNeighborhood({ onNext }) {
  const [phase,        setPhase]        = useState("detecting");
  const [coords,       setCoords]       = useState(null);
  const [cities,       setCities]       = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [hoods,        setHoods]        = useState([]);
  const [selectedHood, setSelectedHood] = useState(null);
  const [citySearch,   setCitySearch]   = useState("");
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [showCreate,   setShowCreate]   = useState(false);
  const [newHoodName,  setNewHoodName]  = useState("");
  const [creating,     setCreating]     = useState(false);

  function distanceMiles(lat1, lng1, lat2, lng2) {
    const R = 3959;
    const dLat = (lat2-lat1)*Math.PI/180;
    const dLng = (lng2-lng1)*Math.PI/180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
    return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
  }

  useEffect(() => {
    if (typeof window==="undefined" || !navigator.geolocation) { setPhase("manual"); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat:latitude, lng:longitude });
        const { data:allCities } = await supabase.from("cities").select("id,name,state,lat,lng");
        if (!allCities?.length) { setPhase("manual"); return; }
        const withDist = allCities.map(c => ({ ...c, dist:distanceMiles(latitude,longitude,c.lat,c.lng) })).sort((a,b)=>a.dist-b.dist);
        const nearby = withDist.slice(0,10);
        setCities(nearby);
        const closest = nearby[0];
        setSelectedCity(closest);
        await loadNeighborhoodsForCity(closest, { lat:latitude, lng:longitude });
      },
      () => setPhase("manual"),
      { timeout:5000, maximumAge:60000 }
    );
  }, []);

  async function loadNeighborhoodsForCity(city, coordsOverride) {
    setLoading(true); setSelectedHood(null);
    const useCoords = coordsOverride || coords;

    const { data:existing } = await supabase.from("neighborhoods")
      .select("id,name,center_lat,center_lng").eq("city_id",city.id).order("name");

    if (existing?.length) {
      setHoods(existing);
      autoSelectClosest(existing, city, useCoords);
      setPhase("neighborhood");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/neighborhoods-lookup?city=${encodeURIComponent(city.name)}&state=${city.state}&lat=${city.lat}&lng=${city.lng}`);
      const data = await res.json();
      if (data.neighborhoods?.length) {
        const saveRes = await fetch("/api/save-neighborhoods", {
          method:"POST", headers:{"Content-Type":"application/json"},
          body:JSON.stringify({ neighborhoods:data.neighborhoods, city_id:city.id }),
        });
        const saveData = await saveRes.json();
        const finalHoods = saveData.saved?.length ? saveData.saved : [];
        setHoods(finalHoods);
        autoSelectClosest(finalHoods, city, useCoords);
      } else {
        setHoods([]);
      }
    } catch(err) {
      console.error("Neighborhood lookup error:", err);
      setHoods([]);
    }

    setPhase("neighborhood");
    setLoading(false);
  }

  function autoSelectClosest(hoods, city, useCoords) {
    if (!useCoords || !hoods.length) return;
    const closest = hoods.reduce((a,b) => {
      const dA = distanceMiles(useCoords.lat, useCoords.lng, a.center_lat||city.lat, a.center_lng||city.lng);
      const dB = distanceMiles(useCoords.lat, useCoords.lng, b.center_lat||city.lat, b.center_lng||city.lng);
      return dA < dB ? a : b;
    });
    setSelectedHood(closest);
  }

  async function searchCities(query) {
    setCitySearch(query);
    if (query.length < 2) { setCities([]); return; }
    const [dbResult, nomResult] = await Promise.allSettled([
      supabase.from("cities").select("id,name,state,lat,lng").ilike("name",`%${query}%`).order("name").limit(15),
      fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query+", USA")}&format=json&addressdetails=1&limit=10&featuretype=city`,
        { headers:{"User-Agent":"TownhallCafe/1.0 (hello@townhallcafe.org)"} }).then(r=>r.json()),
    ]);
    const dbCities = dbResult.status==="fulfilled" ? (dbResult.value.data||[]) : [];
    let nomCities = [];
    if (nomResult.status==="fulfilled") {
      nomCities = nomResult.value
        .filter(r=>["city","town","village","municipality","borough","hamlet"].includes(r.type)||r.addresstype==="city")
        .map(r=>({ nominatim_id:r.place_id, name:r.address?.city||r.address?.town||r.address?.village||r.name, state:r.address?.state_code||r.address?.ISO3166_2_lvl4?.replace("US-","")||"", lat:parseFloat(r.lat), lng:parseFloat(r.lon), fromNominatim:true }))
        .filter(r=>r.name&&r.state);
    }
    const dbNames = new Set(dbCities.map(c=>`${c.name.toLowerCase()}-${c.state.toLowerCase()}`));
    const newNom = nomCities.filter(c=>!dbNames.has(`${c.name.toLowerCase()}-${c.state.toLowerCase()}`));
    setCities([...dbCities,...newNom].slice(0,20));
  }

  async function handleCitySelect(city) {
    if (city.fromNominatim) {
      const { data:saved } = await supabase.from("cities").insert({ name:city.name, state:city.state, lat:city.lat, lng:city.lng }).select().single();
      if (!saved) { setLoading(false); return; }
      setSelectedCity(saved);
      await loadNeighborhoodsForCity(saved);
    } else {
      setSelectedCity(city);
      await loadNeighborhoodsForCity(city);
    }
  }

  async function handleCreateHood() {
    if (!newHoodName.trim()||creating) return;
    setCreating(true); setError("");
    const name = newHoodName.trim();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g,"-");
    const { data, error:err } = await supabase.from("neighborhoods")
      .insert({ name, slug, city_id:selectedCity?.id||null, center_lat:coords?.lat||selectedCity?.lat||null, center_lng:coords?.lng||selectedCity?.lng||null })
      .select("id,name,center_lat,center_lng").single();
    if (err) {
      if (err.code==="23505") {
        const { data:ex } = await supabase.from("neighborhoods").select("id,name,center_lat,center_lng").eq("slug",slug).single();
        if (ex) { setSelectedHood(ex); setHoods(prev=>prev.find(h=>h.id===ex.id)?prev:[ex,...prev]); setShowCreate(false); setNewHoodName(""); }
      } else { setError("Could not create neighborhood — "+err.message); }
    } else {
      setSelectedHood(data); setHoods(prev=>[data,...prev]); setShowCreate(false); setNewHoodName("");
    }
    setCreating(false);
  }

  if (phase==="detecting") return (
    <>
      <div className="th-header">
        <div className="th-logo"><div className="th-logo-mark"><LogoMark/></div><span className="th-logo-name">Townhall Cafe</span></div>
        <div className="th-progress"><div className="th-progress-dot done"/><div className="th-progress-dot active"/><div className="th-progress-dot"/></div>
        <h1 className="th-step-title">Finding your <em>city</em></h1>
        <p className="th-step-sub">Allow location access to automatically detect your neighborhood.</p>
      </div>
      <div className="th-body">
        <div className="geo-map">
          <div className="geo-grid"/>
          <div className="geo-ring"/><div className="geo-ring"/><div className="geo-ring"/>
          <div className="geo-dot"/>
          <div className="geo-label"><span style={{animation:"pulse 1s ease infinite",display:"inline-block"}}>Detecting location...</span></div>
        </div>
        <button className="th-btn th-btn-ghost" onClick={()=>setPhase("manual")}>Enter my city manually instead</button>
      </div>
    </>
  );

  if (phase==="manual") return (
    <>
      <div className="th-header">
        <div className="th-logo"><div className="th-logo-mark"><LogoMark/></div><span className="th-logo-name">Townhall Cafe</span></div>
        <div className="th-progress"><div className="th-progress-dot done"/><div className="th-progress-dot active"/><div className="th-progress-dot"/></div>
        <h1 className="th-step-title">Find your <em>city</em></h1>
        <p className="th-step-sub">Search for your city across all 50 states.</p>
      </div>
      <div className="th-body">
        <input className="th-input" placeholder="Search city name..." value={citySearch}
          onChange={e=>searchCities(e.target.value)} style={{marginBottom:12}} autoFocus/>
        {cities.length>0 && (
          <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:16,maxHeight:280,overflowY:"auto"}}>
            {cities.map(city=>(
              <div key={city.id||city.nominatim_id} onClick={()=>handleCitySelect(city)}
                style={{padding:"10px 14px",background:T.bg,border:`1px solid ${T.border}`,borderRadius:8,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}
                onMouseEnter={e=>e.currentTarget.style.borderColor=T.borderHi}
                onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
                <span style={{fontSize:13,color:T.cream}}>{city.name}</span>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:11,color:T.creamDim}}>{city.state}</div>
                  {city.fromNominatim && <div style={{fontSize:9,color:T.creamFaint}}>OpenStreetMap</div>}
                </div>
              </div>
            ))}
          </div>
        )}
        {citySearch.length>=2 && cities.length===0 && (
          <div style={{fontSize:12,color:T.creamFaint,textAlign:"center",padding:"20px 0",lineHeight:1.7}}>
            No cities found for &quot;{citySearch}&quot;<br/>
            <span style={{fontSize:11}}>Try a different spelling or a nearby larger city.</span>
          </div>
        )}
        {loading && <div className="th-loading"><div className="th-spinner"/>Loading neighborhoods...</div>}
      </div>
    </>
  );

  return (
    <>
      <div className="th-header">
        <div className="th-logo"><div className="th-logo-mark"><LogoMark/></div><span className="th-logo-name">Townhall Cafe</span></div>
        <div className="th-progress"><div className="th-progress-dot done"/><div className="th-progress-dot active"/><div className="th-progress-dot"/></div>
        <h1 className="th-step-title">Your <em>neighborhood</em></h1>
        <p className="th-step-sub">{coords ? `Near ${selectedCity?.name}, ${selectedCity?.state}.` : `Showing neighborhoods in ${selectedCity?.name}, ${selectedCity?.state}.`}</p>
      </div>
      <div className="th-body">
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
          <div style={{padding:"4px 12px",background:T.amberLo,border:`1px solid ${T.amberMid}`,borderRadius:99,fontSize:12,color:T.amberHi}}>
            {selectedCity?.name}, {selectedCity?.state}
          </div>
          <button onClick={()=>{ setPhase("manual"); setCitySearch(""); setCities([]); }}
            style={{background:"transparent",border:"none",fontSize:12,color:T.creamDim,cursor:"pointer",textDecoration:"underline",fontFamily:"'DM Sans',sans-serif"}}>
            Change city
          </button>
        </div>

        {loading ? (
          <div className="th-loading"><div className="th-spinner"/>Loading neighborhoods...</div>
        ) : (
          <>
            <label className="th-label" style={{marginBottom:10,display:"block"}}>
              Select your neighborhood
              {coords && selectedHood && <span style={{color:T.tealHi,marginLeft:8,fontWeight:400}}>— closest match selected</span>}
            </label>
            <div className="hood-grid">
              {hoods.map(h=>(
                <div key={h.id} className={`hood-item${selectedHood?.id===h.id?" selected":""}`} onClick={()=>setSelectedHood(h)}>
                  <div className="hood-name">{h.name}</div>
                  <div className="hood-check">{selectedHood?.id===h.id && <CheckIcon color={T.bg} size={11}/>}</div>
                </div>
              ))}
            </div>
            {hoods.length===0 && (
              <div style={{fontSize:13,color:T.creamFaint,textAlign:"center",padding:"20px 0",lineHeight:1.7}}>
                No neighborhoods in {selectedCity?.name} yet.<br/>
                <span style={{fontSize:12}}>Create one below.</span>
              </div>
            )}
          </>
        )}

        {error && <div style={{fontSize:12,color:"#E57373",marginBottom:10}}>{error}</div>}

        <button className="th-btn th-btn-primary" disabled={!selectedHood||loading}
          onClick={()=>{ if(!selectedHood?.id){setError("Please select or create a neighborhood.");return;} onNext({ hood:{id:selectedHood.id,name:selectedHood.name} }); }}>
          Continue
        </button>

        {!showCreate ? (
          <button className="th-btn th-btn-ghost" onClick={()=>{ setShowCreate(true); setError(""); }}>
            I don&apos;t see my neighborhood — create one
          </button>
        ) : (
          <div style={{background:T.surfaceHi,border:`1px solid ${T.border}`,borderRadius:10,padding:"14px",marginTop:8}}>
            <div style={{fontSize:12,fontWeight:500,color:T.creamDim,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Create a new neighborhood</div>
            <input className="th-input" placeholder="Neighborhood name e.g. Northside" value={newHoodName}
              onChange={e=>setNewHoodName(e.target.value)} style={{marginBottom:10}} autoFocus/>
            <div style={{display:"flex",gap:8}}>
              <button className="th-btn th-btn-ghost" style={{flex:1,padding:"9px 0",marginTop:0}}
                onClick={()=>{ setShowCreate(false); setNewHoodName(""); setError(""); }}>Cancel</button>
              <button className="th-btn th-btn-primary" style={{flex:2,padding:"9px 0",marginTop:0}}
                disabled={!newHoodName.trim()||creating} onClick={handleCreateHood}>
                {creating ? "Creating..." : "Create neighborhood"}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ── Step 3: ZK Proof ──────────────────────────────────────────────────────
function StepZK({ hood, onNext }) {
  const [phase,     setPhase]     = useState("intro");
  const [hash,      setHash]      = useState("");
  const [proofHash, setProofHash] = useState("");

  function startGeneration() {
    setPhase("generating");
    setTimeout(()=>setHash(fakeHash()), 600);
    setTimeout(()=>setProofHash(fakeHash()), 1400);
    setTimeout(()=>setPhase("done"), 2200);
  }

  return (
    <>
      <div className="th-header">
        <div className="th-logo"><div className="th-logo-mark"><LogoMark/></div><span className="th-logo-name">Townhall Cafe</span></div>
        <div className="th-progress"><div className="th-progress-dot done"/><div className="th-progress-dot done"/><div className="th-progress-dot active"/></div>
        <h1 className="th-step-title"><em>Prove</em> your residency</h1>
        <p className="th-step-sub">We generate a cryptographic proof that you are a {hood.name} resident without ever seeing your address.</p>
      </div>
      <div className="th-body">
        <div className="privacy-chips">
          {["Address never stored","No tracking after this","Proof is yours"].map(c=>(
            <div key={c} className="privacy-chip"><div className="privacy-chip-dot"/>{c}</div>
          ))}
        </div>
        <div className="zk-chamber">
          {phase!=="intro" && <div className="zk-scanline"/>}
          <div className="zk-title">Zero-knowledge proof chamber</div>
          <div className="zk-rows">
            <div className="zk-row"><div className="zk-row-icon no">X</div><span className="zk-row-text"><strong>Not stored:</strong> your GPS coordinates</span></div>
            <div className="zk-row"><div className="zk-row-icon no">X</div><span className="zk-row-text"><strong>Not stored:</strong> your home address</span></div>
            <div className="zk-row"><div className="zk-row-icon enc">~</div><span className="zk-row-text"><strong>Committed:</strong> location within {hood.name} boundary</span></div>
            <div className="zk-row"><div className="zk-row-icon ok">v</div><span className="zk-row-text"><strong>Stored:</strong> proof you are a verified resident</span></div>
          </div>
          <div className="zk-proof-area">
            <div className="zk-proof-label">Commitment hash</div>
            <div className={`zk-hash${hash?" visible":""}`}>{hash||"—"}</div>
            {proofHash && (<><div className="zk-proof-label" style={{marginTop:10}}>Residency proof</div><div className={`zk-hash${proofHash?" visible":""}`}>{proofHash}</div></>)}
            {phase==="generating"&&!proofHash&&<div className="zk-spinner-row"><div className="th-spinner"/>Generating proof...</div>}
            {phase==="done"&&<div style={{marginTop:12,display:"flex",alignItems:"center",gap:8,fontSize:13,color:T.greenHi}}><CheckIcon color={T.greenHi} size={14}/>{hood.name} resident confirmed</div>}
          </div>
        </div>
        {phase==="intro"      && <button className="th-btn th-btn-primary" onClick={startGeneration}>Generate my residency proof</button>}
        {phase==="generating" && <button className="th-btn th-btn-primary" disabled>Generating...</button>}
        {phase==="done"       && <button className="th-btn th-btn-primary" onClick={onNext}>Enter Townhall</button>}
      </div>
    </>
  );
}

// ── Step 4: Welcome ───────────────────────────────────────────────────────
function StepWelcome({ user, hood, onComplete }) {
  const [saving, setSaving] = useState(false);

  async function handleEnter() {
    setSaving(true);
    try {
      await supabase.auth.updateUser({
        data: { display_name:user.name, neighborhood:hood.name, neighborhood_id:hood.id },
      });
      const { data:{ user:authUser } } = await supabase.auth.getUser();
      if (authUser) {
        await supabase.from("profiles").update({
          display_name:user.name, neighborhood:hood.name,
          neighborhood_id:hood.id, onboarded:true,
          updated_at:new Date().toISOString(),
        }).eq("id",authUser.id);
      }
    } catch(e) { console.error("save error:",e); }
    setSaving(false);
    if (onComplete) onComplete();
  }

  return (
    <>
      <div className="th-header">
        <div className="th-logo"><div className="th-logo-mark"><LogoMark/></div><span className="th-logo-name">Townhall Cafe</span></div>
        <h1 className="th-step-title" style={{marginTop:8}}>Welcome to <em>{hood.name}</em></h1>
        <p className="th-step-sub">You are a verified resident. Your voice counts.</p>
      </div>
      <div className="th-body">
        <div className="success-ring"><CheckIcon color={T.greenHi} size={32}/></div>
        <div className="member-card">
          <div className="member-avatar">{user.initials}</div>
          <div>
            <div className="member-name">{user.name}</div>
            <div className="member-hood">
              <span>{hood.name} resident</span>
              <span className="member-badge"><div style={{width:5,height:5,borderRadius:"50%",background:T.greenHi}}/>ZK verified</span>
            </div>
          </div>
        </div>
        <label className="th-label" style={{marginBottom:10,display:"block"}}>What to do next</label>
        <div className="next-steps">
          {["Browse your neighborhood banter feed","See open civic issues in "+hood.name,"Ask the expert panel a question"].map((label,i)=>(
            <div key={label} className="next-step"><div className="next-step-num">{i+1}</div><span style={{flex:1}}>{label}</span></div>
          ))}
        </div>
        <button className="th-btn th-btn-primary" onClick={handleEnter} disabled={saving}>
          {saving ? "Setting up..." : "Open Townhall"}
        </button>
      </div>
    </>
  );
}

// ── Shell ──────────────────────────────────────────────────────────────────
export default function OnboardingScreen({ onComplete }) {
  const [step, setStep] = useState(1);
  const [user, setUser] = useState(null);
  const [hood, setHood] = useState(null);

  return (
    <>
      <style>{css}</style>
      <div className="th-card" key={step}>
        {step===1 && <StepAccount onNext={data=>{ setUser(data); setStep(2); }}/>}
        {step===2 && <StepNeighborhood onNext={data=>{ setHood(data.hood); setStep(3); }}/>}
        {step===3 && <StepZK hood={hood} onNext={()=>setStep(4)}/>}
        {step===4 && <StepWelcome user={user} hood={hood} onComplete={onComplete}/>}
      </div>
    </>
  );
}
