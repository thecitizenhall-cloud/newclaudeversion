"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

const T = {
  bg:        "#0F0E0C",
  surface:   "#1A1916",
  surfaceHi: "#222019",
  border:    "#2C2A26",
  borderHi:  "#4A4640",
  cream:     "#F2EDE4",
  creamDim:  "#9A9188",
  creamFaint:"#4A4640",
  amber:     "#D4922A",
  amberLo:   "#2A1E08",
  amberHi:   "#F0B84A",
  amberMid:  "#8C5E14",
  teal:      "#1D9E75",
  tealLo:    "#0A2A1E",
  tealHi:    "#4CAF80",
  blue:      "#378ADD",
  blueLo:    "#0D1E35",
  blueHi:    "#85B7EB",
  purple:    "#7F77DD",
  purpleLo:  "#1A1835",
  red:       "#C0392B",
  redLo:     "#2A0E0A",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${T.bg}; color: ${T.cream}; font-family: 'DM Sans', sans-serif; font-size: 14px; min-height: 100vh; }
  @keyframes fadeUp   { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
  @keyframes slideIn  { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
  @keyframes escalate { 0%{transform:scale(1);opacity:1} 60%{transform:scale(1.03);opacity:0.7} 100%{transform:scale(0.97);opacity:0} }
  @keyframes popIn    { 0%{transform:scale(0.88);opacity:0} 70%{transform:scale(1.03)} 100%{transform:scale(1);opacity:1} }
  @keyframes spin     { to{transform:rotate(360deg)} }
  @keyframes barGrow  { from{width:0} to{width:var(--w)} }
  @keyframes voteFlash{ 0%{background:${T.amberLo}} 50%{background:${T.amberMid}44} 100%{background:${T.amberLo}} }
  .th-app { display:grid; grid-template-columns:220px 1fr 340px; grid-template-rows:52px 1fr; height:100vh; overflow:hidden; }
  .th-topbar { grid-column:1/-1; background:${T.surface}; border-bottom:1px solid ${T.border}; display:flex; align-items:center; padding:0 20px; gap:16px; }
  .th-logo { display:flex; align-items:center; gap:9px; font-family:'DM Serif Display',serif; font-size:16px; color:${T.cream}; flex-shrink:0; }
  .th-logo-mark { width:26px; height:26px; border:1.5px solid ${T.amber}; border-radius:6px; display:flex; align-items:center; justify-content:center; }
  .th-topbar-hood { display:flex; align-items:center; gap:8px; padding:5px 12px; background:${T.amberLo}; border:1px solid ${T.amberMid}; border-radius:99px; font-size:12px; color:${T.amberHi}; }
  .th-topbar-hood-dot { width:6px;height:6px;border-radius:50%;background:${T.amber}; }
  .th-topbar-right { margin-left:auto; display:flex; align-items:center; gap:12px; }
  .th-avatar { width:30px;height:30px;border-radius:8px; background:${T.amberLo};border:1px solid ${T.amberMid}; display:flex;align-items:center;justify-content:center; font-family:'DM Serif Display',serif;font-size:13px;color:${T.amberHi}; cursor:pointer; }
  .th-zk-badge { display:flex;align-items:center;gap:5px; background:#0D2B1F;border:1px solid #1B4A35; border-radius:99px;padding:4px 10px; font-size:11px;color:${T.tealHi}; }
  .th-signout { background:transparent;border:1px solid ${T.border};border-radius:6px;padding:4px 10px;font-family:'DM Sans',sans-serif;font-size:11px;color:${T.creamDim};cursor:pointer;transition:all 0.15s; }
  .th-signout:hover { border-color:${T.borderHi};color:${T.cream}; }
  .th-sidebar { background:${T.surface}; border-right:1px solid ${T.border}; padding:16px 0; overflow-y:auto; display:flex; flex-direction:column; gap:2px; }
  .th-sidebar-section { padding:4px 16px 2px; font-size:10px; font-weight:500; color:${T.creamFaint}; text-transform:uppercase; letter-spacing:0.1em; margin-top:12px; }
  .th-nav-item { display:flex;align-items:center;gap:10px; padding:8px 16px;cursor:pointer; font-size:13px;color:${T.creamDim}; transition:all 0.15s;border-left:2px solid transparent; }
  .th-nav-item:hover { color:${T.cream}; background:${T.surfaceHi}; }
  .th-nav-item.active { color:${T.amber}; border-left-color:${T.amber}; background:${T.amberLo}; }
  .th-nav-dot { width:7px;height:7px;border-radius:50%;flex-shrink:0; }
  .th-nav-badge { margin-left:auto;background:${T.amberLo}; border:1px solid ${T.amberMid};border-radius:99px; padding:1px 7px;font-size:10px;color:${T.amberHi}; }
  .th-feed { overflow-y:auto; display:flex; flex-direction:column; background:${T.bg}; }
  .th-feed-header { padding:16px 20px 12px; border-bottom:1px solid ${T.border}; position:sticky; top:0; background:${T.bg}; z-index:10; display:flex; align-items:center; gap:10px; }
  .th-feed-title { font-family:'DM Serif Display',serif; font-size:18px;color:${T.cream}; }
  .th-feed-title em { font-style:italic; color:${T.amberHi}; }
  .th-filter-row { display:flex;gap:6px;padding:10px 20px; border-bottom:1px solid ${T.border}; overflow-x:auto; }
  .th-filter-pill { display:flex;align-items:center;gap:5px; padding:4px 12px;border-radius:99px; border:1px solid ${T.border}; font-size:12px;color:${T.creamDim}; cursor:pointer;white-space:nowrap; transition:all 0.15s;flex-shrink:0; }
  .th-filter-pill:hover { border-color:${T.borderHi};color:${T.cream}; }
  .th-filter-pill.active { background:${T.amberLo};border-color:${T.amberMid};color:${T.amberHi}; }
  .th-compose { padding:14px 20px; border-bottom:1px solid ${T.border}; display:flex;flex-direction:column;gap:10px; }
  .th-compose-input { width:100%;background:${T.surface}; border:1px solid ${T.border};border-radius:10px; padding:10px 14px; font-family:'DM Sans',sans-serif;font-size:13px; color:${T.cream};outline:none;resize:none; transition:border-color 0.2s; }
  .th-compose-input:focus { border-color:${T.amber}; }
  .th-compose-input::placeholder { color:${T.creamFaint}; }
  .th-tag-row { display:flex;gap:6px;flex-wrap:wrap; }
  .th-tag-chip { padding:3px 10px;border-radius:99px; font-size:11px;cursor:pointer; border:1px solid transparent; transition:all 0.15s; }
  .th-post-btn { background:${T.amber};color:${T.bg}; border:none;border-radius:8px; padding:8px 18px;font-family:'DM Sans',sans-serif; font-size:13px;font-weight:500;cursor:pointer; transition:all 0.2s;white-space:nowrap; }
  .th-post-btn:hover { background:${T.amberHi}; }
  .th-post-btn:disabled { opacity:0.4;cursor:not-allowed; }
  .th-post { padding:16px 20px; border-bottom:1px solid ${T.border}; animation:fadeUp 0.3s ease both; transition:background 0.2s; }
  .th-post:hover { background:${T.surfaceHi}44; }
  .th-post.new-post { animation:popIn 0.35s ease both; }
  .th-post.escalating { animation:escalate 0.5s ease forwards; }
  .th-post-meta { display:flex;align-items:center;gap:8px; margin-bottom:8px; }
  .th-post-avatar { width:32px;height:32px;border-radius:8px; display:flex;align-items:center;justify-content:center; font-size:12px;font-weight:500;flex-shrink:0; }
  .th-post-author { font-size:13px;color:${T.cream};font-weight:500; }
  .th-post-hood { font-size:11px;color:${T.creamDim}; }
  .th-post-time { font-size:11px;color:${T.creamFaint};margin-left:auto; }
  .th-post-body { font-size:13px;color:${T.creamDim};line-height:1.6;margin-bottom:10px; }
  .th-post-tags { display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px; }
  .th-post-tag { padding:2px 9px;border-radius:99px; font-size:11px;font-weight:500; }
  .th-post-actions { display:flex;align-items:center;gap:2px; }
  .th-action-btn { display:flex;align-items:center;gap:5px; padding:5px 10px;border-radius:6px; font-size:12px;color:${T.creamDim}; cursor:pointer;border:none;background:transparent; font-family:'DM Sans',sans-serif; transition:all 0.15s; }
  .th-action-btn:hover { background:${T.surface};color:${T.cream}; }
  .th-action-btn.voted { color:${T.amberHi}; }
  .th-action-btn.escalate-btn { color:${T.blue};margin-left:auto; }
  .th-action-btn.escalate-btn:hover { background:${T.blueLo};color:${T.blueHi}; }
  .th-tracker { background:${T.surface}; border-left:1px solid ${T.border}; display:flex;flex-direction:column; overflow:hidden; }
  .th-tracker-header { padding:14px 18px 12px; border-bottom:1px solid ${T.border}; }
  .th-tracker-title { font-family:'DM Serif Display',serif; font-size:16px;color:${T.cream}; margin-bottom:2px; }
  .th-tracker-sub { font-size:11px;color:${T.creamDim}; }
  .th-tracker-body { flex:1;overflow-y:auto;padding:12px; }
  .th-issue-card { background:${T.bg}; border:1px solid ${T.border}; border-radius:10px; padding:14px; margin-bottom:10px; animation:slideIn 0.35s ease both; cursor:pointer; transition:border-color 0.15s; }
  .th-issue-card:hover { border-color:${T.borderHi}; }
  .th-issue-card.new-issue { animation:popIn 0.4s ease both; border-color:${T.amberMid}; }
  .th-issue-top { display:flex;align-items:flex-start;gap:8px;margin-bottom:8px; }
  .th-issue-num { width:22px;height:22px;border-radius:6px; background:${T.blueLo};border:1px solid ${T.blue}44; font-size:10px;color:${T.blueHi}; display:flex;align-items:center;justify-content:center; flex-shrink:0;font-weight:500; }
  .th-issue-title { font-size:13px;color:${T.cream};font-weight:500;line-height:1.4; }
  .th-issue-source { font-size:10px;color:${T.creamFaint};margin-bottom:6px; }
  .th-issue-bar-wrap { display:flex;align-items:center;gap:8px;margin-bottom:8px; }
  .th-issue-bar-bg { flex:1;height:4px;border-radius:99px;background:${T.border};overflow:hidden; }
  .th-issue-bar-fill { height:100%;border-radius:99px;background:${T.blue}; animation:barGrow 0.6s ease both; }
  .th-issue-pct { font-size:11px;color:${T.blueHi};font-weight:500;white-space:nowrap; }
  .th-vote-btn { width:100%;padding:8px;border-radius:7px; border:1px solid ${T.border}; background:transparent; font-family:'DM Sans',sans-serif;font-size:12px; color:${T.creamDim};cursor:pointer; display:flex;align-items:center;justify-content:center;gap:7px; transition:all 0.2s; }
  .th-vote-btn:hover { border-color:${T.blue};color:${T.blueHi};background:${T.blueLo}; }
  .th-vote-btn.voted { background:${T.blueLo};border-color:${T.blue};color:${T.blueHi}; }
  .th-zk-note { display:flex;align-items:center;gap:5px; font-size:10px;color:${T.tealHi}; margin-top:5px;justify-content:center; }
  .th-issue-status { display:inline-flex;align-items:center;gap:4px; padding:2px 8px;border-radius:99px; font-size:10px;font-weight:500; margin-bottom:6px; }
  .status-open     { background:${T.blueLo};color:${T.blueHi};border:1px solid ${T.blue}44; }
  .status-expert   { background:${T.purpleLo};color:#AFA9EC;border:1px solid #534AB7; }
  .status-escalated{ background:${T.amberLo};color:${T.amberHi};border:1px solid ${T.amberMid}; }
  .th-empty { text-align:center;padding:40px 20px; color:${T.creamFaint};font-size:13px;line-height:1.8; }
  .th-loading { display:flex;align-items:center;justify-content:center;gap:10px; padding:40px 20px; color:${T.creamDim};font-size:13px; }
  .th-spinner { width:16px;height:16px;border:2px solid ${T.border};border-top-color:${T.amber};border-radius:50%;animation:spin 0.8s linear infinite; }
  .th-toast { position:fixed;bottom:72px;left:50%;transform:translateX(-50%); background:${T.surface};border:1px solid ${T.border}; border-radius:10px;padding:10px 18px; font-size:13px;color:${T.cream}; display:flex;align-items:center;gap:8px; animation:fadeUp 0.3s ease both; z-index:100;white-space:nowrap; }
  .th-toast-dot { width:7px;height:7px;border-radius:50%;background:${T.amberHi};flex-shrink:0; }
  ::-webkit-scrollbar { width:4px; }
  ::-webkit-scrollbar-track { background:transparent; }
  ::-webkit-scrollbar-thumb { background:${T.border};border-radius:99px; }
`;

const TAGS = {
  banter:   { bg:"#2A1E08", color:"#F0B84A", border:"#8C5E14" },
  issue:    { bg:"#0D1E35", color:"#85B7EB", border:"#185FA5" },
  question: { bg:"#0A2A1E", color:"#4CAF80", border:"#1D9E75" },
  bulletin: { bg:"#1A1835", color:"#AFA9EC", border:"#534AB7" },
};

// ── Helpers ───────────────────────────────────────────────────────────────
function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)   return "just now";
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400)return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}

function initials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length-1][0]}`.toUpperCase()
    : name.slice(0,2).toUpperCase();
}

// Deterministic avatar color from user id
const AVATAR_COLORS = [
  { bg:"#2A1E08", color:"#F0B84A" },
  { bg:"#0A2A1E", color:"#4CAF80" },
  { bg:"#1A1835", color:"#AFA9EC" },
  { bg:"#0D1E35", color:"#85B7EB" },
  { bg:"#2A0E0A", color:"#E57373" },
];
function avatarColor(id) {
  const idx = id ? id.charCodeAt(0) % AVATAR_COLORS.length : 0;
  return AVATAR_COLORS[idx];
}

// ── SVG icons ─────────────────────────────────────────────────────────────
function LogoMark() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="7" width="5" height="6" rx="1" fill={T.amber}/><rect x="8" y="4" width="5" height="9" rx="1" fill={T.amber} opacity="0.6"/><rect x="1" y="1" width="5" height="4" rx="1" fill={T.amber} opacity="0.4"/></svg>;
}
function CheckSm({ color }) {
  return <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l2.5 2.5L10 3" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function UpIcon({ color }) {
  return <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 9V3M3 6l3-3 3 3" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function EscalateIcon({ color }) {
  return <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 10L10 2M10 2H5M10 2v5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

function PostTag({ tag }) {
  const s = TAGS[tag] || TAGS.banter;
  return <span className="th-post-tag" style={{ background:s.bg, color:s.color, border:`1px solid ${s.border}` }}>{tag}</span>;
}

function StatusPill({ status }) {
  const map   = { open:"status-open", expert:"status-expert", escalated:"status-escalated" };
  const label = { open:"Open", expert:"Expert review", escalated:"Escalated" };
  return <span className={`th-issue-status ${map[status]||"status-open"}`}>{label[status]||status}</span>;
}

// ── Post Card ─────────────────────────────────────────────────────────────
function PostCard({ post, currentUserId, onVote, onEscalate, isNew }) {
  const [escalating, setEscalating] = useState(false);
  const av = avatarColor(post.author_id);
  const name = post.profiles?.display_name || "Resident";
  const hood = post.profiles?.neighborhood || "Townhall";

  function handleEscalate() {
    setEscalating(true);
    setTimeout(() => onEscalate(post), 450);
  }

  return (
    <div className={`th-post${escalating?" escalating":""}${isNew?" new-post":""}`}>
      <div className="th-post-meta">
        <div className="th-post-avatar" style={{ background:av.bg, color:av.color }}>
          {initials(name)}
        </div>
        <div>
          <div className="th-post-author">{name}{post.author_id===currentUserId && <span style={{ fontSize:10, color:T.amberHi, marginLeft:6 }}>you</span>}</div>
          <div className="th-post-hood">{hood}</div>
        </div>
        <div className="th-post-time">{timeAgo(post.created_at)}</div>
      </div>

      <div className="th-post-body">{post.body}</div>

      <div className="th-post-tags">
        {(post.tags||[]).map(t => <PostTag key={t} tag={t}/>)}
        {post.escalated && <span className="th-post-tag" style={{ background:T.blueLo, color:T.blueHi, border:`1px solid ${T.blue}44` }}>escalated</span>}
      </div>

      <div className="th-post-actions">
        <button className={`th-action-btn${post.user_has_upvoted?" voted":""}`} onClick={() => onVote(post)}>
          <UpIcon color={post.user_has_upvoted?T.amberHi:T.creamDim}/>{post.upvote_count||0}
        </button>
        <button className="th-action-btn">Reply</button>
        {!post.escalated && (post.tags||[]).some(t => ["issue","banter"].includes(t)) && (
          <button className="th-action-btn escalate-btn" onClick={handleEscalate}>
            <EscalateIcon color={T.blue}/> Escalate to civic
          </button>
        )}
        {post.escalated && (
          <span style={{ marginLeft:"auto", fontSize:11, color:T.blueHi, display:"flex", alignItems:"center", gap:4 }}>
            <CheckSm color={T.blueHi}/> In tracker
          </span>
        )}
      </div>
    </div>
  );
}

// ── Issue Card ────────────────────────────────────────────────────────────
function IssueCard({ issue, onVote, isNew }) {
  return (
    <div className={`th-issue-card${isNew?" new-issue":""}`}>
      <div className="th-issue-top">
        <div className="th-issue-num">#{issue.issue_number||"?"}</div>
        <div className="th-issue-title">{issue.title}</div>
      </div>
      <div className="th-issue-source">{issue.source_label||"Escalated from banter"}</div>
      <StatusPill status={issue.status||"open"}/>
      <div className="th-issue-bar-wrap">
        <div className="th-issue-bar-bg">
          <div className="th-issue-bar-fill" style={{ "--w":`${issue.priority_pct||0}%`, width:`${issue.priority_pct||0}%` }}/>
        </div>
        <span className="th-issue-pct">{issue.priority_pct||0}%</span>
      </div>
      <div style={{ fontSize:10, color:T.creamFaint, marginBottom:10 }}>{issue.voice_count||0} verified voices</div>
      <button className={`th-vote-btn${issue.user_has_voted?" voted":""}`} onClick={() => onVote(issue)}>
        {issue.user_has_voted
          ? <><CheckSm color={T.blueHi}/> You&apos;ve prioritised this</>
          : <><UpIcon color={T.creamDim}/> Mark as priority · ZK verified</>}
      </button>
      {!issue.user_has_voted && (
        <div className="th-zk-note"><CheckSm color={T.tealHi}/> Your vote is anonymous · residency verified</div>
      )}
    </div>
  );
}

// ── Main Feed ─────────────────────────────────────────────────────────────
export default function FeedScreen() {
  const [posts,       setPosts]       = useState([]);
  const [issues,      setIssues]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState("all");
  const [draft,       setDraft]       = useState("");
  const [draftTag,    setDraftTag]    = useState("banter");
  const [posting,     setPosting]     = useState(false);
  const [toast,       setToast]       = useState(null);
  const [newPostIds,  setNewPostIds]  = useState([]);
  const [newIssueIds, setNewIssueIds] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [neighborhood,setNeighborhood]= useState("Riverdale");
  const toastTimer = useRef(null);
  const channelRef = useRef(null);

  function showToast(msg) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }

  // ── Load user + posts on mount ──────────────────────────────────────────
  useEffect(() => {
    async function init() {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
        const hood = user.user_metadata?.neighborhood || "Riverdale";
        setNeighborhood(hood);
      }

      await loadPosts(user);
      await loadIssues();
      setLoading(false);
    }
    init();

    // Real-time subscription — new posts appear instantly
    channelRef.current = supabase
      .channel("posts-realtime")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "posts",
      }, async (payload) => {
        // Fetch the full post with profile joined
        const { data } = await supabase
          .from("posts")
          .select("*, profiles(display_name, neighborhood)")
          .eq("id", payload.new.id)
          .single();

        if (data) {
          setPosts(prev => [data, ...prev]);
          setNewPostIds(ids => [...ids, data.id]);
          setTimeout(() => setNewPostIds(ids => ids.filter(i => i !== data.id)), 1500);
        }
      })
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "posts",
      }, (payload) => {
        setPosts(prev => prev.map(p => p.id === payload.new.id ? { ...p, ...payload.new } : p));
      })
      .subscribe();

    return () => {
      if (channelRef.current) channelRef.current.unsubscribe();
    };
  }, []);

  async function loadPosts(user) {
    const { data, error } = await supabase
      .from("posts")
      .select("*, profiles(display_name, neighborhood)")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) { console.error("loadPosts error:", error); return; }

    // Check which posts the current user has upvoted
    if (user && data?.length) {
      const { data: upvotes } = await supabase
        .from("post_upvotes")
        .select("post_id")
        .eq("user_id", user.id)
        .in("post_id", data.map(p => p.id));

      const upvotedSet = new Set((upvotes||[]).map(u => u.post_id));
      data.forEach(p => { p.user_has_upvoted = upvotedSet.has(p.id); });
    }

    setPosts(data || []);
  }

  async function loadIssues() {
    const { data, error } = await supabase
      .from("civic_issues")
      .select("*")
      .neq("status", "resolved")
      .order("priority_pct", { ascending: false })
      .limit(20);

    if (error) { console.error("loadIssues error:", error); return; }

    // Add issue numbers
    const numbered = (data||[]).map((issue, i) => ({ ...issue, issue_number: i + 1 }));
    setIssues(numbered);
  }

  // ── Create post ───────────────────────────────────────────────────────
  async function handlePost() {
    if (!draft.trim() || posting) return;
    setPosting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { showToast("Please sign in to post"); setPosting(false); return; }

    const { error } = await supabase.from("posts").insert({
      author_id:       user.id,
      neighborhood_id: null, // will add neighborhood linking in next step
      body:            draft.trim(),
      tags:            [draftTag],
      upvote_count:    0,
    });

    if (error) {
      console.error("post error:", error);
      showToast("Failed to post — try again");
    } else {
      setDraft("");
      showToast("Post shared with " + neighborhood);
    }
    setPosting(false);
  }

  // ── Upvote post ───────────────────────────────────────────────────────
  async function handleVote(post) {
    if (!currentUser) return;

    if (post.user_has_upvoted) {
      // Remove upvote
      await supabase.from("post_upvotes")
        .delete()
        .match({ user_id: currentUser.id, post_id: post.id });
      setPosts(prev => prev.map(p => p.id===post.id
        ? { ...p, user_has_upvoted:false, upvote_count:Math.max(0,(p.upvote_count||1)-1) }
        : p));
    } else {
      // Add upvote
      await supabase.from("post_upvotes")
        .insert({ user_id: currentUser.id, post_id: post.id });
      setPosts(prev => prev.map(p => p.id===post.id
        ? { ...p, user_has_upvoted:true, upvote_count:(p.upvote_count||0)+1 }
        : p));
    }
  }

  // ── Escalate to civic tracker ─────────────────────────────────────────
  async function handleEscalate(post) {
    const title = post.body.length > 100 ? post.body.slice(0,100)+"…" : post.body;

    const { data: issue, error } = await supabase.from("civic_issues").insert({
      neighborhood_id: null,
      source_post_id:  post.id,
      title,
      status:          "escalated",
      voice_count:     0,
      priority_pct:    5,
      source_label:    `Escalated · ${post.profiles?.display_name||"Resident"}`,
    }).select().single();

    if (error) { showToast("Escalation failed"); return; }

    // Mark post as escalated
    await supabase.from("posts")
      .update({ escalated: true, escalated_issue_id: issue.id })
      .eq("id", post.id);

    const issueNum = issues.length + 1;
    const newIssue = { ...issue, issue_number: issueNum, user_has_voted: false };
    setIssues(prev => [newIssue, ...prev]);
    setNewIssueIds(ids => [...ids, issue.id]);
    setTimeout(() => setNewIssueIds(ids => ids.filter(i => i !== issue.id)), 2000);
    showToast(`Post escalated as civic issue #${issueNum}`);
  }

  // ── Vote on civic issue ───────────────────────────────────────────────
  async function handleIssueVote(issue) {
    if (!currentUser) return;
    if (issue.user_has_voted) return; // can't unvote

    const { error } = await supabase.from("votes").insert({
      user_id:    currentUser.id,
      issue_id:   issue.id,
      proof_hash: `stub_${currentUser.id}_${issue.id}`, // real ZK proof in production
    });

    if (error && error.code !== "23505") {
      showToast("Vote failed — try again");
      return;
    }

    setIssues(prev => prev.map(i => i.id===issue.id
      ? { ...i, user_has_voted:true, voice_count:(i.voice_count||0)+1, priority_pct:Math.min(99,(i.priority_pct||0)+3) }
      : i));
    showToast("ZK proof verified · your priority vote counted");
  }

  // ── Sign out ──────────────────────────────────────────────────────────
  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  // ── Filter posts ──────────────────────────────────────────────────────
  const filtered = filter === "all"       ? posts
    : filter === "escalated" ? posts.filter(p => p.escalated)
    : posts.filter(p => (p.tags||[]).includes(filter));

  const userInitials = initials(currentUser?.user_metadata?.display_name || currentUser?.email || "?");

  return (
    <>
      <style>{css}</style>
      <div className="th-app">

        {/* Topbar */}
        <div className="th-topbar">
          <div className="th-logo"><div className="th-logo-mark"><LogoMark/></div>Townhall</div>
          <div className="th-topbar-hood"><div className="th-topbar-hood-dot"/>{neighborhood}</div>
          <div className="th-topbar-right">
            <div className="th-zk-badge"><CheckSm color={T.tealHi}/>ZK verified</div>
            <div className="th-avatar">{userInitials}</div>
            <button className="th-signout" onClick={handleSignOut}>Sign out</button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="th-sidebar">
          <div className="th-sidebar-section">Spaces</div>
          <div className="th-nav-item active"><div className="th-nav-dot" style={{ background:T.amber }}/>Banter feed</div>
          <div className="th-nav-item"><div className="th-nav-dot" style={{ background:T.blue }}/>Civic issues<span className="th-nav-badge">{issues.length}</span></div>
          <div className="th-nav-item"><div className="th-nav-dot" style={{ background:T.purple }}/>Expert Q&amp;A</div>
          <div className="th-nav-item"><div className="th-nav-dot" style={{ background:T.teal }}/>Bulletin board</div>
          <div className="th-sidebar-section">Neighborhoods</div>
          <div className="th-nav-item active"><div className="th-nav-dot" style={{ background:T.amber }}/>{neighborhood}</div>
          <div className="th-sidebar-section">Account</div>
          <div className="th-nav-item"><div className="th-nav-dot" style={{ background:T.tealHi }}/>Residency proof</div>
          <div className="th-nav-item" onClick={handleSignOut} style={{ color:T.red }}><div className="th-nav-dot" style={{ background:T.red }}/>Sign out</div>
        </div>

        {/* Feed */}
        <div className="th-feed">
          <div className="th-feed-header">
            <h1 className="th-feed-title"><em>{neighborhood}</em> banter</h1>
          </div>
          <div className="th-filter-row">
            {[{key:"all",label:"All posts"},{key:"banter",label:"Banter"},{key:"issue",label:"Issues"},{key:"bulletin",label:"Bulletin"},{key:"escalated",label:"Escalated"}].map(f => (
              <div key={f.key} className={`th-filter-pill${filter===f.key?" active":""}`} onClick={() => setFilter(f.key)}>{f.label}</div>
            ))}
          </div>

          {/* Compose */}
          <div className="th-compose">
            <textarea className="th-compose-input" rows={2}
              placeholder={`Share something with ${neighborhood}…`}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key==="Enter" && (e.metaKey||e.ctrlKey)) handlePost(); }}
            />
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div className="th-tag-row">
                {Object.entries(TAGS).map(([tag, s]) => (
                  <div key={tag} className="th-tag-chip"
                    style={{ background:draftTag===tag?s.bg:"transparent", color:draftTag===tag?s.color:T.creamFaint, border:`1px solid ${draftTag===tag?s.border:T.border}` }}
                    onClick={() => setDraftTag(tag)}>{tag}</div>
                ))}
              </div>
              <button className="th-post-btn" onClick={handlePost} disabled={!draft.trim()||posting}>
                {posting ? "Posting…" : "Post"}
              </button>
            </div>
          </div>

          {/* Posts */}
          {loading && <div className="th-loading"><div className="th-spinner"/>Loading posts…</div>}
          {!loading && filtered.length===0 && (
            <div className="th-empty">
              No posts yet in {neighborhood}.<br/>Be the first to share something.
            </div>
          )}
          {!loading && filtered.map(post => (
            <PostCard key={post.id} post={post}
              currentUserId={currentUser?.id}
              onVote={handleVote}
              onEscalate={handleEscalate}
              isNew={newPostIds.includes(post.id)}
            />
          ))}
        </div>

        {/* Issue Tracker */}
        <div className="th-tracker">
          <div className="th-tracker-header">
            <div className="th-tracker-title">Civic issues</div>
            <div className="th-tracker-sub">{issues.length} open · ZK-gated priority voting</div>
          </div>
          <div className="th-tracker-body">
            {issues.length===0 && (
              <div className="th-empty" style={{ padding:"30px 0" }}>
                No issues yet.<br/>Escalate a post to start.
              </div>
            )}
            {issues.map(issue => (
              <IssueCard key={issue.id} issue={issue}
                onVote={handleIssueVote}
                isNew={newIssueIds.includes(issue.id)}
              />
            ))}
          </div>
        </div>

      </div>

      {toast && <div className="th-toast"><div className="th-toast-dot"/>{toast}</div>}
    </>
  );
}
