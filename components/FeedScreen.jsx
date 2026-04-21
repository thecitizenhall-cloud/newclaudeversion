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


const TAGS = {
  banter:   { bg:"#2A1E08", color:"#F0B84A", border:"#8C5E14" },
  issue:    { bg:"#0D1E35", color:"#85B7EB", border:"#185FA5" },
  question: { bg:"#0A2A1E", color:"#4CAF80", border:"#1D9E75" },
  bulletin: { bg:"#1A1835", color:"#AFA9EC", border:"#534AB7" },
};

function timeAgo(d) {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60)    return "just now";
  if (s < 3600)  return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

function initials(name) {
  if (!name) return "?";
  const p = name.trim().split(" ");
  return p.length >= 2 ? `${p[0][0]}${p[p.length-1][0]}`.toUpperCase() : name.slice(0,2).toUpperCase();
}

const AV = [
  { bg:"#2A1E08", color:"#F0B84A" }, { bg:"#0A2A1E", color:"#4CAF80" },
  { bg:"#1A1835", color:"#AFA9EC" }, { bg:"#0D1E35", color:"#85B7EB" },
  { bg:"#2A0E0A", color:"#E57373" },
];
function av(id) { return AV[(id ? id.charCodeAt(0) : 0) % AV.length]; }

function LogoMark() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="7" width="5" height="6" rx="1" fill={T.amber}/><rect x="8" y="4" width="5" height="9" rx="1" fill={T.amber} opacity="0.6"/><rect x="1" y="1" width="5" height="4" rx="1" fill={T.amber} opacity="0.4"/></svg>;
}
function CheckSm({ color }) {
  return <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l2.5 2.5L10 3" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function UpIcon({ color }) {
  return <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 9V3M3 6l3-3 3 3" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function EscIcon({ color }) {
  return <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 10L10 2M10 2H5M10 2v5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

function PostTag({ tag }) {
  const s = TAGS[tag]||TAGS.banter;
  return <span className="th-post-tag" style={{ background:s.bg, color:s.color, border:`1px solid ${s.border}` }}>{tag}</span>;
}
function StatusPill({ status }) {
  const map   = { open:"status-open", expert:"status-expert", escalated:"status-escalated" };
  const label = { open:"Open", expert:"Expert review", escalated:"Escalated" };
  return <span className={`th-issue-status ${map[status]||"status-open"}`}>{label[status]||status}</span>;
}

// ── Post Card ─────────────────────────────────────────────────────────────
function PostCard({ post, currentUserId, onVote, onEscalate, isNew }) {
  const [esc, setEsc] = useState(false);
  const a = av(post.author_id);
  const name = post.profiles?.display_name || "Resident";
  const hood = post.profiles?.neighborhood  || "Townhall";
  function handleEsc() { setEsc(true); setTimeout(() => onEscalate(post), 450); }
  return (
    <div className={`th-post${esc?" escalating":""}${isNew?" new-post":""}`}>
      <div className="th-post-meta">
        <div className="th-post-avatar" style={{ background:a.bg, color:a.color }}>{initials(name)}</div>
        <div>
          <div className="th-post-author">{name}{post.author_id===currentUserId&&<span style={{fontSize:10,color:T.amberHi,marginLeft:6}}>you</span>}</div>
          <div className="th-post-hood">{hood}</div>
        </div>
        <div className="th-post-time">{timeAgo(post.created_at)}</div>
      </div>
      <div className="th-post-body">{post.body}</div>
      <div className="th-post-tags">
        {(post.tags||[]).map(t=><PostTag key={t} tag={t}/>)}
        {post.escalated&&<span className="th-post-tag" style={{background:T.blueLo,color:T.blueHi,border:`1px solid ${T.blue}44`}}>escalated</span>}
      </div>
      <div className="th-post-actions">
        <button className={`th-action-btn${post.user_has_upvoted?" voted":""}`} onClick={()=>onVote(post)}>
          <UpIcon color={post.user_has_upvoted?T.amberHi:T.creamDim}/>{post.upvote_count||0}
        </button>
        <button className="th-action-btn">Reply</button>
        {!post.escalated&&(post.tags||[]).some(t=>["issue","banter"].includes(t))&&(
          <button className="th-action-btn escalate-btn" onClick={handleEsc}><EscIcon color={T.blue}/> Escalate</button>
        )}
        {post.escalated&&<span style={{marginLeft:"auto",fontSize:11,color:T.blueHi,display:"flex",alignItems:"center",gap:4}}><CheckSm color={T.blueHi}/>In tracker</span>}
      </div>
    </div>
  );
}

// ── Issue Card ────────────────────────────────────────────────────────────
function IssueCard({ issue, onVote, isNew }) {
  return (
    <div className={`th-issue-card${isNew?" new-issue":""}`}>
      <div className="th-issue-top"><div className="th-issue-num">#{issue.issue_number||"?"}</div><div className="th-issue-title">{issue.title}</div></div>
      <div className="th-issue-source">{issue.source_label||"Escalated from banter"}</div>
      <StatusPill status={issue.status||"open"}/>
      <div className="th-issue-bar-wrap">
        <div className="th-issue-bar-bg"><div className="th-issue-bar-fill" style={{"--w":`${issue.priority_pct||0}%`,width:`${issue.priority_pct||0}%`}}/></div>
        <span className="th-issue-pct">{issue.priority_pct||0}%</span>
      </div>
      <div style={{fontSize:10,color:T.creamFaint,marginBottom:10}}>{issue.voice_count||0} verified voices</div>
      <button className={`th-vote-btn${issue.user_has_voted?" voted":""}`} onClick={()=>onVote(issue)}>
        {issue.user_has_voted?<><CheckSm color={T.blueHi}/>You&apos;ve prioritised this</>:<><UpIcon color={T.creamDim}/>Mark as priority · ZK verified</>}
      </button>
      {!issue.user_has_voted&&<div className="th-zk-note"><CheckSm color={T.tealHi}/>Anonymous · residency verified</div>}
    </div>
  );
}

// ── Issues panel content (shared between desktop + mobile sheet) ──────────
function IssuesPanel({ issues, onVote, newIssueIds }) {
  return (
    <>
      {issues.length===0&&<div className="th-empty" style={{padding:"30px 0"}}>No issues yet.<br/>Escalate a post to start.</div>}
      {issues.map(issue=><IssueCard key={issue.id} issue={issue} onVote={onVote} isNew={newIssueIds.includes(issue.id)}/>)}
    </>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function FeedScreen({ onNavigate }) {
  const [posts,        setPosts]        = useState([]);
  const [issues,       setIssues]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [filter,       setFilter]       = useState("all");
  const [draft,        setDraft]        = useState("");
  const [draftTag,     setDraftTag]     = useState("banter");
  const [posting,      setPosting]      = useState(false);
  const [toast,        setToast]        = useState(null);
  const [newPostIds,   setNewPostIds]   = useState([]);
  const [newIssueIds,  setNewIssueIds]  = useState([]);
  const [currentUser,  setCurrentUser]  = useState(null);
  const [neighborhood,   setNeighborhood]   = useState("Riverdale");
  const [neighborhoodId,  setNeighborhoodId]  = useState(null);
  const [showIssues,   setShowIssues]   = useState(false); // mobile civic sheet
  const toastTimer  = useRef(null);
  const channelRef  = useRef(null);

  function showToast(msg) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
        const hood = user.user_metadata?.neighborhood || "Riverdale";
        setNeighborhood(hood);
        // Fetch the neighborhood_id for filtering
        const { data: prof } = await supabase
          .from("profiles")
          .select("neighborhood_id")
          .eq("id", user.id)
          .single();
        const hoodId = prof?.neighborhood_id || null;
        console.log("profile neighborhood_id:", hoodId);
        setNeighborhoodId(hoodId);
        await loadPosts(user, hoodId);
      } else {
        await loadPosts(null, null);
      }
      await loadIssues();
      setLoading(false);
    }
    init();

    channelRef.current = supabase.channel("posts-rt")
      .on("postgres_changes", { event:"INSERT", schema:"public", table:"posts" }, async (payload) => {
        const { data } = await supabase.from("posts").select("*, profiles(display_name,neighborhood)").eq("id", payload.new.id).single();
        if (data) {
          // Only add to feed if it belongs to this user's neighborhood
          if (neighborhoodId && data.neighborhood_id && data.neighborhood_id !== neighborhoodId) return;
          setPosts(prev => [data, ...prev]);
          setNewPostIds(ids => [...ids, data.id]);
          setTimeout(() => setNewPostIds(ids => ids.filter(i=>i!==data.id)), 1500);
        }
      })
      .on("postgres_changes", { event:"UPDATE", schema:"public", table:"posts" }, (payload) => {
        setPosts(prev => prev.map(p => p.id===payload.new.id ? {...p,...payload.new} : p));
      })
      .subscribe();

    return () => { if (channelRef.current) channelRef.current.unsubscribe(); };
  }, []);

  async function loadPosts(user, hoodId) {
    // Simplified — load all posts, no filter
    const { data, error } = await supabase
      .from("posts")
      .select("*, profiles(display_name,neighborhood)")
      .order("created_at", { ascending:false })
      .limit(50);

    console.log("loadPosts:", data?.length, "posts, error:", error?.message);
    if (!data) return;
    if (user && data.length) {
      const { data: upvotes } = await supabase.from("post_upvotes").select("post_id").eq("user_id", user.id).in("post_id", data.map(p=>p.id));
      const set = new Set((upvotes||[]).map(u=>u.post_id));
      data.forEach(p => { p.user_has_upvoted = set.has(p.id); });
    }
    setPosts(data);
  }

  async function loadIssues() {
    const { data } = await supabase.from("civic_issues").select("*").neq("status","resolved").order("priority_pct", { ascending:false }).limit(20);
    setIssues((data||[]).map((iss,i) => ({...iss, issue_number:i+1})));
  }

  async function handlePost() {
    if (!draft.trim()||posting) return;
    setPosting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { showToast("Please sign in"); setPosting(false); return; }
    // Get neighborhood_id from profile
    const { data: prof } = await supabase.from("profiles").select("neighborhood_id").eq("id", user.id).single();
    const { error } = await supabase.from("posts").insert({
      author_id:       user.id,
      neighborhood_id: prof?.neighborhood_id || null,
      body:            draft.trim(),
      tags:            [draftTag],
      upvote_count:    0,
      escalated:       false,
    });
    if (error) { showToast("Failed to post — " + error.message); } else { setDraft(""); showToast("Posted to " + neighborhood); }
    setPosting(false);
  }

  async function handleVote(post) {
    if (!currentUser) return;
    if (post.user_has_upvoted) {
      await supabase.from("post_upvotes").delete().match({ user_id:currentUser.id, post_id:post.id });
      setPosts(prev => prev.map(p => p.id===post.id ? {...p, user_has_upvoted:false, upvote_count:Math.max(0,(p.upvote_count||1)-1)} : p));
    } else {
      await supabase.from("post_upvotes").insert({ user_id:currentUser.id, post_id:post.id });
      setPosts(prev => prev.map(p => p.id===post.id ? {...p, user_has_upvoted:true, upvote_count:(p.upvote_count||0)+1} : p));
    }
  }

  async function handleEscalate(post) {
    const title = post.body.length>100 ? post.body.slice(0,100)+"…" : post.body;
    const { data: issue, error } = await supabase.from("civic_issues").insert({ source_post_id:post.id, title, status:"escalated", voice_count:0, priority_pct:5, source_label:`Escalated · ${post.profiles?.display_name||"Resident"}` }).select().single();
    if (error) { showToast("Escalation failed"); return; }
    await supabase.from("posts").update({ escalated:true, escalated_issue_id:issue.id }).eq("id", post.id);
    const num = issues.length + 1;
    const ni = {...issue, issue_number:num, user_has_voted:false};
    setIssues(prev => [ni, ...prev]);
    setNewIssueIds(ids => [...ids, issue.id]);
    setTimeout(() => setNewIssueIds(ids => ids.filter(i=>i!==issue.id)), 2000);
    showToast(`Escalated as civic issue #${num}`);
    if (isMobile) setShowIssues(true);
  }

  async function handleIssueVote(issue) {
    if (!currentUser||issue.user_has_voted) return;
    const { error } = await supabase.from("votes").insert({ user_id:currentUser.id, issue_id:issue.id, proof_hash:`stub_${currentUser.id}_${issue.id}` });
    if (error&&error.code!=="23505") { showToast("Vote failed"); return; }
    setIssues(prev => prev.map(i => i.id===issue.id ? {...i, user_has_voted:true, voice_count:(i.voice_count||0)+1, priority_pct:Math.min(99,(i.priority_pct||0)+3)} : i));
    showToast("Priority vote counted");
  }

  const filtered = filter==="all" ? posts : filter==="escalated" ? posts.filter(p=>p.escalated) : posts.filter(p=>(p.tags||[]).includes(filter));
  const userInit = initials(currentUser?.user_metadata?.display_name || currentUser?.email || "?");

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <>
      {/* Two-column: feed + civic tracker */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 340px", height:"100%", overflow:"hidden" }}>

        {/* Feed column */}
        <div className="th-feed">
          <div className="th-feed-header">
            <h1 className="th-feed-title"><em>{neighborhood}</em> banter</h1>
            <button onClick={()=>setShowIssues(true)}
              style={{ marginLeft:"auto", background:T.blueLo, border:`1px solid ${T.blue}44`, borderRadius:99, padding:"4px 10px", fontSize:11, color:T.blueHi, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", display:"flex", alignItems:"center", gap:4 }}>
              {issues.length} issues
            </button>
          </div>
          <div className="th-filter-row">
            {[{key:"all",label:"All"},{key:"banter",label:"Banter"},{key:"issue",label:"Issues"},{key:"bulletin",label:"Bulletin"},{key:"escalated",label:"Escalated"}].map(f=>(
              <div key={f.key} className={`th-filter-pill${filter===f.key?" active":""}`} onClick={()=>setFilter(f.key)}>{f.label}</div>
            ))}
          </div>
          <div className="th-compose">
            <textarea className="th-compose-input" rows={2}
              placeholder={`Share something with ${neighborhood}…`}
              value={draft} onChange={e=>setDraft(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter"&&(e.metaKey||e.ctrlKey))handlePost();}}
            />
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div className="th-tag-row">
                {Object.entries(TAGS).map(([tag,s])=>(
                  <div key={tag} className="th-tag-chip"
                    style={{background:draftTag===tag?s.bg:"transparent",color:draftTag===tag?s.color:T.creamFaint,border:`1px solid ${draftTag===tag?s.border:T.border}`}}
                    onClick={()=>setDraftTag(tag)}>{tag}</div>
                ))}
              </div>
              <button className="th-post-btn" onClick={handlePost} disabled={!draft.trim()||posting}>{posting?"Posting…":"Post"}</button>
            </div>
          </div>
          {loading&&<div className="th-loading"><div className="th-spinner"/>Loading…</div>}
          {!loading&&filtered.length===0&&<div className="th-empty">No posts yet in {neighborhood}.<br/>Be the first to share something.</div>}
          {!loading&&filtered.map(post=>(
            <PostCard key={post.id} post={post} currentUserId={currentUser?.id}
              onVote={handleVote} onEscalate={handleEscalate} isNew={newPostIds.includes(post.id)}/>
          ))}
        </div>

        {/* Right: civic tracker — hidden on mobile via CSS */}
        <div className="th-tracker" style={{ display:"flex", flexDirection:"column", overflow:"hidden" }}>
          <div className="th-tracker-header">
            <div className="th-tracker-title">Civic issues</div>
            <div className="th-tracker-sub">{issues.length} open · ZK-gated voting</div>
          </div>
          <div className="th-tracker-body">
            <IssuesPanel issues={issues} onVote={handleIssueVote} newIssueIds={newIssueIds}/>
          </div>
        </div>
      </div>

      {/* Mobile civic sheet — slides up when issues button tapped */}
      {showIssues&&(
        <div className="th-civic-sheet">
          <div className="th-civic-sheet-backdrop" onClick={()=>setShowIssues(false)}/>
          <div className="th-civic-sheet-panel">
            <div className="th-civic-sheet-handle"/>
            <div className="th-civic-sheet-header">
              <div>
                <div className="th-civic-sheet-title">Civic issues</div>
                <div className="th-civic-sheet-sub">{issues.length} open · ZK-gated voting</div>
              </div>
              <button className="th-civic-sheet-close" onClick={()=>setShowIssues(false)}>×</button>
            </div>
            <div className="th-civic-sheet-body">
              <IssuesPanel issues={issues} onVote={handleIssueVote} newIssueIds={newIssueIds}/>
            </div>
          </div>
        </div>
      )}

      {toast&&<div className="th-toast"><div className="th-toast-dot"/>{toast}</div>}
    </>
  );
}
