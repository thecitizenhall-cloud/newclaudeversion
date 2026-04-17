import dynamic from "next/dynamic";
const NotificationsScreen = dynamic(() => import("../components/NotificationsScreen"), { ssr: false });
export default function Notifications() { return <NotificationsScreen />; }
