import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { supabase } from "../lib/supabase";

const BETA_CODE = process.env.NEXT_PUBLIC_BETA_CODE;

// All screens loaded client-side only — ssr:false prevents any server render
const OnboardingScreen    = dynamic(() => import("../components/OnboardingScreen"),    { ssr:false });
const FeedScreen          = dynamic(() => import("../components/FeedScreen"),          { ssr:false });
const ExpertScreen        = dynamic(() => import("../components/ExpertScreen"),        { ssr:false });
const NotificationsScreen = dynamic(() => import("../components/NotificationsScreen"), { ssr:false });
const ProfileScreen       = dynamic(() => import("../components/ProfileScreen"),       { ssr:false });

// Spinner uses no browser APIs — safe to render on server and client identically
function Spinner() {
  return (
    <div style={{
      height:"100vh", background:"#0F0E0C",
      display:"flex", alignItems:"center", justifyContent:"center",
    }}>
      <div style={{
        width:24, height:24,
        border:"2px solid #2C2A26",
        borderTopColor:"#D4922A",
        borderRadius:"50%",
        animation:"spin 0.8s linear infinite",
      }}/>
    </div>
  );
}

function GatePage({ onUnlock }) {
  const [code,  setCode]  = useState("");
  const [error, setError] = useState("");

  function submit() {
    if (BETA_CODE && code.trim().toLowerCase() === BETA_CODE.trim().toLowerCase()) {
      try { sessionStorage.setItem("th_unlocked","1"); } catch(e) {}
      onUnlock();
    } else {
      setError("Incorrect code.");
      setCode("");
    }
  }

  return (
    <div style={{ minHeight:"100vh", background:"#0F0E0C", display:"flex", alignItems:"center", justifyContent:"center", padding:24, fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ background:"#1A1916", border:"1px solid #2C2A26", borderRadius:16, width:"100%", maxWidth:400, padding:"36px 32px", textAlign:"center" }}>
        <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:28, color:"#F2EDE4", marginBottom:8 }}>Townhall Café</div>
        <div style={{ fontSize:13, color:"#9A9188", marginBottom:28, lineHeight:1.7 }}>
          We&apos;re getting ready.<br/>Enter your access code for an early look.
        </div>
        <input
          placeholder="Access code"
          value={code}
          onChange={e => { setCode(e.target.value); setError(""); }}
          onKeyDown={e => e.key === "Enter" && submit()}
          autoFocus
          style={{ width:"100%", background:"#0F0E0C", border:"1px solid #2C2A26", borderRadius:9, padding:"13px 16px", fontFamily:"'DM Sans',sans-serif", fontSize:15, color:"#F2EDE4", outline:"none", textAlign:"center", letterSpacing:"0.15em", marginBottom:12 }}
        />
        <button onClick={submit} disabled={!code.trim()}
          style={{ width:"100%", background:"#D4922A", color:"#0F0E0C", border:"none", borderRadius:9, padding:13, fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:500, cursor:"pointer" }}>
          Enter →
        </button>
        {error && <div style={{ fontSize:12, color:"#E57373", marginTop:10 }}>{error}</div>}
      </div>
    </div>
  );
}

function Sidebar({ screen, navigate, userInit, neighborhood, onSignOut }) {
  const tabs = [
    { key:"feed",   label:"Feed",   sub:"Banter & posts",  color:"#D4922A" },
    { key:"civic",  label:"Civic",  sub:"Issues & votes",  color:"#378ADD" },
    { key:"expert", label:"Expert", sub:"Q&A panel",       color:"#7F77DD" },
    { key:"alerts",   label:"Alerts",   sub:"Notifications",   color:"#1D9E75" },
    { key:"profile",  label:"Profile",  sub:"Account & trust", color:"#D4922A" },
  ];
  return (
    <div style={{ background:"#1A1916", borderRight:"1px solid #2C2A26", display:"flex", flexDirection:"column", height:"100vh", overflow:"hidden" }}>
      <div style={{ padding:"18px 18px 16px", borderBottom:"1px solid #2C2A26", fontFamily:"'DM Serif Display',serif", fontSize:17, color:"#F2EDE4", display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
        <div style={{ width:28, height:28, border:"1.5px solid #D4922A", borderRadius:7, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="7" width="5" height="6" rx="1" fill="#D4922A"/>
            <rect x="8" y="4" width="5" height="9" rx="1" fill="#D4922A" opacity="0.6"/>
            <rect x="1" y="1" width="5" height="4" rx="1" fill="#D4922A" opacity="0.4"/>
          </svg>
        </div>
        Townhall Café
      </div>
      <nav style={{ flex:1, padding:"12px 10px", display:"flex", flexDirection:"column", gap:3, overflowY:"auto" }}>
        {tabs.map(tab => {
          const active = screen === tab.key;
          return (
            <div key={tab.key} onClick={() => navigate(tab.key)} style={{
              display:"flex", alignItems:"center", gap:12, padding:"10px 12px",
              borderRadius:9, cursor:"pointer",
              border:`1px solid ${active ? tab.color+"33" : "transparent"}`,
              background: active ? tab.color+"18" : "transparent",
            }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:500, color: active ? tab.color : "#9A9188" }}>{tab.label}</div>
                <div style={{ fontSize:11, color:"#9A9188", marginTop:1, opacity:0.7 }}>{tab.sub}</div>
              </div>
              {active && <div style={{ width:3, height:18, borderRadius:99, background:tab.color, flexShrink:0 }}/>}
            </div>
          );
        })}
      </nav>
      <div style={{ padding:"12px 10px", borderTop:"1px solid #2C2A26", flexShrink:0 }}>
        <div onClick={() => navigate("profile")} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px", borderRadius:9, cursor:"pointer" }}>
          <div style={{ width:32, height:32, borderRadius:8, background:"#2A1E08", border:"1px solid #8C5E14", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Serif Display',serif", fontSize:12, color:"#F0B84A", flexShrink:0 }}>
            {userInit}
          </div>
          <div>
            <div style={{ fontSize:12, color:"#F2EDE4", fontWeight:500 }}>{neighborhood}</div>
            <div style={{ fontSize:10, color:"#9A9188", marginTop:1 }}>Tap to view profile</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BottomTabs({ screen, navigate }) {
  const tabs = [
    { key:"feed",   label:"Feed",   color:"#D4922A" },
    { key:"civic",  label:"Civic",  color:"#378ADD" },
    { key:"expert", label:"Expert", color:"#7F77DD" },
    { key:"alerts",   label:"Alerts",   color:"#1D9E75" },
    { key:"profile",  label:"Profile",  color:"#D4922A" },
  ];
  return (
    <div style={{ display:"flex", background:"#1A1916", borderTop:"1px solid #2C2A26", height:60, flexShrink:0 }}>
      {tabs.map(tab => {
        const active = screen === tab.key;
        return (
          <button key={tab.key} onClick={() => navigate(tab.key)} style={{
            flex:1, display:"flex", flexDirection:"column", alignItems:"center",
            justifyContent:"center", gap:3, cursor:"pointer", border:"none",
            background:"transparent", fontFamily:"'DM Sans',sans-serif",
            fontSize:10, color: active ? tab.color : "#9A9188", transition:"color 0.15s",
          }}>
            <div style={{ width:6, height:6, borderRadius:"50%", marginBottom:2, background: active ? tab.color : "transparent", border:`1px solid ${active ? tab.color : "#4A4640"}` }}/>
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function initials(name) {
  if (!name || name === "undefined" || name === "null") return "?";
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const p = trimmed.split(" ").filter(Boolean);
  return p.length >= 2 ? `${p[0][0]}${p[p.length-1][0]}`.toUpperCase() : trimmed.slice(0,2).toUpperCase();
}

export default function Home() {
  // mounted gate — server always renders Spinner, client decides everything after mount
  const [mounted,      setMounted]      = useState(false);
  const [screen,       setScreen]       = useState("loading");
  const [user,         setUser]         = useState(null);
  const [neighborhood, setNeighborhood] = useState("Riverdale");
  const [isMobile,     setIsMobile]     = useState(false);
  const [authError,    setAuthError]    = useState(null);

  useEffect(() => {
    // Step 1: mark as mounted — from this point all browser APIs are safe
    setMounted(true);

    // Step 2: mobile detection
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);

    // Step 3: beta gate — check sessionStorage
    if (BETA_CODE) {
      let unlocked = false;
      try { unlocked = sessionStorage.getItem("th_unlocked") === "1"; } catch(e) {}
      if (!unlocked) {
        setScreen("gate");
        return () => window.removeEventListener("resize", checkMobile);
      }
    }

    // Step 4: auth check
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("Auth error:", error);
        setAuthError(error.message);
        setScreen("error");
        return;
      }
      if (session) {
        setUser(session.user);
        setNeighborhood(session.user.user_metadata?.neighborhood || "Riverdale");
        setScreen("feed");
      } else {
        setScreen("onboarding");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) {
        setUser(session.user);
        setNeighborhood(session.user.user_metadata?.neighborhood || "Riverdale");
        setScreen("feed");
      } else {
        setUser(null);
        setScreen("onboarding");
      }
    });

    return () => {
      window.removeEventListener("resize", checkMobile);
      subscription.unsubscribe();
    };
  }, []);

  function navigate(tab) { setScreen(tab); }
  async function handleSignOut() { await supabase.auth.signOut(); }

  function handleGateUnlock() {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("Auth error:", error);
        setAuthError(error.message);
        setScreen("error");
        return;
      }
      if (session) {
        setUser(session.user);
        setNeighborhood(session.user.user_metadata?.neighborhood || "Riverdale");
        setScreen("feed");
      } else {
        setScreen("onboarding");
      }
    });
  }

  // Server always renders Spinner — no hydration mismatch possible
  if (!mounted)              return <Spinner />;

  // All decisions below are client-only
  if (screen === "loading")  return <Spinner />;
  if (screen === "error") return (
    <div style={{ height:"100vh", background:"#0F0E0C", display:"flex", alignItems:"center", justifyContent:"center", padding:24, fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ background:"#1A1916", border:"1px solid #2C2A26", borderRadius:16, width:"100%", maxWidth:400, padding:"32px", textAlign:"center" }}>
        <div style={{ fontSize:32, marginBottom:16 }}>⚠️</div>
        <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:20, color:"#F2EDE4", marginBottom:8 }}>Something went wrong</div>
        <div style={{ fontSize:13, color:"#9A9188", lineHeight:1.7, marginBottom:20 }}>
          We couldn&apos;t connect to the server. This is usually temporary — check your connection and try again.
        </div>
        <button onClick={() => { setAuthError(null); setScreen("loading"); window.location.reload(); }}
          style={{ width:"100%", background:"#D4922A", color:"#0F0E0C", border:"none", borderRadius:9, padding:12, fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:500, cursor:"pointer" }}>
          Retry
        </button>
        {authError && <div style={{ fontSize:11, color:"#4A4640", marginTop:12 }}>{authError}</div>}
      </div>
    </div>
  );
  if (screen === "gate")     return <GatePage onUnlock={handleGateUnlock} />;
  if (screen === "onboarding") return <OnboardingScreen onComplete={() => setScreen("feed")} />;

  const rawName = user?.user_metadata?.display_name;
  const userInit = initials(
    rawName && rawName !== "undefined" ? rawName : (user?.email || "?")
  );

  const content = (
    <>
      {screen === "feed"   && <FeedScreen          onNavigate={navigate}/>}
      {screen === "civic"  && <FeedScreen          onNavigate={navigate} initialView="civic"/>}
      {screen === "expert" && <ExpertScreen        onNavigate={navigate}/>}
      {screen === "alerts"  && <NotificationsScreen onNavigate={navigate}/>}
      {screen === "profile" && <ProfileScreen onNavigate={navigate} onSignOut={handleSignOut}/>}
    </>
  );

  if (isMobile) {
    return (
      <div style={{ display:"flex", flexDirection:"column", height:"100vh", overflow:"hidden" }}>
        <div style={{ flex:1, overflow:"hidden" }}>{content}</div>
        <BottomTabs screen={screen} navigate={navigate}/>
      </div>
    );
  }

  return (
    <div style={{ display:"grid", gridTemplateColumns:"200px 1fr", height:"100vh", overflow:"hidden" }}>
      <Sidebar screen={screen} navigate={navigate} userInit={userInit} neighborhood={neighborhood} onSignOut={handleSignOut}/>
      <div style={{ overflow:"hidden", display:"flex", flexDirection:"column", height:"100vh" }}>
        {content}
      </div>
    </div>
  );
}
