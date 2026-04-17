import dynamic from "next/dynamic";

const OnboardingScreen = dynamic(
  () => import("../components/OnboardingScreen"),
  { ssr: false, loading: () => <Loader /> }
);

function Loader() {
  return (
    <div style={{ minHeight:"100vh", background:"#0F0E0C", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ width:28, height:28, border:"2px solid #2C2A26", borderTopColor:"#D4922A", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function Home() {
  return <OnboardingScreen />;
}
