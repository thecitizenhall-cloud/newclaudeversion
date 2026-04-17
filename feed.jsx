import dynamic from "next/dynamic";
const FeedScreen = dynamic(() => import("../components/FeedScreen"), { ssr: false });
export default function Feed() { return <FeedScreen />; }
