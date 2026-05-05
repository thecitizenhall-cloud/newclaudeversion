"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

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
  red:"#C0392B", redLo:"#2A0E0A", redHi:"#E57373",
};

function timeAgo(d) {
  if (!d) return "";
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return Math.floor(s / 60) + "m ago";
  if (s < 86400) return Math.floor(s / 3600) + "h ago";
  return Math.floor(s / 86400) + "d ago";
}

function initials(name) {
  if (!name) return "?";
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function CheckSm({ color }) {
  return <svg width={12} height={12} viewBox="0 0 12 12" fill="none"><path d="M2 6l2.5 2.5L10 3" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

function UpIcon({ color }) {
  return <svg width={13} height={13} viewBox="0 0 13 13" fill="none"><path d="M6.5 2.5l4 5H2.5l4-5z" fill={color}/></svg>;
}

const STATUS_COLORS = {
  open:      { bg: T.blueLo,   color: T.blueHi,   label: "Open" },
  escalated: { bg: T.amberLo,  color: T.amberHi,  label: "Escalated" },
  expert:    { bg: T.purpleLo, color: T.purpleHi, label: "Expert review" },
  city_wide: { bg: T.tealLo,   color: T.tealHi,   label: "City-wide" },
  resolved:  { bg: "#1A2A1A",  color: T.tealHi,   label: "Resolved" },
};

const css = `
  @keyframes fadeUp  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin    { to{transform:rotate(360deg)} }
  @keyframes slideUp { from{opacity:0;transform:translateY(100%)} to{opacity:1;transform:translateY(0)} }

  .ids-wrap { height:100%; display:flex; flex-direction:column; background:${T.bg}; overflow:hidden; }

  .ids-header {
    display:flex; align-items:center; gap:12px;
    padding:14px 16px 12px; border-bottom:1px solid ${T.border};
    position:sticky; top:0; background:${T.bg}; z-index:10; flex-shrink:0;
  }
  .ids-back {
    background:transparent; border:1px solid ${T.border}; border-radius:7px;
    padding:5px 10px; font-family:'DM Sans',sans-serif; font-size:12px;
    color:${T.creamDim}; cursor:pointer; flex-shrink:0;
  }
  .ids-back:hover { border-color:${T.borderHi}; color:${T.cream}; }
  .ids-header-title { font-family:'DM Serif Display',serif; font-size:15px; color:${T.cream}; flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

  .ids-body { flex:1; overflow-y:auto; -webkit-overflow-scrolling:touch; }

  /* ── Issue card ── */
  .ids-issue-card { padding:18px 16px 14px; border-bottom:2px solid ${T.border}; }
  .ids-issue-title { font-family:'DM Serif Display',serif; font-size:19px; color:${T.cream}; line-height:1.35; margin-bottom:10px; }
  .ids-issue-meta  { display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:14px; }
  .ids-status-pill { padding:3px 10px; border-radius:99px; font-size:11px; font-weight:500; }
  .ids-source      { font-size:11px; color:${T.creamFaint}; }
  .ids-description { font-size:13px; color:${T.creamDim}; line-height:1.7; margin-bottom:14px; }
  .ids-bar-row     { display:flex; align-items:center; gap:10px; margin-bottom:14px; }
  .ids-bar-bg      { flex:1; height:6px; border-radius:99px; background:${T.border}; overflow:hidden; }
  .ids-bar-fill    { height:100%; border-radius:99px; transition:width 0.6s ease; }
  .ids-bar-label   { font-size:11px; color:${T.creamDim}; white-space:nowrap; }
  .ids-vote-btn    {
    width:100%; padding:11px; border-radius:9px; border:1px solid ${T.blue}44;
    background:${T.blueLo}; color:${T.blueHi}; font-family:'DM Sans',sans-serif;
    font-size:13px; font-weight:500; cursor:pointer; display:flex; align-items:center;
    justify-content:center; gap:7px; transition:all 0.2s;
  }
  .ids-vote-btn:hover  { background:${T.blue}22; border-color:${T.blue}88; }
  .ids-vote-btn.voted  { background:${T.tealLo}; border-color:${T.teal}44; color:${T.tealHi}; cursor:default; }
  .ids-zk-note         { display:flex; align-items:center; gap:5px; font-size:10px; color:${T.creamFaint}; margin-top:6px; justify-content:center; }

  /* ── Section headers ── */
  .ids-section { border-bottom:1px solid ${T.border}; }
  .ids-section-head {
    padding:12px 16px 10px; display:flex; align-items:center; gap:8px;
    font-size:10px; font-weight:500; color:${T.creamFaint};
    text-transform:uppercase; letter-spacing:0.1em;
  }
  .ids-section-head span { flex:1; }
  .ids-count-chip {
    background:${T.surface}; border:1px solid ${T.border}; border-radius:99px;
    padding:1px 8px; font-size:10px; color:${T.creamDim};
  }

  /* ── Official response ── */
  .ids-official {
    margin:0 16px 14px; padding:14px; border-radius:10px;
    background:${T.tealLo}; border:1px solid ${T.teal}44;
    animation:fadeUp 0.3s ease;
  }
  .ids-official-head { display:flex; align-items:center; gap:8px; margin-bottom:8px; }
  .ids-official-badge {
    width:30px; height:30px; border-radius:8px; flex-shrink:0;
    display:flex; align-items:center; justify-content:center;
    font-size:11px; font-weight:600; background:${T.teal}33;
    color:${T.tealHi}; border:1px solid ${T.teal}44;
  }
  .ids-official-name  { font-size:13px; font-weight:500; color:${T.tealHi}; }
  .ids-official-role  { font-size:10px; color:${T.tealHi}; opacity:0.7; }
  .ids-official-body  { font-size:13px; color:${T.creamDim}; line-height:1.7; }
  .ids-reaction-row   { display:flex; gap:8px; margin-top:12px; }
  .ids-reaction-btn   {
    flex:1; padding:7px; border-radius:7px; font-family:'DM Sans',sans-serif;
    font-size:12px; cursor:pointer; border:1px solid ${T.border};
    background:transparent; color:${T.creamDim}; transition:all 0.15s;
    display:flex; align-items:center; justify-content:center; gap:5px;
  }
  .ids-reaction-btn:hover          { border-color:${T.borderHi}; color:${T.cream}; }
  .ids-reaction-btn.yes.active     { background:${T.tealLo}; border-color:${T.teal}44; color:${T.tealHi}; }
  .ids-reaction-btn.no.active      { background:${T.redLo}; border-color:${T.red}44; color:${T.redHi}; }
  .ids-awaiting {
    margin:0 16px 14px; padding:12px 14px; border-radius:9px;
    background:${T.surface}; border:1px solid ${T.border};
    display:flex; align-items:center; gap:8px; font-size:12px; color:${T.creamFaint};
  }
  .ids-pulse { width:6px; height:6px; border-radius:50%; background:${T.amberHi}; animation:pulse 1.4s ease infinite; flex-shrink:0; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }

  /* ── Expert answers ── */
  .ids-expert {
    margin:0 16px 10px; padding:13px 14px; border-radius:10px;
    background:${T.purpleLo}; border:1px solid ${T.purpleMid}44;
    animation:fadeUp 0.3s ease;
  }
  .ids-expert-head { display:flex; align-items:center; gap:8px; margin-bottom:7px; }
  .ids-expert-badge {
    width:28px; height:28px; border-radius:7px; flex-shrink:0;
    display:flex; align-items:center; justify-content:center;
    font-size:10px; font-weight:600; background:${T.purpleMid}33;
    color:${T.purpleHi}; border:1px solid ${T.purpleMid}44;
  }
  .ids-expert-name   { font-size:12px; font-weight:500; color:${T.purpleHi}; }
  .ids-expert-domain { font-size:10px; color:${T.purpleHi}; opacity:0.7; }
  .ids-expert-body   { font-size:13px; color:${T.creamDim}; line-height:1.7; }
  .ids-ask-expert-btn {
    margin:0 16px 14px; width:calc(100% - 32px); padding:10px;
    border-radius:8px; background:transparent; border:1px dashed ${T.purpleMid}66;
    color:${T.purpleHi}; font-family:'DM Sans',sans-serif; font-size:12px;
    cursor:pointer; transition:all 0.15s; display:flex; align-items:center;
    justify-content:center; gap:6px;
  }
  .ids-ask-expert-btn:hover { background:${T.purpleLo}; border-style:solid; }

  /* ── Replies ── */
  .ids-reply {
    padding:13px 16px; border-bottom:1px solid ${T.border};
    display:flex; gap:10px; animation:fadeUp 0.25s ease both;
  }
  .ids-reply-avatar {
    width:30px; height:30px; border-radius:8px; flex-shrink:0;
    display:flex; align-items:center; justify-content:center;
    font-size:11px; font-weight:600; background:${T.amberLo};
    color:${T.amberHi}; border:1px solid ${T.amberMid}44;
  }
  .ids-reply-name  { font-size:12px; font-weight:500; color:${T.cream}; }
  .ids-reply-time  { font-size:10px; color:${T.creamFaint}; margin-left:6px; }
  .ids-reply-body  { font-size:13px; color:${T.creamDim}; line-height:1.6; margin-top:3px; }
  .ids-reply-zk    { display:flex; align-items:center; gap:4px; font-size:10px; color:${T.tealHi}; margin-top:4px; opacity:0.7; }

  /* ── Compose ── */
  .ids-compose {
    border-top:1px solid ${T.border}; padding:10px 12px;
    background:${T.bg}; flex-shrink:0; display:flex; gap:8px; align-items:flex-end;
  }
  .ids-compose-input {
    flex:1; background:${T.surface}; border:1px solid ${T.border}; border-radius:10px;
    padding:9px 12px; font-family:'DM Sans',sans-serif; font-size:13px;
    color:${T.cream}; resize:none; outline:none; min-height:38px; max-height:100px;
    -webkit-overflow-scrolling:touch;
  }
  .ids-compose-input::placeholder { color:${T.creamFaint}; }
  .ids-compose-input:focus { border-color:${T.borderHi}; }
  .ids-compose-send {
    background:${T.amber}; border:none; border-radius:8px; padding:9px 14px;
    font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500;
    color:${T.bg}; cursor:pointer; flex-shrink:0; transition:opacity 0.15s;
  }
  .ids-compose-send:disabled { opacity:0.4; cursor:default; }

  /* ── Ask expert sheet ── */
  .ids-sheet-backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.65); z-index:100; }
  .ids-sheet-panel    { position:fixed; left:0; right:0; bottom:0; background:${T.surface}; border-radius:16px 16px 0 0; border-top:1px solid ${T.border}; max-height:85vh; overflow-y:auto; z-index:101; animation:slideUp 0.3s ease; padding:20px 16px 32px; }
  .ids-sheet-handle   { width:36px; height:4px; border-radius:99px; background:${T.border}; margin:0 auto 16px; }

  .ids-empty   { text-align:center; padding:24px 16px; color:${T.creamFaint}; font-size:12px; line-height:1.8; }
  .ids-spinner { width:16px; height:16px; border:2px solid ${T.border}; border-top-color:${T.amber}; border-radius:50%; animation:spin 0.8s linear infinite; margin:20px auto; }
  .ids-toast   { position:fixed; bottom:80px; left:50%; transform:translateX(-50%); background:${T.surface}; border:1px solid ${T.border}; border-radius:10px; padding:9px 18px; font-size:13px; color:${T.cream}; z-index:200; white-space:nowrap; }

  @media(max-width:767px) {
    .ids-issue-title { font-size:17px; }
    .ids-toast { bottom:90px; }
  }
  ::-webkit-scrollbar{width:3px;} ::-webkit-scrollbar-track{background:transparent;} ::-webkit-scrollbar-thumb{background:${T.border};border-radius:99px;}
`;

export default function IssueDetailScreen({ issueId, onBack, onNavigate }) {
  useCSS("ids-css", css);

  const [issue,          setIssue]          = useState(null);
  const [replies,        setReplies]        = useState([]);
  const [expertAnswers,  setExpertAnswers]  = useState([]);
  const [currentUser,    setCurrentUser]    = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [submitting,     setSubmitting]     = useState(false);
  const [replyText,      setReplyText]      = useState("");
  const [reaction,       setReaction]       = useState(null); // "yes" | "no" | null
  const [showAskExpert,  setShowAskExpert]  = useState(false);
  const [expertQ,        setExpertQ]        = useState("");
  const [sendingQ,       setSendingQ]       = useState(false);
  const [toast,          setToast]          = useState(null);
  const channelRef = useRef(null);
  const toastTimer = useRef(null);
  const bottomRef  = useRef(null);

  function showToast(msg) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }

  useEffect(() => {
    if (!issueId) return;
    load();
    // Realtime replies
    channelRef.current = supabase.channel(`issue-${issueId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "issue_replies",
        filter: `issue_id=eq.${issueId}`
      }, async (payload) => {
        const { data: prof } = await supabase.from("profiles")
          .select("display_name").eq("id", payload.new.author_id).maybeSingle();
        setReplies(prev => [...prev, { ...payload.new, profiles: prof }]);
      }).subscribe();

    return () => { if (channelRef.current) channelRef.current.unsubscribe(); };
  }, [issueId]);

  async function load() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      // Load issue
      const { data: iss } = await supabase.from("civic_issues")
        .select("*, neighborhoods(name), profiles(display_name)")
        .eq("id", issueId).maybeSingle();
      if (!iss) { onBack(); return; }

      // Check if user has voted
      let userHasVoted = false;
      if (user) {
        const { data: vote } = await supabase.from("votes")
          .select("id").eq("issue_id", issueId).eq("user_id", user.id).maybeSingle();
        userHasVoted = !!vote;
      }

      // Check official response reaction
      if (user && iss.official_response) {
        const { data: rxn } = await supabase.from("official_response_reactions")
          .select("addressed").eq("issue_id", issueId).eq("user_id", user.id).maybeSingle();
        if (rxn) setReaction(rxn.addressed ? "yes" : "no");
      }

      setIssue({ ...iss, user_has_voted: userHasVoted });

      // Load replies with author profiles
      const { data: reps } = await supabase.from("issue_replies")
        .select("*, profiles(display_name)")
        .eq("issue_id", issueId).order("created_at", { ascending: true });
      setReplies(reps || []);

      // Load expert answers linked to this issue
      const { data: answers } = await supabase.from("expert_answers")
        .select("*, profiles(display_name, domain, trust_tier)")
        .eq("issue_id", issueId).order("created_at", { ascending: true });
      setExpertAnswers(answers || []);

    } catch(e) {
      console.error("IssueDetailScreen load error:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleVote() {
    if (!currentUser || issue?.user_has_voted) return;

    // Get stored residency proof from onboarding
    const { data: residencyProof } = await supabase
      .from("residency_proofs")
      .select("proof_hash, expires_at")
      .eq("user_id", currentUser.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!residencyProof?.proof_hash) {
      showToast("Residency proof required to vote");
      return;
    }

    if (new Date(residencyProof.expires_at) < new Date()) {
      showToast("Residency proof expired — please re-verify");
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    const resp = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/vote-gate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          issueId:   issueId,
          proofHash: residencyProof.proof_hash,
        }),
      }
    );

    const result = await resp.json();

    if (!resp.ok) {
      if (resp.status === 409) {
        setIssue(prev => ({ ...prev, user_has_voted: true }));
      } else {
        showToast(result.error || "Vote failed");
      }
      return;
    }

    setIssue(prev => ({
      ...prev,
      user_has_voted: true,
      voice_count:    result.voiceCount  ?? (prev.voice_count  || 0) + 1,
      priority_pct:   result.priorityPct ?? Math.min(99, (prev.priority_pct || 0) + 3),
    }));
    showToast("Anonymous vote recorded ✓");
  }

  async function handleReply() {
    if (!replyText.trim() || !currentUser) return;
    setSubmitting(true);
    const body = replyText.trim();
    setReplyText("");
    const { error } = await supabase.from("issue_replies").insert({
      issue_id:  issueId,
      author_id: currentUser.id,
      body,
    });
    if (error) {
      showToast("Failed to post reply");
      setReplyText(body);
    } else {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
    setSubmitting(false);
  }

  async function handleReaction(val) {
    if (!currentUser || !issue?.official_response) return;
    const addressed = val === "yes";
    await supabase.from("official_response_reactions").upsert({
      issue_id: issueId, user_id: currentUser.id, addressed,
    }, { onConflict: "issue_id,user_id" });
    setReaction(val);
    showToast(addressed ? "Thanks for the feedback" : "Noted — we'll track this");
  }

  async function handleAskExpert() {
    if (!expertQ.trim() || !currentUser) return;
    setSendingQ(true);
    const { error } = await supabase.from("expert_questions").insert({
      author_id:       currentUser.id,
      issue_id:        issueId,
      neighborhood_id: issue?.neighborhood_id,
      question:        expertQ.trim(),
      domain:          "general",
    });
    setSendingQ(false);
    if (!error) {
      setExpertQ("");
      setShowAskExpert(false);
      showToast("Question sent to neighborhood experts");
    } else {
      showToast("Failed to send question");
    }
  }

  if (loading) return (
    <div className="ids-wrap" style={{ alignItems:"center", justifyContent:"center" }}>
      <div className="ids-spinner" />
    </div>
  );

  if (!issue) return null;

  const statusStyle = STATUS_COLORS[issue.status] || STATUS_COLORS.open;
  const pct = issue.priority_pct || 0;
  const barColor = pct > 75 ? T.coral : pct > 50 ? T.amber : T.blue;

  return (
    <div className="ids-wrap">
      {/* ── Header ── */}
      <div className="ids-header">
        <button className="ids-back" onClick={onBack}>← Back</button>
        <div className="ids-header-title">{issue.neighborhoods?.name || "Civic Issue"}</div>
      </div>

      <div className="ids-body">
        {/* ── Issue card ── */}
        <div className="ids-issue-card">
          <div className="ids-issue-title">{issue.title}</div>

          <div className="ids-issue-meta">
            <span className="ids-status-pill"
              style={{ background: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.color}44` }}>
              {statusStyle.label}
            </span>
            {issue.neighborhoods?.name && (
              <span className="ids-source">{issue.neighborhoods.name}</span>
            )}
            <span className="ids-source">· {timeAgo(issue.created_at)}</span>
          </div>

          {issue.description && (
            <div className="ids-description">{issue.description}</div>
          )}

          {issue.source_label && (
            <div style={{ fontSize:11, color:T.creamFaint, marginBottom:12 }}>
              {issue.source_label}
            </div>
          )}

          <div className="ids-bar-row">
            <div className="ids-bar-bg">
              <div className="ids-bar-fill" style={{ width: `${pct}%`, background: barColor }} />
            </div>
            <span className="ids-bar-label">{pct}% priority · {(issue.voice_count || 0).toLocaleString()} voices</span>
          </div>

          <button className={`ids-vote-btn${issue.user_has_voted ? " voted" : ""}`} onClick={handleVote}
            disabled={issue.user_has_voted || !currentUser}>
            {issue.user_has_voted
              ? <><CheckSm color={T.tealHi} /> You've prioritised this</>
              : <><UpIcon color={T.blueHi} /> Mark as priority · ZK verified</>
            }
          </button>
          {!issue.user_has_voted && (
            <div className="ids-zk-note">
              <CheckSm color={T.tealHi} /> Anonymous · residency verified
            </div>
          )}
        </div>

        {/* ── Official response ── */}
        <div className="ids-section">
          <div className="ids-section-head">
            <span>Official response</span>
          </div>
          {issue.official_response ? (
            <div style={{ padding:"0 0 4px" }}>
              <div className="ids-official">
                <div className="ids-official-head">
                  <div className="ids-official-badge">
                    {initials(issue.profiles?.display_name || "OF")}
                  </div>
                  <div>
                    <div className="ids-official-name">{issue.profiles?.display_name || "Official"}</div>
                    <div className="ids-official-role">Verified Official</div>
                  </div>
                  <div style={{ marginLeft:"auto", fontSize:10, color:T.creamFaint }}>
                    {timeAgo(issue.responded_at)}
                  </div>
                </div>
                <div className="ids-official-body">{issue.official_response}</div>

                {/* Resident reaction */}
                <div className="ids-reaction-row">
                  <button className={`ids-reaction-btn yes${reaction === "yes" ? " active" : ""}`}
                    onClick={() => handleReaction("yes")}>
                    <CheckSm color={reaction === "yes" ? T.tealHi : T.creamDim} />
                    Addresses my concern
                  </button>
                  <button className={`ids-reaction-btn no${reaction === "no" ? " active" : ""}`}
                    onClick={() => handleReaction("no")}>
                    Doesn't address it
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="ids-awaiting">
              <div className="ids-pulse" />
              Awaiting official response
            </div>
          )}
        </div>

        {/* ── Expert opinions ── */}
        <div className="ids-section">
          <div className="ids-section-head">
            <span>Expert opinions</span>
            {expertAnswers.length > 0 && (
              <span className="ids-count-chip">{expertAnswers.length}</span>
            )}
          </div>

          {expertAnswers.length === 0 ? (
            <div className="ids-empty">
              No expert opinions yet.<br />
              <span style={{ fontSize:11 }}>Ask a verified expert to weigh in on this issue.</span>
            </div>
          ) : (
            <div style={{ padding:"4px 0 8px" }}>
              {expertAnswers.map((ans, i) => (
                <div key={ans.id} className="ids-expert" style={{ animationDelay: i * 0.06 + "s" }}>
                  <div className="ids-expert-head">
                    <div className="ids-expert-badge">
                      {initials(ans.profiles?.display_name)}
                    </div>
                    <div>
                      <div className="ids-expert-name">{ans.profiles?.display_name || "Expert"}</div>
                      <div className="ids-expert-domain">{ans.profiles?.domain || "Verified Expert"}</div>
                    </div>
                    <div style={{ marginLeft:"auto", fontSize:10, color:T.creamFaint }}>
                      {timeAgo(ans.created_at)}
                    </div>
                  </div>
                  <div className="ids-expert-body">{ans.body}</div>
                </div>
              ))}
            </div>
          )}

          <button className="ids-ask-expert-btn" onClick={() => setShowAskExpert(true)}>
            <span style={{ fontSize:14 }}>✦</span> Ask an expert
          </button>
        </div>

        {/* ── Community replies ── */}
        <div className="ids-section">
          <div className="ids-section-head">
            <span>Community replies</span>
            {replies.length > 0 && (
              <span className="ids-count-chip">{replies.length}</span>
            )}
          </div>

          {replies.length === 0 ? (
            <div className="ids-empty">No replies yet. Be the first to weigh in.</div>
          ) : (
            replies.map((r, i) => (
              <div key={r.id} className="ids-reply" style={{ animationDelay: i * 0.04 + "s" }}>
                <div className="ids-reply-avatar">
                  {initials(r.profiles?.display_name)}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div>
                    <span className="ids-reply-name">{r.profiles?.display_name || "Resident"}</span>
                    <span className="ids-reply-time">{timeAgo(r.created_at)}</span>
                  </div>
                  <div className="ids-reply-body">{r.body}</div>
                  <div className="ids-reply-zk">
                    <CheckSm color={T.tealHi} /> residency verified
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Compose reply ── */}
      {currentUser && (
        <div className="ids-compose">
          <textarea
            className="ids-compose-input"
            placeholder="Reply to this issue…"
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
            rows={1}
          />
          <button className="ids-compose-send"
            onClick={handleReply}
            disabled={!replyText.trim() || submitting}>
            {submitting ? "…" : "Send"}
          </button>
        </div>
      )}

      {/* ── Ask expert sheet ── */}
      {showAskExpert && (
        <>
          <div className="ids-sheet-backdrop" onClick={() => setShowAskExpert(false)} />
          <div className="ids-sheet-panel">
            <div className="ids-sheet-handle" />
            <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:18, color:T.cream, marginBottom:6 }}>
              Ask an expert
            </div>
            <div style={{ fontSize:12, color:T.creamDim, lineHeight:1.7, marginBottom:16 }}>
              Your question will be sent to verified experts in your neighborhood. Questions are anonymous.
            </div>
            <div style={{ fontSize:11, color:T.purpleHi, background:T.purpleLo, border:`1px solid ${T.purpleMid}44`, borderRadius:8, padding:"8px 12px", marginBottom:14 }}>
              Re: {issue.title}
            </div>
            <textarea
              style={{ width:"100%", background:T.bg, border:`1px solid ${T.border}`, borderRadius:10, padding:"10px 12px", fontFamily:"'DM Sans',sans-serif", fontSize:13, color:T.cream, resize:"none", outline:"none", minHeight:90, boxSizing:"border-box" }}
              placeholder="What would you like an expert to address about this issue?"
              value={expertQ}
              onChange={e => setExpertQ(e.target.value)}
            />
            <button
              onClick={handleAskExpert}
              disabled={!expertQ.trim() || sendingQ}
              style={{ width:"100%", marginTop:12, padding:12, borderRadius:9, background:T.purple, border:"none", color:"#fff", fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:500, cursor:"pointer", opacity:!expertQ.trim()||sendingQ?0.5:1 }}>
              {sendingQ ? "Sending…" : "Send question"}
            </button>
          </div>
        </>
      )}

      {toast && <div className="ids-toast">{toast}</div>}
    </div>
  );
}
