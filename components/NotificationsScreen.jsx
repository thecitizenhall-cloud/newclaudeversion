"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import ApplyOfficial from "./ApplyOfficial";

function useCSS(id, css) {
  if (typeof window === "undefined") return;
  let el = document.getElementById(id);
  if (!el) { el = document.createElement("style"); el.id = id; document.head.appendChild(el); }
  el.textContent = css;
}

const T = {
  bg:"#0F0E0C", surface:"#1A1916", surfaceHi:"#222019",
  border:"#2C2A26", borderHi:"#4A4640",
  cream:"#F2EDE4", creamDim:"#9A9188", creamFaint:"#3A3830",
  amber:"#D4922A", amberLo:"#2A1E08", amberMid:"#8C5E14", amberHi:"#F0B84A",
  teal:"#1D9E75", tealLo:"#0A2A1E", tealHi:"#4CAF80",
  blue:"#378ADD", blueLo:"#0D1E35", blueHi:"#85B7EB",
  purple:"#7F77DD", purpleLo:"#1A1835", purpleHi:"#AFA9EC", purpleMid:"#534AB7",
  coral:"#D85A30", coralHi:"#F0997B",
  green:"#2D6A4F", greenHi:"#52C48A",
  red:"#C0392B", redLo:"#2A0E0A", redHi:"#E57373",
};

const HEAT = [T.amber, T.coral, T.blue, T.purple, T.teal, T.green, T.amberHi, T.blueHi];

const NOTIF_PREFS = [
  { id:"expert",    icon:"*", iconBg:T.purpleLo, iconColor:T.purpleHi, label:"Expert answers",     desc:"When an expert answers your question" },
  { id:"official",  icon:"@", iconBg:T.tealLo,   iconColor:T.tealHi,   label:"Official responses", desc:"When an official responds to a city issue" },
  { id:"escalated", icon:"^", iconBg:T.blueLo,   iconColor:T.blueHi,   label:"Issue escalations",  desc:"When a post you upvoted becomes a civic issue" },
  { id:"trust",     icon:"+", iconBg:T.amberLo,  iconColor:T.amberHi,  label:"Trust milestones",   desc:"When you reach a new reputation tier" },
  { id:"rollup",    icon:"~", iconBg:T.surface,  iconColor:T.creamDim, label:"City-wide rollup",   desc:"When an issue enters the city tracker" },
];

function timeAgo(d) {
  if (!d) return "";
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return Math.floor(s / 60) + "m ago";
  if (s < 86400) return Math.floor(s / 3600) + "h ago";
  return Math.floor(s / 86400) + "d ago";
}

function CheckIcon({ color, size = 12 }) {
  return <svg width={size} height={size} viewBox="0 0 12 12" fill="none"><path d="M2 6l2.5 2.5L10 3" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

const css = `
  @keyframes fadeUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes slideUp { from{opacity:0;transform:translateY(100%)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin    { to{transform:rotate(360deg)} }
  @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.35} }
  @keyframes barGrow { from{width:0} to{width:var(--w)} }
  .ns-wrap { height:100%; overflow-y:auto; background:#0F0E0C; display:flex; flex-direction:column; }
  .ns-tabs { display:flex; border-bottom:1px solid #2C2A26; background:#0F0E0C; position:sticky; top:0; z-index:9; flex-shrink:0; }
  .ns-tab  { padding:11px 20px; font-size:13px; color:#9A9188; cursor:pointer; border-bottom:2px solid transparent; transition:all 0.15s; white-space:nowrap; }
  .ns-tab:hover { color:#F2EDE4; }
  .ns-tab.active { color:#4CAF80; border-bottom-color:#1D9E75; }
  .ns-header { padding:16px 22px 14px; border-bottom:1px solid #2C2A26; display:flex; align-items:flex-start; justify-content:space-between; gap:12px; flex-shrink:0; }
  .ns-title { font-family:"DM Serif Display",serif; font-size:20px; color:#F2EDE4; }
  .ns-title em { font-style:italic; color:#4CAF80; }
  .ns-sub   { font-size:12px; color:#9A9188; margin-top:2px; }
  .mark-all-btn { background:transparent; border:1px solid #2C2A26; border-radius:7px; padding:5px 12px; font-family:"DM Sans",sans-serif; font-size:12px; color:#9A9188; cursor:pointer; white-space:nowrap; flex-shrink:0; }
  .mark-all-btn:hover { color:#F2EDE4; border-color:#4A4640; }
  .digest-bar { padding:10px 22px; border-bottom:1px solid #2C2A26; background:#1A1916; display:flex; align-items:center; gap:12px; flex-wrap:wrap; flex-shrink:0; }
  .digest-chip { padding:4px 12px; border-radius:99px; font-size:11px; cursor:pointer; border:1px solid #2C2A26; color:#9A9188; transition:all 0.15s; }
  .digest-chip.sel { background:#0A2A1E; border-color:#1D9E75; color:#4CAF80; }
  .push-toggle { margin-left:auto; display:flex; align-items:center; gap:8px; font-size:12px; color:#9A9188; }
  .toggle-track { position:relative; width:32px; height:18px; background:#2C2A26; border-radius:9px; cursor:pointer; flex-shrink:0; transition:background 0.2s; }
  .toggle-track.on { background:#1D9E75; }
  .toggle-thumb { position:absolute; top:2px; left:2px; width:14px; height:14px; border-radius:50%; background:#F2EDE4; transition:transform 0.2s; }
  .toggle-track.on .toggle-thumb { transform:translateX(14px); }
  .notif-group-label { padding:8px 22px 4px; font-size:10px; font-weight:500; color:#3A3830; text-transform:uppercase; letter-spacing:0.1em; }
  .notif-item { display:flex; align-items:flex-start; gap:12px; padding:13px 22px; border-bottom:1px solid #2C2A26; cursor:pointer; transition:background 0.15s; animation:fadeUp 0.3s ease both; position:relative; }
  .notif-item:hover { background:#22201944; }
  .notif-item.unread::before { content:""; position:absolute; left:10px; top:50%; transform:translateY(-50%); width:5px; height:5px; border-radius:50%; background:#D4922A; }
  .notif-icon { width:36px; height:36px; border-radius:10px; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:14px; }
  .notif-text { font-size:13px; color:#9A9188; line-height:1.5; }
  .notif-text strong { color:#F2EDE4; }
  .notif-time { font-size:11px; color:#3A3830; margin-top:3px; }
  .city-grid { padding:14px 22px; display:grid; grid-template-columns:repeat(4,1fr); gap:8px; border-bottom:1px solid #2C2A26; }
  .hood-tile { background:#1A1916; border:1px solid #2C2A26; border-radius:10px; padding:12px 10px; cursor:pointer; transition:all 0.2s; position:relative; overflow:hidden; animation:fadeUp 0.3s ease both; }
  .hood-tile:hover { border-color:#4A4640; }
  .hood-tile.active-hood { border-color:#378ADD; background:#0D1E35; }
  .hood-tile-heat { position:absolute; inset:0; border-radius:9px; opacity:0.08; pointer-events:none; }
  .hood-tile-name { font-size:12px; font-weight:500; color:#F2EDE4; margin-bottom:4px; }
  .hood-tile-issues { font-size:11px; color:#9A9188; }
  .hood-tile-bar { height:3px; border-radius:99px; background:#2C2A26; margin-top:8px; overflow:hidden; }
  .hood-tile-fill { height:100%; border-radius:99px; animation:barGrow 0.8s ease both; }
  .city-issue { background:#1A1916; border:1px solid #2C2A26; border-radius:12px; margin-bottom:10px; overflow:hidden; animation:fadeUp 0.3s ease both; cursor:pointer; }
  .city-issue:hover { border-color:#4A4640; }
  .city-issue.responded { border-color:#1D9E7544; }
  .city-issue-top { padding:14px 16px 10px; display:flex; align-items:flex-start; gap:10px; }
  .city-issue-rank { width:26px; height:26px; border-radius:7px; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:500; background:#0D1E35; color:#85B7EB; border:1px solid #378ADD44; }
  .city-issue-title { font-size:14px; font-weight:500; color:#F2EDE4; line-height:1.4; }
  .city-issue-meta { display:flex; align-items:center; gap:8px; flex-wrap:wrap; padding:0 16px 10px; }
  .hood-chip { padding:2px 8px; border-radius:99px; font-size:10px; font-weight:500; }
  .city-bar-row { padding:0 16px; margin-bottom:10px; display:flex; align-items:center; gap:10px; }
  .city-bar-bg { flex:1; height:5px; border-radius:99px; background:#2C2A26; overflow:hidden; }
  .city-bar-fill { height:100%; border-radius:99px; animation:barGrow 0.9s ease both; }
  .awaiting-resp { border-top:1px solid #2C2A26; padding:10px 16px; display:flex; align-items:center; gap:8px; font-size:11px; color:#3A3830; }
  .pulse-dot { width:6px; height:6px; border-radius:50%; background:#F0B84A; animation:pulse 1.4s ease infinite; flex-shrink:0; }
  .pref-row { display:flex; align-items:center; gap:10px; padding:10px 12px; background:#0F0E0C; border:1px solid #2C2A26; border-radius:8px; margin-bottom:6px; cursor:pointer; transition:border-color 0.15s; }
  .pref-row:hover { border-color:#4A4640; }
  .pref-icon { width:28px; height:28px; border-radius:7px; flex-shrink:0; display:flex; align-items:center; justify-content:center; }
  .pref-label { font-size:13px; color:#F2EDE4; }
  .pref-desc  { font-size:11px; color:#9A9188; margin-top:1px; }
  .sheet-backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.65); z-index:100; }
  .sheet-panel { position:fixed; left:0; right:0; bottom:0; background:#1A1916; border-radius:16px 16px 0 0; border-top:1px solid #2C2A26; max-height:90vh; overflow-y:auto; z-index:101; animation:slideUp 0.3s ease; }
  .sheet-handle { width:36px; height:4px; border-radius:99px; background:#2C2A26; margin:12px auto 0; }
  .th-empty { text-align:center; padding:40px 20px; color:#4A4640; font-size:13px; line-height:1.8; }
  .th-loading { display:flex; align-items:center; justify-content:center; gap:10px; padding:40px 20px; color:#9A9188; font-size:13px; }
  .th-spinner { width:16px; height:16px; border:2px solid #2C2A26; border-top-color:#D4922A; border-radius:50%; animation:spin 0.8s linear infinite; }
  .th-toast { position:fixed; bottom:80px; left:50%; transform:translateX(-50%); background:#1A1916; border:1px solid #2C2A26; border-radius:10px; padding:9px 18px; font-size:13px; color:#F2EDE4; display:flex; align-items:center; gap:8px; z-index:200; white-space:nowrap; max-width:90vw; }
  @media(max-width:767px){ .th-toast{bottom:90px;} .city-grid{grid-template-columns:repeat(2,1fr);} .notif-item{padding:12px 16px;} .ns-header{padding:14px 16px;} }
  ::-webkit-scrollbar{width:3px;} ::-webkit-scrollbar-track{background:transparent;} ::-webkit-scrollbar-thumb{background:#2C2A26;border-radius:99px;}
`;

function CityIssueCard({ issue, idx }) {
  const [expanded, setExpanded] = useState(issue.status === "responded" && idx === 0);
  const hoodColors = [T.amber, T.blue, T.purple, T.teal, T.coral];
  return (
    <div className={"city-issue" + (issue.status === "responded" ? " responded" : "")}
      onClick={() => setExpanded(e => !e)} style={{ animationDelay: idx * 0.06 + "s" }}>
      <div className="city-issue-top">
        <div className="city-issue-rank">#{issue.rank}</div>
        <div style={{flex:1}}>
          <div className="city-issue-title">{issue.title}</div>
          {issue.createdAt && <div style={{fontSize:10,color:T.creamFaint,marginTop:3}}>{timeAgo(issue.createdAt)}</div>}
        </div>
      </div>
      <div className="city-issue-meta">
        {(issue.hoods || []).map((h, i) => (
          <span key={h} className="hood-chip"
            style={{ background: hoodColors[i % hoodColors.length] + "22", color: hoodColors[i % hoodColors.length], border: "1px solid " + hoodColors[i % hoodColors.length] + "44" }}>
            {h}
          </span>
        ))}
        <span style={{ marginLeft: "auto", fontSize: 11, color: T.creamDim }}>{(issue.totalVoices || 0).toLocaleString()} voices</span>
      </div>
      <div className="city-bar-row">
        <div className="city-bar-bg">
          <div className="city-bar-fill" style={{ "--w": issue.pct + "%", width: issue.pct + "%", background: issue.pct > 75 ? T.coral : issue.pct > 50 ? T.amber : T.blue }} />
        </div>
        <span style={{ fontSize: 11, color: T.creamDim, whiteSpace: "nowrap" }}>{issue.pct || 0}% priority</span>
      </div>
      {issue.status === "responded" && expanded && issue.official && (
        <div style={{ borderTop: "1px solid " + T.border, padding: "12px 16px", background: T.tealLo, display: "flex", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 500, background: T.teal + "33", color: T.tealHi, border: "1px solid " + T.teal + "44" }}>
            {issue.official.initials}
          </div>
          <div>
            <div style={{ fontSize: 12, color: T.tealHi, fontWeight: 500 }}>{issue.official.name}</div>
            <div style={{ fontSize: 10, color: T.tealHi, opacity: 0.7 }}>{issue.official.role}</div>
            <div style={{ fontSize: 12, color: T.creamDim, lineHeight: 1.6, marginTop: 4 }}>{issue.response}</div>
          </div>
        </div>
      )}
      {issue.status === "awaiting" && (
        <div className="awaiting-resp"><div className="pulse-dot" />Awaiting official response</div>
      )}
    </div>
  );
}

export default function NotificationsScreen({ onNavigate }) {
  useCSS("ns-css", css);
  const [tab,               setTab]               = useState("notifications");
  const [notifs,            setNotifs]            = useState([]);
  const [cityIssues,        setCityIssues]        = useState([]);
  const [hoods,             setHoods]             = useState([]);
  const [loadingNotifs,     setLoadingNotifs]     = useState(true);
  const [loadingRollup,     setLoadingRollup]     = useState(true);
  const [prefs,             setPrefs]             = useState({ expert: true, official: true, escalated: true, trust: false, rollup: false });
  const [push,              setPush]              = useState(true);
  const [digest,            setDigest]            = useState("realtime");
  const [activeHood,        setActiveHood]        = useState(null);
  const [toast,             setToast]             = useState(null);
  const [currentUser,       setCurrentUser]       = useState(null);
  const [showOfficial,      setShowOfficial]      = useState(false);
  const [officialAppStatus, setOfficialAppStatus] = useState(null);
  const toastTimer = useRef(null);
  const channelRef = useRef(null);

  function showToast(msg, dot = T.amberHi) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, dot });
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }

  useEffect(() => {
    async function init() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUser(user);
          const { data: prof } = await supabase.from("profiles")
            .select("notification_prefs").eq("id", user.id).maybeSingle();
          if (prof?.notification_prefs) {
            const p = prof.notification_prefs;
            setPrefs({ expert: p.expert ?? true, official: p.official ?? true, escalated: p.escalated ?? true, trust: p.trust ?? false, rollup: p.rollup ?? false });
            if (p.push !== undefined) setPush(p.push);
            if (p.digest !== undefined) setDigest(p.digest);
          }
          const { data: app } = await supabase.from("official_applications")
            .select("status").eq("user_id", user.id).maybeSingle();
          if (app) setOfficialAppStatus(app.status);
        }
        await loadNotifs();
        await loadCityIssues();
      } catch (e) {
        console.error("NotificationsScreen init error:", e);
        setLoadingNotifs(false);
        setLoadingRollup(false);
      }
    }
    init();

    channelRef.current = supabase.channel("notifs-rt")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, (payload) => {
        setNotifs(prev => [formatNotif(payload.new), ...prev]);
      }).subscribe();

    return () => { if (channelRef.current) channelRef.current.unsubscribe(); };
  }, []);

  function formatNotif(n) {
    const iconMap = {
      expert_answer:     { icon: "*", iconBg: T.purpleLo, iconColor: T.purpleHi },
      official_response: { icon: "@", iconBg: T.tealLo,   iconColor: T.tealHi },
      escalation:        { icon: "^", iconBg: T.blueLo,   iconColor: T.blueHi },
      trust_milestone:   { icon: "+", iconBg: T.amberLo,  iconColor: T.amberHi },
      city_wide:         { icon: "~", iconBg: T.surface,  iconColor: T.creamDim },
      upvote:            { icon: "+", iconBg: T.amberLo,  iconColor: T.amberHi },
    };
    const style = iconMap[n.type] || iconMap.upvote;
    const textMap = {
      expert_answer:     "An expert answered your question",
      official_response: "An official responded to a civic issue",
      escalation:        "A post you upvoted was escalated",
      trust_milestone:   "You reached a new trust tier: <strong>" + (n.payload?.new_tier || "") + "</strong>",
      city_wide:         "An issue entered the city-wide tracker",
      upvote:            "Your post received new upvotes",
    };
    return { ...n, ...style, text: textMap[n.type] || "New notification" };
  }

  async function loadNotifs() {
    setLoadingNotifs(true);
    try {
      const { data, error } = await supabase.from("notifications")
        .select("*").order("created_at", { ascending: false }).limit(40);
      if (error) throw error;
      setNotifs((data || []).map(formatNotif));
    } catch (e) {
      console.error("loadNotifs error:", e);
      // Show empty state rather than infinite spinner on error
    } finally {
      setLoadingNotifs(false);
    }
  }

  async function loadCityIssues() {
    setLoadingRollup(true);
    try {
      const { data: issues } = await supabase.from("civic_issues")
        .select("id,title,voice_count,priority_pct,status,neighborhood_id,neighborhoods(name)")
        .neq("status", "resolved").order("priority_pct", { ascending: false }).limit(20);

      const { data: hoodsData } = await supabase.from("neighborhoods")
        .select("id,name").order("name");

      const issueCounts = {};
      (issues || []).forEach(iss => { if (iss.neighborhood_id) issueCounts[iss.neighborhood_id] = (issueCounts[iss.neighborhood_id] || 0) + 1; });

      setHoods((hoodsData || []).map((h, i) => ({
        id: h.id, name: h.name,
        issues: issueCounts[h.id] || 0,
        heat: HEAT[i % HEAT.length],
        pct: Math.min(99, (issueCounts[h.id] || 0) * 10),
      })));

      setCityIssues((issues || []).map((iss, i) => ({
        id: iss.id, rank: i + 1, title: iss.title,
        hoods: iss.neighborhoods ? [iss.neighborhoods.name] : [],
        totalVoices: iss.voice_count || 0,
        pct: iss.priority_pct || 0,
        status: iss.status === "escalated" ? "awaiting" : iss.status,
        createdAt: iss.created_at,
        official: null, response: null,
      })));
    } catch (e) { console.error("loadCityIssues error:", e); }
    finally { setLoadingRollup(false); }
  }

  async function markRead(id) {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }

  async function markAll() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    showToast("All marked as read", T.tealHi);
  }

  async function togglePref(id) {
    const newPrefs = { ...prefs, [id]: !prefs[id] };
    setPrefs(newPrefs);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await supabase.from("profiles").update({ notification_prefs: { ...newPrefs, push, digest } }).eq("id", user.id);
    showToast(NOTIF_PREFS.find(p => p.id === id)?.label + " " + (prefs[id] ? "off" : "on"), T.tealHi);
  }

  const unreadCount = notifs.filter(n => !n.read).length;
  const filteredIssues = activeHood
    ? cityIssues.filter(i => (i.hoods || []).some(h => h.toLowerCase().includes(activeHood.toLowerCase())))
    : cityIssues;

  function getGroup(dateStr) {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 86400000);
    if (diff < 1) return "today";
    if (diff < 2) return "yesterday";
    return "earlier";
  }

  return (
    <div className="ns-wrap">
      {/* ── Tabs ── */}
      <div className="ns-tabs">
        <div className={"ns-tab" + (tab === "notifications" ? " active" : "")} onClick={() => setTab("notifications")}>
          Notifications
          {unreadCount > 0 && (
            <span style={{ marginLeft: 6, background: T.amberLo, color: T.amberHi, border: "1px solid " + T.amberMid, borderRadius: 99, padding: "0 6px", fontSize: 10 }}>
              {unreadCount}
            </span>
          )}
        </div>
        <div className={"ns-tab" + (tab === "rollup" ? " active" : "")} onClick={() => setTab("rollup")}>
          City-wide
          {cityIssues.length > 0 && (
            <span style={{ marginLeft: 6, background: T.tealLo, color: T.tealHi, border: "1px solid " + T.teal + "44", borderRadius: 99, padding: "0 6px", fontSize: 10 }}>
              {cityIssues.length}
            </span>
          )}
        </div>
        <div className={"ns-tab" + (tab === "settings" ? " active" : "")} onClick={() => setTab("settings")}>Settings</div>
      </div>

      {/* ── Notifications tab ── */}
      {tab === "notifications" && (
        <>
          <div className="ns-header">
            <div>
              <div className="ns-title">Your <em>notifications</em></div>
              <div className="ns-sub">{unreadCount > 0 ? unreadCount + " unread" : "All caught up"}</div>
            </div>
            {unreadCount > 0 && <button className="mark-all-btn" onClick={markAll}>Mark all read</button>}
          </div>
          <div className="digest-bar">
            <span style={{ fontSize: 12, color: T.creamDim }}>Digest <span style={{fontSize:10,color:T.creamFaint}}>(coming soon)</span></span>
            <div style={{ display: "flex", gap: 6 }}>
              {["realtime", "daily", "weekly"].map(d => (
                <div key={d} className={"digest-chip" + (digest === d ? " sel" : "")} onClick={() => setDigest(d)}>
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </div>
              ))}
            </div>
            <div className="push-toggle">
              Push
              <div className={"toggle-track" + (push ? " on" : "")} onClick={() => setPush(!push)}>
                <div className="toggle-thumb" />
              </div>
            </div>
          </div>

          {loadingNotifs && <div className="th-loading"><div className="th-spinner" />Loading notifications...</div>}
          {!loadingNotifs && notifs.length === 0 && (
            <div className="th-empty">
              No notifications yet.<br />
              <span style={{fontSize:12,color:T.creamFaint,display:"block",marginTop:4,marginBottom:16}}>
                Post something, upvote a civic issue, or ask an expert question to start getting notified.
              </span>
              <button onClick={()=>onNavigate&&onNavigate("feed")}
                style={{background:T.amberLo,border:`1px solid ${T.amberMid}`,borderRadius:8,padding:"8px 18px",
                  fontSize:12,color:T.amberHi,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
                Go to feed →
              </button>
            </div>
          )}
          {!loadingNotifs && ["today", "yesterday", "earlier"].map(group => {
            const items = notifs.filter(n => getGroup(n.created_at) === group);
            if (!items.length) return null;
            return (
              <div key={group}>
                <div className="notif-group-label">{group.charAt(0).toUpperCase() + group.slice(1)}</div>
                {items.map((n, i) => (
                  <div key={n.id} className={"notif-item" + (n.read ? "" : " unread")}
                    style={{ animationDelay: i * 0.04 + "s" }} onClick={() => markRead(n.id)}>
                    <div className="notif-icon" style={{ background: n.iconBg, color: n.iconColor }}>{n.icon}</div>
                    <div>
                      <div className="notif-text" dangerouslySetInnerHTML={{ __html: n.text }} />
                      <div className="notif-time">{timeAgo(n.created_at)}</div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </>
      )}

      {/* ── City rollup tab ── */}
      {tab === "rollup" && (
        <>
          <div className="ns-header">
            <div>
              <div className="ns-title">City-wide <em>rollup</em></div>
              <div className="ns-sub">{hoods.length} neighborhoods · {cityIssues.length} active issues</div>
            </div>
          </div>

          {loadingRollup && <div className="th-loading"><div className="th-spinner" />Loading city data...</div>}

          {!loadingRollup && (
            <>
              <div className="city-grid">
                {hoods.map((h, i) => (
                  <div key={h.id}
                    className={"hood-tile" + (activeHood === h.name ? " active-hood" : "")}
                    style={{ animationDelay: i * 0.04 + "s" }}
                    onClick={() => setActiveHood(activeHood === h.name ? null : h.name)}>
                    <div className="hood-tile-heat" style={{ background: h.heat }} />
                    <div className="hood-tile-name">{h.name}</div>
                    <div className="hood-tile-issues">{h.issues > 0 ? h.issues + " issues" : "No issues"}</div>
                    <div className="hood-tile-bar">
                      <div className="hood-tile-fill" style={{ "--w": h.pct + "%", width: h.pct + "%", background: h.heat }} />
                    </div>
                  </div>
                ))}
                {hoods.length === 0 && <div style={{ gridColumn: "1/-1" }} className="th-empty">No neighborhoods yet.</div>}
              </div>

              <div style={{ padding: "0 22px 20px" }}>
                <div style={{ padding: "14px 0 8px", fontSize: 10, fontWeight: 500, color: T.creamFaint, textTransform: "uppercase", letterSpacing: "0.1em", display: "flex", alignItems: "center", gap: 8 }}>
                  <span>{activeHood ? activeHood + " issues" : "All issues"}</span>
                  <div style={{ flex: 1, height: 1, background: T.border }} />
                  {activeHood && <span style={{ fontSize: 11, color: T.creamFaint, cursor: "pointer" }} onClick={() => setActiveHood(null)}>clear ×</span>}
                </div>
                {filteredIssues.map((issue, i) => <CityIssueCard key={issue.id} issue={issue} idx={i} />)}
                {filteredIssues.length === 0 && <div className="th-empty">No issues yet.<br />Escalate posts from the feed.</div>}
              </div>
            </>
          )}
        </>
      )}

      {/* ── Settings tab ── */}
      {tab === "settings" && (
        <>
          <div className="ns-header">
            <div>
              <div className="ns-title">Notification <em>settings</em></div>
              <div className="ns-sub">Choose what you hear about</div>
            </div>
          </div>
          <div style={{ padding: "16px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 500, color: T.creamFaint, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Alert types</div>
              {NOTIF_PREFS.map(p => (
                <div key={p.id} className="pref-row" onClick={() => togglePref(p.id)}>
                  <div className="pref-icon" style={{ background: p.iconBg, color: p.iconColor }}>{p.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div className="pref-label">{p.label}</div>
                    <div className="pref-desc">{p.desc}</div>
                  </div>
                  <div className={"toggle-track" + (prefs[p.id] ? " on" : "")}>
                    <div className="toggle-thumb" />
                  </div>
                </div>
              ))}
            </div>

            <div>
              <div style={{ fontSize: 10, fontWeight: 500, color: T.creamFaint, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Official access</div>
              <div style={{ background: T.tealLo, border: "1px solid " + T.teal + "44", borderRadius: 10, padding: "14px 16px" }}>
                {officialAppStatus === "approved" ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: T.tealHi }}>
                    <CheckIcon color={T.tealHi} /> Your official account is verified and active.
                  </div>
                ) : officialAppStatus === "pending" ? (
                  <div style={{ fontSize: 13, color: T.amberHi }}>Your application is under review.</div>
                ) : (
                  <>
                    <div style={{ fontSize: 13, fontWeight: 500, color: T.tealHi, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                      <CheckIcon color={T.tealHi} /> Are you a government official?
                    </div>
                    <div style={{ fontSize: 12, color: T.creamDim, lineHeight: 1.7, marginBottom: 12 }}>
                      Verified officials can respond to civic issues with an official badge visible to all residents.
                    </div>
                    <button onClick={() => setShowOfficial(true)}
                      style={{ width: "100%", padding: 10, borderRadius: 8, background: T.teal, border: "none", color: "#fff", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                      Apply as a verified official
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ApplyOfficial sheet */}
      {showOfficial && (
        <>
          <div className="sheet-backdrop" onClick={() => setShowOfficial(false)} />
          <div className="sheet-panel">
            <div className="sheet-handle" />
            <ApplyOfficial onClose={() => {
              setShowOfficial(false);
              supabase.auth.getUser().then(({ data: { user } }) => {
                if (!user) return;
                supabase.from("official_applications").select("status").eq("user_id", user.id).maybeSingle()
                  .then(({ data }) => { if (data) setOfficialAppStatus(data.status); });
              });
            }} />
          </div>
        </>
      )}

      {toast && <div className="th-toast"><div style={{ width: 7, height: 7, borderRadius: "50%", background: toast.dot }} />{toast.msg}</div>}
    </div>
  );
}
