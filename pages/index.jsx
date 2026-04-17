import { useState } from "react";
import dynamic from "next/dynamic";

const OnboardingScreen    = dynamic(() => import("../components/OnboardingScreen"),    { ssr: false, loading: () => <Loader /> });
const FeedScreen          = dynamic(() => import("../components/FeedScreen"),          { ssr: false, loading: () => <Loader /> });
const ExpertScreen        = dynamic(() => import("../components/ExpertScreen"),        { ssr: false, loading: () => <Loader /> });
const NotificationsScreen = dynamic(() => import("../components/NotificationsScreen"), { ssr: false, loading: () => <Loader /> });

function Loader() {
  return (
    <div style={{ minHeight:"100vh", background:"#0F0E0C", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ width:28, height:28, border:"2px solid #2C2A26", borderTopColor:"#D4922A", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function NavBar({ screen, setScreen }) {
  const items = [
    { key:"feed",          label:"Feed",          color:"#D4922A" },
    { key:"expert",        label:"Expert Q&A",    color:"#7F77DD" },
    { key:"notifications", label:"Notifications", color:"#1D9E75" },
  ];
  return (
    <div style={{ position:"fixed", bottom:0, left:0, right:0, background:"#1A1916", borderTop:"1px solid #2C2A26", display:"flex", zIndex:1000 }}>
      {items.map(item => (
        <button key={item.key} onClick={() => setScreen(item.key)} style={{
          flex:1, padding:"12px 8px 14px", background:"transparent", border:"none", cursor:"pointer",
          display:"flex", flexDirection:"column", alignItems:"center", gap:4,
          fontFamily:"'DM Sans', sans-serif", fontSize:11,
          color: screen===item.key ? item.color : "#9A9188",
          transition:"color 0.15s",
        }}>
          <div style={{ width:6, height:6, borderRadius:"50%", marginBottom:2,
            background: screen===item.key ? item.color : "transparent",
            border: `1px solid ${screen===item.key ? item.color : "#4A4640"}`,
          }} />
          {item.label}
        </button>
      ))}
    </div>
  );
}

export default function Home() {
  const [screen, setScreen] = useState("onboarding");

  if (screen === "onboarding") {
    return <OnboardingScreen onComplete={() => setScreen("feed")} />;
  }

  return (
    <>
      <div style={{ paddingBottom: 56 }}>
        {screen === "feed"          && <FeedScreen />}
        {screen === "expert"        && <ExpertScreen />}
        {screen === "notifications" && <NotificationsScreen />}
      </div>
      <NavBar screen={screen} setScreen={setScreen} />
    </>
  );
}
