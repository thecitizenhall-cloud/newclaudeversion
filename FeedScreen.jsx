"use client";
import { useState, useEffect, useRef } from "react";

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
  @keyframes fadeUp   { from { opacity:0; transform:translateY(12px);} to { opacity:1; transform:translateY(0);} }
  @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
  @keyframes slideIn  { from { opacity:0; transform:translateX(-10px);} to { opacity:1; transform:translateX(0);} }
  @keyframes escalate { 0%{transform:scale(1);opacity:1} 60%{transform:scale(1.03);opacity:0.7} 100%{transform:scale(0.97);opacity:0} }
  @keyframes popIn    { 0%{transform:scale(0.88);opacity:0} 70%{transform:scale(1.03)} 100%{transform:scale(1);opacity:1} }
  @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:0.4} }
  @keyframes spin     { to{transform:rotate(360deg)} }
  @keyframes barGrow  { from{width:0} to{width:var(--w)} }
  @keyframes voteFlash{ 0%{background:${T.amberLo}} 50%{background:${T.amberMid}44} 100%{background:${T.amberLo}} }
  .th-app { display:grid; grid-template-columns:220px 1fr 340px; grid-template-rows:52px 1fr; height:100vh; overflow:hidden; }
  .th-topbar { grid-column:1/-1; background:${T.surface}; border-bottom:1px solid ${T.border}; display:flex; align-items:center; padding:0 20px; gap:16px; }
  .th-logo { display:flex; align-items:center; gap:9px; font-family:'DM Serif Display',serif; font-size:16px; color:${T.cream}; flex-shrink:0; }
  .th-logo-mark { width:26px; height:26px; border:1.5px solid ${T.amber}; border-radius:6px; display:flex; align-items:center; justify-content:center; }
  .th-topbar-hood { display:flex; align-items:center; gap:8px; padding:5px 12px; background:${T.amberLo}; border:1px solid ${T.amberMid}; border-radius:99px; font-size:12px; color:${T.amberHi}; cursor:pointer; }
  .th-topbar-hood-dot { width:6px;height:6px;border-radius:50%;background:${T.amber}; }
  .th-topbar-right { margin-left:auto; display:flex; align-items:center; gap:12px; }
  .th-avatar { width:30px;height:30px;border-radius:8px; background:${T.amberLo};border:1px solid ${T.amberMid}; display:flex;align-items:center;justify-content:center; font-family:'DM Serif Display',serif;font-size:13px;color:${T.amberHi}; cursor:pointer; }
  .th-zk-badge { display:flex;align-items:center;gap:5px; background:#0D2B1F;border:1px solid #1B4A35; border-radius:99px;padding:4px 10px; font-size:11px;color:${T.tealHi}; }
  .th-sidebar { background:${T.surface}; border-right:1px solid ${T.border}; padding:16px 0; overflow-y:auto; display:flex; flex-direction:column; gap:2px; }
  .th-sidebar-section { padding:4px 16px 2px; font-size:10px; font-weight:500; color:${T.creamFaint}; text-transform:uppercase; letter-spacing:0.1em; margin-top:12px; }
  .th-nav-item { display:flex;align-items:center;gap:10px; padding:8px 16px;cursor:pointer; font-size:13px;color:${T.creamDim}; transition:all 0.15s;border-left:2px solid transparent; }
  .th-nav-item:hover { color:${T.cream}; background:${T.surfaceHi}; }
  .th-nav-item.active { color:${T.amber}; border-left-color:${T.amber}; background:${T.amberLo}; }
  .th-nav-dot { width:7px;height:7px;border-radius:50%;flex-shrink:0; }
  .th-nav-badge { margin-left:auto;background:${T.amberLo}; border:1px solid ${T.amberMid};border-radius:99px; padding:1px 7px;font-size:10px;color:${T.amberHi}; }
  .th-feed { overflow-y:auto; padding:0; display:flex; flex-direction:column; background:${T.bg}; }
  .th-feed-header { padding:16px 20px 12px; border-bottom:1px solid ${T.border}; position:sticky; top:0; background:${T.bg}; z-index:10; display:flex; align-items:center; gap:10px; }
  .th-feed-title { font-family:'DM Serif Display',serif; font-size:18px;color:${T.cream}; }
  .th-feed-title em { font-style:italic; color:${T.amberHi}; }
  .th-filter-row { display:flex;gap:6px;padding:10px 20px; border-bottom:1px solid ${T.border}; overflow-x:auto; }
  .th-filter-pill { display:flex;align-items:center;gap:5px; padding:4px 12px;border-radius:99px; border:1px solid ${T.border}; font-size:12px;color:${T.creamDim}; cursor:pointer;white-space:nowrap; transition:all 0.15s;flex-shrink:0; }
  .th-filter-pill:hover { border-color:${T.borderHi};color:${T.cream}; }
  .th-filter-pill.active { background:${T.amberLo};border-color:${T.amberMid};color:${T.amberHi}; }
  .th-compose { padding:14px 20px; border-bottom:1px solid ${T.border}; display:flex;flex-direction:column;gap:10px; }
  .th-compose-input { flex:1;background:${T.surface}; border:1px solid ${T.border};border-radius:10px; padding:10px 14px; font-family:'DM Sans',sans-serif;font-size:13px; color:${T.cream};outline:none;resize:none; transition:border-color 0.2s; }
  .th-compose-input:focus { border-color:${T.amber}; }
  .th-compose-input::placeholder { color:${T.creamFaint}; }
  .th-tag-row { display:flex;gap:6px;flex-wrap:wrap; }
  .th-tag-chip { padding:3px 10px;border-radius:99px; font-size:11px;cursor:pointer; border:1px solid transparent; transition:all 0.15s; }
  .th-post-btn { background:${T.amber};color:${T.bg}; border:none;border-radius:8px; padding:8px 18px;font-family:'DM Sans',sans-serif; font-size:13px;font-weight:500;cursor:pointer; transition:all 0.2s;white-space:nowrap; }
  .th-post-btn:hover { background:${T.amberHi}; }
  .th-post-btn:disabled { opacity:0.4;cursor:not-allowed; }
  .th-post { padding:16px 20px; border-bottom:1px solid ${T.border}; animation:fadeUp 0.3s ease both; transition:background 0.2s; }
  .th-post:hover { background:${T.surfaceHi}44; }
  .th-post.escalating { animation:escalate 0.5s ease forwards; }
  .th-post.new-post { animation:popIn 0.35s ease both; }
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
  .th-action-btn.voted { color:${T.amberHi};animation:voteFlash 0.4s ease; }
  .th-action-btn.escalate-btn { color:${T.blue};margin-left:auto; }
  .th-action-btn.escalate-btn:hover { background:${T.blueLo};color:${T.blueHi}; }
  .th-expert-reply { margin-top:10px; padding:10px 12px; background:${T.purpleLo}; border:1px solid #3C3489; border-radius:8px; animation:fadeIn 0.3s ease; }
  .th-expert-byline { display:flex;align-items:center;gap:7px; margin-bottom:6px; }
  .th-expert-badge { padding:2px 8px;border-radius:99px; background:#26215C;border:1px solid #534AB7; font-size:10px;color:#AFA9EC;font-weight:500; }
  .th-expert-text { font-size:12px;color:${T.creamDim};line-height:1.6; }
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
  .status-resolved { background:${T.tealLo};color:${T.tealHi};border:1px solid ${T.teal}44; }
  .status-escalated{ background:${T.amberLo};color:${T.amberHi};border:1px solid ${T.amberMid}; }
  .th-empty { text-align:center;padding:40px 20px; color:${T.creamFaint};font-size:13px; }
  .th-toast { position:fixed;bottom:24px;left:50%;transform:translateX(-50%); background:${T.surface};border:1px solid ${T.border}; border-radius:10px;padding:10px 18px; font-size:13px;color:${T.cream}; display:flex;align-items:center;gap:8px; animation:fadeUp 0.3s ease both; z-index:100;white-space:nowrap; }
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

const AVATARS = [
  { initials:"MK", bg:"#2A1E08", color:"#F0B84A" },
  { initials:"JL", bg:"#0A2A1E", color:"#4CAF80" },
  { initials:"TP", bg:"#1A1835", color:"#AFA9EC" },
  { initials:"RD", bg:"#0D1E35", color:"#85B7EB" },
  { initials:"SO", bg:"#2A0E0A", color:"#E57373" },
];

const SEED_POSTS = [
  { id:1, avatar:AVATARS[0], author:"Margot K.", hood:"Riverdale", time:"12m ago", body:"Anyone else notice the construction detour on Elm has been going 6 weeks longer than planned? Traffic into downtown is a nightmare every morning now.", tags:["banter","issue"], votes:24, voted:false, escalated:false, expertReply:null },
  { id:2, avatar:AVATARS[1], author:"Jo L.", hood:"Eastside", time:"34m ago", body:"Summer concert in Riverside Park last night was incredible. Huge thanks to the parks committee! Same time next month please?", tags:["banter","bulletin"], votes:58, voted:false, escalated:false, expertReply:null },
  { id:3, avatar:AVATARS[3], author:"R. Delgado", hood:"City Council", time:"1h ago", body:"Budget committee meets Thursday 6pm — open to all residents. The affordable housing line item and library expansion are both on the table. Your input shapes the vote.", tags:["bulletin"], votes:43, voted:false, escalated:false, expertReply:null },
  { id:4, avatar:AVATARS[4], author:"Sam O.", hood:"Hillcrest", time:"2h ago", body:"The crosswalk light at 5th & Main is malfunctioning again. Three near-misses this week alone. This needs to be a formal issue.", tags:["issue"], votes:31, voted:false, escalated:false, expertReply:null },
];

const SEED_ISSUES = [
  { id:101, num:"#1", title:"5th & Main crosswalk malfunction", source:"Escalated from banter · 3 posts", pct:74, voters:142, voted:false, status:"expert", expertNote:"Traffic signal audit scheduled for Tue. Interim signage recommended." },
  { id:102, num:"#2", title:"Park lighting budget — Riverside", source:"Escalated from banter · 1 post", pct:51, voters:87, voted:false, status:"open", expertNote:null },
];

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
  const map = { open:"status-open", expert:"status-expert", resolved:"status-resolved", escalated:"status-escalated" };
  const label = { open:"Open", expert:"Expert review", resolved:"Resolved", escalated:"Escalated" };
  return <span className={`th-issue-status ${map[status]}`}>{label[status]}</span>;
}

function PostCard({ post, onVote, onEscalate, isNew }) {
  const [escalating, setEscalating] = useState(false);
  function handleEscalate() { setEscalating(true); setTimeout(() => onEscalate(post), 450); }
  return (
    <div className={`th-post${escalating?" escalating":""}${isNew?" new-post":""}`}>
      <div className="th-post-meta">
        <div className="th-post-avatar" style={{ background:post.avatar.bg, color:post.avatar.color }}>{post.avatar.initials}</div>
        <div><div className="th-post-author">{post.author}</div><div className="th-post-hood">{post.hood}</div></div>
        <div className="th-post-time">{post.time}</div>
      </div>
      <div className="th-post-body">{post.body}</div>
      <div className="th-post-tags">
        {post.tags.map(t => <PostTag key={t} tag={t} />)}
        {post.escalated && <span className="th-post-tag" style={{ background:T.blueLo, color:T.blueHi, border:`1px solid ${T.blue}44` }}>escalated</span>}
      </div>
      {post.expertReply && (
        <div className="th-expert-reply">
          <div className="th-expert-byline">
            <div className="th-post-avatar" style={{ width:22,height:22,fontSize:9,borderRadius:5,background:T.purpleLo,color:"#AFA9EC" }}>{post.expertReply.initials}</div>
            <span style={{ fontSize:12,color:T.cream,fontWeight:500 }}>{post.expertReply.name}</span>
            <span className="th-expert-badge">{post.expertReply.role}</span>
          </div>
          <div className="th-expert-text">{post.expertReply.text}</div>
        </div>
      )}
      <div className="th-post-actions">
        <button className={`th-action-btn${post.voted?" voted":""}`} onClick={() => onVote(post.id)}><UpIcon color={post.voted?T.amberHi:T.creamDim}/>{post.votes}</button>
        <button className="th-action-btn">Reply</button>
        {!post.escalated && (post.tags.includes("issue")||post.tags.includes("banter")) && (
          <button className="th-action-btn escalate-btn" onClick={handleEscalate}><EscalateIcon color={T.blue}/> Escalate to civic</button>
        )}
        {post.escalated && <span style={{ marginLeft:"auto",fontSize:11,color:T.blueHi,display:"flex",alignItems:"center",gap:4 }}><CheckSm color={T.blueHi}/> In tracker</span>}
      </div>
    </div>
  );
}

function IssueCard({ issue, onVote, isNew }) {
  return (
    <div className={`th-issue-card${isNew?" new-issue":""}`}>
      <div className="th-issue-top"><div className="th-issue-num">{issue.num}</div><div className="th-issue-title">{issue.title}</div></div>
      <div className="th-issue-source">{issue.source}</div>
      <StatusPill status={issue.status}/>
      <div className="th-issue-bar-wrap">
        <div className="th-issue-bar-bg"><div className="th-issue-bar-fill" style={{ "--w":`${issue.pct}%`, width:`${issue.pct}%` }}/></div>
        <span className="th-issue-pct">{issue.pct}%</span>
      </div>
      <div style={{ fontSize:10,color:T.creamFaint,marginBottom:10 }}>{issue.voters} verified voices</div>
      {issue.expertNote && <div style={{ padding:"8px 10px",marginBottom:10,background:T.purpleLo,border:`1px solid #3C3489`,borderRadius:7,fontSize:11,color:"#AFA9EC",lineHeight:1.6 }}><span style={{ fontWeight:500,color:"#CECBF6" }}>Expert: </span>{issue.expertNote}</div>}
      <button className={`th-vote-btn${issue.voted?" voted":""}`} onClick={() => onVote(issue.id)}>
        {issue.voted ? <><CheckSm color={T.blueHi}/> You&apos;ve prioritised this</> : <><UpIcon color={T.creamDim}/> Mark as priority · ZK verified</>}
      </button>
      {!issue.voted && <div className="th-zk-note"><CheckSm color={T.tealHi}/> Your vote is anonymous · residency verified</div>}
    </div>
  );
}

export default function FeedScreen() {
  const [posts, setPosts] = useState(SEED_POSTS);
  const [issues, setIssues] = useState(SEED_ISSUES);
  const [filter, setFilter] = useState("all");
  const [draft, setDraft] = useState("");
  const [draftTag, setDraftTag] = useState("banter");
  const [toast, setToast] = useState(null);
  const [newPostIds, setNewPostIds] = useState([]);
  const [newIssueIds, setNewIssueIds] = useState([]);
  const nextId = useRef(100);
  const nextIssueNum = useRef(issues.length + 1);
  const toastTimer = useRef(null);

  function showToast(msg) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }
  function handlePostVote(id) {
    setPosts(ps => ps.map(p => p.id===id ? { ...p, voted:!p.voted, votes:p.voted?p.votes-1:p.votes+1 } : p));
  }
  function handleIssueVote(id) {
    setIssues(is => is.map(i => {
      if (i.id!==id) return i;
      const nowVoted = !i.voted;
      return { ...i, voted:nowVoted, voters:nowVoted?i.voters+1:i.voters-1, pct:nowVoted?Math.min(99,i.pct+2):Math.max(1,i.pct-2) };
    }));
    showToast("ZK proof verified · your priority vote counted");
  }
  function handleEscalate(post) {
    setPosts(ps => ps.map(p => p.id===post.id ? { ...p, escalated:true } : p));
    const issueId = nextId.current++;
    const issueNum = `#${nextIssueNum.current++}`;
    const newIssue = { id:issueId, num:issueNum, title:post.body.length>60?post.body.slice(0,60)+"…":post.body, source:`Escalated from banter · ${post.author}`, pct:12, voters:1, voted:false, status:"escalated", expertNote:null };
    setIssues(is => [newIssue,...is]);
    setNewIssueIds(ids => [...ids,issueId]);
    setTimeout(() => setNewIssueIds(ids => ids.filter(i=>i!==issueId)), 2000);
    showToast(`Post escalated to civic tracker as ${issueNum}`);
  }
  function handlePost() {
    if (!draft.trim()) return;
    const newId = nextId.current++;
    const newPost = { id:newId, avatar:AVATARS[Math.floor(Math.random()*AVATARS.length)], author:"You", hood:"Riverdale", time:"just now", body:draft.trim(), tags:[draftTag], votes:0, voted:false, escalated:false, expertReply:null };
    setPosts(ps => [newPost,...ps]);
    setNewPostIds(ids => [...ids,newId]);
    setTimeout(() => setNewPostIds(ids => ids.filter(i=>i!==newId)), 1000);
    setDraft("");
    showToast("Post shared with Riverdale");
  }
  const filtered = filter==="all" ? posts : filter==="escalated" ? posts.filter(p=>p.escalated) : posts.filter(p=>p.tags.includes(filter));

  return (
    <>
      <style>{css}</style>
      <div className="th-app">
        <div className="th-topbar">
          <div className="th-logo"><div className="th-logo-mark"><LogoMark/></div>Townhall</div>
          <div className="th-topbar-hood"><div className="th-topbar-hood-dot"/>Riverdale</div>
          <div className="th-topbar-right">
            <div className="th-zk-badge"><CheckSm color={T.tealHi}/>ZK verified resident</div>
            <div className="th-avatar">MC</div>
          </div>
        </div>
        <div className="th-sidebar">
          <div className="th-sidebar-section">Spaces</div>
          <div className="th-nav-item active"><div className="th-nav-dot" style={{ background:T.amber }}/>Banter feed</div>
          <div className="th-nav-item"><div className="th-nav-dot" style={{ background:T.blue }}/>Civic issues<span className="th-nav-badge">{issues.length}</span></div>
          <div className="th-nav-item"><div className="th-nav-dot" style={{ background:T.purple }}/>Expert Q&amp;A</div>
          <div className="th-nav-item"><div className="th-nav-dot" style={{ background:T.teal }}/>Bulletin board</div>
          <div className="th-sidebar-section">Neighborhoods</div>
          {["Riverdale","Eastside","Midtown","Hillcrest"].map((n,i) => (
            <div key={n} className={`th-nav-item${i===0?" active":""}`}><div className="th-nav-dot" style={{ background:i===0?T.amber:T.creamFaint }}/>{n}</div>
          ))}
          <div className="th-sidebar-section">My account</div>
          <div className="th-nav-item"><div className="th-nav-dot" style={{ background:T.tealHi }}/>Residency proof</div>
          <div className="th-nav-item"><div className="th-nav-dot" style={{ background:T.creamFaint }}/>Settings</div>
        </div>
        <div className="th-feed">
          <div className="th-feed-header"><h1 className="th-feed-title"><em>Riverdale</em> banter</h1></div>
          <div className="th-filter-row">
            {[{key:"all",label:"All posts"},{key:"banter",label:"Banter"},{key:"issue",label:"Issues"},{key:"bulletin",label:"Bulletin"},{key:"escalated",label:"Escalated"}].map(f => (
              <div key={f.key} className={`th-filter-pill${filter===f.key?" active":""}`} onClick={() => setFilter(f.key)}>{f.label}</div>
            ))}
          </div>
          <div className="th-compose">
            <textarea className="th-compose-input" rows={2} placeholder="Share something with Riverdale…" value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter"&&(e.metaKey||e.ctrlKey)) handlePost(); }}/>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
              <div className="th-tag-row">
                {Object.entries(TAGS).map(([tag,s]) => (
                  <div key={tag} className="th-tag-chip" style={{ background:draftTag===tag?s.bg:"transparent", color:draftTag===tag?s.color:T.creamFaint, border:`1px solid ${draftTag===tag?s.border:T.border}` }} onClick={() => setDraftTag(tag)}>{tag}</div>
                ))}
              </div>
              <button className="th-post-btn" onClick={handlePost} disabled={!draft.trim()}>Post</button>
            </div>
          </div>
          {filtered.length===0 && <div className="th-empty">No posts in this filter yet.</div>}
          {filtered.map(post => <PostCard key={post.id} post={post} onVote={handlePostVote} onEscalate={handleEscalate} isNew={newPostIds.includes(post.id)}/>)}
        </div>
        <div className="th-tracker">
          <div className="th-tracker-header"><div className="th-tracker-title">Civic issues</div><div className="th-tracker-sub">{issues.length} open · ZK-gated priority voting</div></div>
          <div className="th-tracker-body">
            {issues.length===0 && <div className="th-empty" style={{ padding:"30px 0" }}>No issues yet. Escalate a post to start.</div>}
            {issues.map(issue => <IssueCard key={issue.id} issue={issue} onVote={handleIssueVote} isNew={newIssueIds.includes(issue.id)}/>)}
          </div>
        </div>
      </div>
      {toast && <div className="th-toast"><div className="th-toast-dot"/>{toast}</div>}
    </>
  );
}
