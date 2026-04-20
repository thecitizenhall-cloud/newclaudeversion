import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { supabase } from "../lib/supabase";

// ── Coming soon gate ───────────────────────────────────────────────────────
// Set NEXT_PUBLIC_BETA_CODE in Vercel env vars to whatever password you want.
// Leave it blank/unset and the gate disappears (for when you launch).
const BETA_CODE = process.env.NEXT_PUBLIC_BETA_CODE;

const OnboardingScreen    = dynamic(() => import("../components/OnboardingScreen"),    { ssr:false, loading:() => <Loader/> });
const FeedScreen          = dynamic(() => import("../components/FeedScreen"),          { ssr:false, loading:() => <Loader/> });
const ExpertScreen        = dynamic(() => import("../components/ExpertScreen"),        { ssr:false, loading:() => <Loader/> });
const NotificationsScreen = dynamic(() => import("../components/NotificationsScreen"), { ssr:false, loading:() => <Loader/> });

const T = {
  bg:"#0F0E0C", surface:"#1A1916", border:"#2C2A26", borderHi:"#4A4640",
  cream:"#F2EDE4", creamDim:"#9A9188", creamFaint:"#4A4640",
  amber:"#D4922A", amberLo:"#2A1E08", amberMid:"#8C5E14", amberHi:"#F0B84A",
  teal:"#1D9E75", tealLo:"#0A2A1E", tealHi:"#4CAF80",
  purple:"#7F77DD", purpleLo:"#1A1835", purpleHi:"#AFA9EC",
  blue:"#378ADD", blueLo:"#0D1E35", blueHi:"#85B7EB",
};

// Icons as functions to avoid hydration mismatch
function IconFeed()   { return <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="2" width="14" height="3" rx="1.5" fill="currentColor" opacity="0.9"/><rect x="2" y="7.5" width="10" height="3" rx="1.5" fill="currentColor" opacity="0.6"/><rect x="2" y="13" width="7" height="3" rx="1.5" fill="currentColor" opacity="0.35"/></svg>; }
function IconCivic()  { return <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2L2 7v9h5v-4h4v4h5V7L9 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>; }
function IconExpert() { return <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.4"/><path d="M9 12c-3.5 0-6 1.5-6 3h12c0-1.5-2.5-3-6-3z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>; }
function IconAlerts() { return <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2.5a5.5 5.5 0 00-5.5 5.5v2.5L2 13h14l-1.5-2.5V8A5.5 5.5 0 009 2.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="M7 13a2 2 0 004 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>; }

const TABS = [
  { key:"feed",   label:"Feed",   sub:"Banter & posts",  color:T.amber,  colorLo:T.amberLo,  Icon:IconFeed   },
  { key:"civic",  label:"Civic",  sub:"Issues & votes",  color:T.blue,   colorLo:T.blueLo,   Icon:IconCivic  },
  { key:"expert", label:"Expert", sub:"Q&A panel",       color:T.purple, colorLo:T.purpleLo, Icon:IconExpert },
  { key:"alerts", label:"Alerts", sub:"Notifications",   color:T.teal,   colorLo:T.tealLo,   Icon:IconAlerts },
];

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  html, body { background:${T.bg}; color:${T.cream}; font-family:'DM Sans',sans-serif; height:100%; overflow:hidden; }
  @keyframes spin    { to{transform:rotate(360deg)} }
  @keyframes fadeUp  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn  { from{opacity:0} to{opacity:1} }

  .shell {
    display: grid;
    grid-template-columns: 200px 1fr;
    grid-template-rows: 100vh;
    height: 100vh;
    overflow: hidden;
  }
  @media(max-width:767px) {
    .shell { grid-template-columns:1fr; grid-template-rows:1fr 60px; }
  }
  .sidebar {
    background:${T.surface}; border-right:1px solid ${T.border};
    display:flex; flex-direction:column; overflow:hidden;
  }
  @media(max-width:767px) { .sidebar { display:none; } }
  .sidebar-logo {
    display:flex; align-items:center; gap:10px;
    padding:18px 18px 16px; border-bottom:1px solid ${T.border};
    font-family:'DM Serif Display',serif; font-size:17px; color:${T.cream}; flex-shrink:0;
  }
  .sidebar-logo-mark {
    width:28px; height:28px; border:1.5px solid ${T.amber}; border-radius:7px;
    display:flex; align-items:center; justify-content:center; flex-shrink:0;
  }
  .sidebar-nav { flex:1; padding:12px 10px; display:flex; flex-direction:column; gap:3px; overflow-y:auto; }
  .sidebar-item {
    display:flex; align-items:center; gap:12px; padding:10px 12px;
    border-radius:9px; cursor:pointer; transition:all 0.15s;
    border:1px solid transparent; -webkit-tap-highlight-color:transparent;
  }
  .sidebar-item:hover { background:${T.bg}; border-color:${T.border}; }
  .sidebar-item.active { background:var(--tab-color-lo); border-color:var(--tab-color)33; }
  .sidebar-item-icon {
    width:36px; height:36px; border-radius:9px; display:flex; align-items:center; justify-content:center;
    flex-shrink:0; color:${T.creamDim}; background:transparent; transition:all 0.15s;
  }
  .sidebar-item.active .sidebar-item-icon { background:var(--tab-color)22; color:var(--tab-color); }
  .sidebar-item-label { font-size:13px; font-weight:500; color:${T.creamDim}; transition:color 0.15s; line-height:1.2; }
  .sidebar-item.active .sidebar-item-label { color:var(--tab-color); }
  .sidebar-item-sub { font-size:11px; color:${T.creamDim}; margin-top:1px; opacity:0.6; }
  .sidebar-active-bar { width:3px; height:18px; border-radius:99px; background:var(--tab-color); flex-shrink:0; }
  .sidebar-footer { padding:12px 10px; border-top:1px solid ${T.border}; flex-shrink:0; }
  .sidebar-user {
    display:flex; align-items:center; gap:10px; padding:8px 10px;
    border-radius:9px; cursor:pointer; transition:all 0.15s;
  }
  .sidebar-user:hover { background:${T.bg}; }
  .sidebar-avatar {
    width:32px; height:32px; border-radius:8px; background:${T.amberLo}; border:1px solid ${T.amberMid};
    display:flex; align-items:center; justify-content:center;
    font-family:'DM Serif Display',serif; font-size:12px; color:${T.amberHi}; flex-shrink:0;
  }
  .sidebar-user-name { font-size:12px; color:${T.cream}; font-weight:500; }
  .sidebar-user-hood { font-size:10px; color:${T.creamDim}; margin-top:1px; }
  .content { overflow:hidden; display:flex; flex-direction:column; height:100vh; }
  @media(max-width:767px) { .content { height:calc(100vh - 60px); } }
  .bottom-tabs { display:none; background:${T.surface}; border-top:1px solid ${T.border}; height:60px; flex-shrink:0; }
  @media(max-width:767px) { .bottom-tabs { display:flex; } }
  .bottom-tab {
    flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px;
    cursor:pointer; border:none; background:transparent; font-family:'DM Sans',sans-serif;
    font-size:10px; color:${T.creamDim}; transition:color 0.15s; -webkit-tap-highlight-color:transparent;
    padding-bottom:env(safe-area-inset-bottom,0);
  }
  .bottom-tab.active { color:var(--tab-color); }
  .bottom-tab-dot { position:absolute; top:-2px; right:-2px; width:6px; height:6px; border-radius:50%; background:${T.amber}; border:1.5px solid ${T.surface}; }

  /* ── Coming soon gate ── */
  .gate-wrap {
    min-height:100vh; background:${T.bg};
    display:flex; align-items:center; justify-content:center; padding:24px;
  }
  .gate-card {
    background:${T.surface}; border:1px solid ${T.border}; border-radius:16px;
    width:100%; max-width:400px; padding:36px 32px;
    animation:fadeUp 0.5s ease both; text-align:center;
  }
  .gate-logo { display:flex; align-items:center; justify-content:center; gap:9px; margin-bottom:28px; font-family:'DM Serif Display',serif; font-size:18px; color:${T.cream}; }
  .gate-logo-mark { width:28px; height:28px; border:1.5px solid ${T.amber}; border-radius:7px; display:flex; align-items:center; justify-content:center; }
  .gate-title { font-family:'DM Serif Display',serif; font-size:26px; color:${T.cream}; margin-bottom:8px; }
  .gate-title em { font-style:italic; color:${T.amberHi}; }
  .gate-sub { font-size:13px; color:${T.creamDim}; line-height:1.7; margin-bottom:28px; }
  .gate-input {
    width:100%; background:${T.bg}; border:1px solid ${T.border}; border-radius:9px;
    padding:13px 16px; font-family:'DM Sans',sans-serif; font-size:15px; color:${T.cream};
    outline:none; text-align:center; letter-spacing:0.15em; transition:border-color 0.2s;
    -webkit-appearance:none; margin-bottom:12px;
  }
  .gate-input:focus { border-color:${T.amber}; }
  .gate-input::placeholder { color:${T.creamFaint}; letter-spacing:0; }
  .gate-btn {
    width:100%; background:${T.amber}; color:${T.bg}; border:none; border-radius:9px;
    padding:13px; font-family:'DM Sans',sans-serif; font-size:14px; font-weight:500;
    cursor:pointer; transition:all 0.2s;
  }
  .gate-btn:hover { background:${T.amberHi}; }
  .gate-btn:disabled { opacity:0.4; cursor:not-allowed; }
  .gate-error { font-size:12px; color:#E57373; margin-top:10px; }
  .gate-footer { font-size:11px; color:${T.creamFaint}; margin-top:20px; line-height:1.7; }
`;

function Loader() {
  return (
    <div style={{ flex:1, background:T.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ width:24, height:24, border:`2px solid ${T.border}`, borderTopColor:T.amber, borderRadius:"50%", animation:"spin 0.8s linear infinite" }}/>
    </div>
  );
}

function LogoMark() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="1" y="7" width="5" height="6" rx="1" fill={T.amber}/>
      <rect x="8" y="4" width="5" height="9" rx="1" fill={T.amber} opacity="0.6"/>
      <rect x="1" y="1" width="5" height="4" rx="1" fill={T.amber} opacity="0.4"/>
    </svg>
  );
}

function initials(name) {
  if (!name) return "?";
  const p = name.trim().split(" ");
  return p.length >= 2 ? `${p[0][0]}${p[p.length-1][0]}`.toUpperCase() : name.slice(0,2).toUpperCase();
}

// ── Coming Soon Gate ───────────────────────────────────────────────────────
function ComingSoonGate({ onUnlock }) {
  const [code,  setCode]  = useState("");
  const [error, setError] = useState("");

  function handleSubmit() {
    if (code.trim().toLowerCase() === BETA_CODE.trim().toLowerCase()) {
      // Store in sessionStorage so refresh doesn't kick them out
      sessionStorage.setItem("th_beta_unlocked", "1");
      onUnlock();
    } else {
      setError("Incorrect access code. Try again.");
      setCode("");
    }
  }

  return (
    <>
      <style>{css}</style>
      <div className="gate-wrap">
        <div className="gate-card">
          <div className="gate-logo">
            <div className="gate-logo-mark"><LogoMark/></div>
            Townhall Café
          </div>
          <div className="gate-title">Coming <em>soon</em></div>
          <div className="gate-sub">
            We&apos;re getting ready to open the doors.<br/>
            Enter your access code to get an early look.
          </div>
          <input
            className="gate-input"
            placeholder="Access code"
            value={code}
            onChange={e => { setCode(e.target.value); setError(""); }}
            onKeyDown={e => { if (e.key === "Enter") handleSubmit(); }}
            autoFocus
          />
          <button className="gate-btn" onClick={handleSubmit} disabled={!code.trim()}>
            Enter →
          </button>
          {error && <div className="gate-error">{error}</div>}
          <div className="gate-footer">
            Townhall Café is a civic engagement platform<br/>
            for your neighborhood. Launching soon in your city.
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────
export default function Home() {
  const [screen,       setScreen]       = useState("loading");
  const [user,         setUser]         = useState(null);
  const [neighborhood, setNeighborhood] = useState("Riverdale");
  const [unread,       setUnread]       = useState(0);
  const [gateOpen,     setGateOpen]     = useState(false);

  useEffect(() => {
    // Check if already unlocked this session
    if (BETA_CODE) {
      const unlocked = sessionStorage.getItem("th_beta_unlocked") === "1";
      if (!unlocked) { setGateOpen(false); setScreen("gate"); return; }
    }

    initApp();
  }, []);

  function handleGateUnlock() {
    setGateOpen(true);
    initApp();
  }

  async function initApp() {
    setScreen("loading");
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        setNeighborhood(session.user.user_metadata?.neighborhood || "Riverdale");
        setScreen("feed");
        loadUnread(session.user.id);
      } else {
        setScreen("onboarding");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
        setNeighborhood(session.user.user_metadata?.neighborhood || "Riverdale");
        setScreen("feed");
        loadUnread(session.user.id);
      } else {
        setUser(null);
        setScreen("onboarding");
      }
    });

    return () => subscription.unsubscribe();
  }

  async function loadUnread(userId) {
    const { count } = await supabase
      .from("notifications")
      .select("*", { count:"exact", head:true })
      .eq("user_id", userId)
      .eq("read", false);
    setUnread(count || 0);
  }

  async function handleSignOut() { await supabase.auth.signOut(); }

  function navigate(tab) {
    setScreen(tab);
    if (tab === "alerts") setUnread(0);
  }

  // ── Gate ──────────────────────────────────────────────────────────────
  if (screen === "gate") return <ComingSoonGate onUnlock={handleGateUnlock}/>;

  if (screen === "loading") return (
    <>
      <style>{css}</style>
      <div style={{ height:"100vh", background:T.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ width:24, height:24, border:`2px solid ${T.border}`, borderTopColor:T.amber, borderRadius:"50%", animation:"spin 0.8s linear infinite" }}/>
      </div>
    </>
  );

  if (screen === "onboarding") return (
    <>
      <style>{css}</style>
      <OnboardingScreen onComplete={() => setScreen("feed")}/>
    </>
  );

  const userInit = initials(user?.user_metadata?.display_name || user?.email || "?");

  return (
    <>
      <style>{css}</style>
      <div className="shell">

        {/* Sidebar */}
        <div className="sidebar">
          <div className="sidebar-logo">
            <div className="sidebar-logo-mark"><LogoMark/></div>
            Townhall Café
          </div>
          <nav className="sidebar-nav">
            {TABS.map(tab => {
              const active = screen === tab.key;
              return (
                <div key={tab.key}
                  className={`sidebar-item${active?" active":""}`}
                  style={{ "--tab-color":tab.color, "--tab-color-lo":tab.colorLo }}
                  onClick={() => navigate(tab.key)}>
                  <div className="sidebar-item-icon"><tab.Icon /></div>
                  <div style={{ flex:1 }}>
                    <div className="sidebar-item-label">{tab.label}</div>
                    <div className="sidebar-item-sub">{tab.sub}</div>
                  </div>
                  {tab.key==="alerts"&&unread>0&&(
                    <div style={{ background:T.amber, color:T.bg, borderRadius:99, padding:"1px 7px", fontSize:10, fontWeight:600 }}>{unread}</div>
                  )}
                  {active&&<div className="sidebar-active-bar"/>}
                </div>
              );
            })}
          </nav>
          <div className="sidebar-footer">
            <div className="sidebar-user" onClick={handleSignOut} title="Sign out">
              <div className="sidebar-avatar">{userInit}</div>
              <div>
                <div className="sidebar-user-name">{user?.user_metadata?.display_name || user?.email?.split("@")[0] || "You"}</div>
                <div className="sidebar-user-hood">{neighborhood} · tap to sign out</div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="content">
          {screen==="feed"   && <FeedScreen          onNavigate={navigate}/>}
          {screen==="civic"  && <FeedScreen          onNavigate={navigate} initialView="civic"/>}
          {screen==="expert" && <ExpertScreen        onNavigate={navigate}/>}
          {screen==="alerts" && <NotificationsScreen onNavigate={navigate}/>}
        </div>

        {/* Mobile bottom tabs */}
        <div className="bottom-tabs">
          {TABS.map(tab => {
            const active = screen === tab.key;
            return (
              <button key={tab.key}
                className={`bottom-tab${active?" active":""}`}
                style={{ "--tab-color":tab.color }}
                onClick={() => navigate(tab.key)}>
                <div style={{ position:"relative", width:22, height:22, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <div style={{ color:active?tab.color:T.creamDim, display:"flex", alignItems:"center", justifyContent:"center" }}><tab.Icon /></div>
                  {tab.key==="alerts"&&unread>0&&<div className="bottom-tab-dot"/>}
                </div>
                {tab.label}
              </button>
            );
          })}
        </div>

      </div>
    </>
  );
}
