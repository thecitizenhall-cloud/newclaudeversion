import dynamic from "next/dynamic";
const ExpertScreen = dynamic(() => import("../components/ExpertScreen"), { ssr: false });
export default function Expert() { return <ExpertScreen />; }
