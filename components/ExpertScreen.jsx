"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import ApplyExpert from "./ApplyExpert";

const T = {
  bg:         "#0F0E0C",
  surface:    "#1A1916",
  surfaceHi:  "#222019",
  border:     "#2C2A26",
  borderHi:   "#4A4640",
  cream:      "#F2EDE4",
  creamDim:   "#9A9188",
  creamFaint: "#4A4640",
  amber:      "#D4922A",
  amberLo:    "#2A1E08",
  amberMid:   "#8C5E14",
  amberHi:    "#F0B84A",
  teal:       "#1D9E75",
  tealLo:     "#0A2A1E",
  tealHi:     "#4CAF80",
  blue:       "#378ADD",
  blueLo:     "#0D1E35",
  blueHi:     "#85B7EB",
  purple:     "#7F77DD",
  purpleLo:   "#1A1835",
  purpleHi:   "#AFA9EC",
  purpleMid:  "#534AB7",
  coral:      "#D85A30",
  coralLo:    "#2A1008",
  coralHi:    "#F0997B",
  green:      "#2D6A4F",
  greenHi:    "#4CAF80",
  red:        "#C0392B",
  redLo:      "#2A0E0A",
};


const DOMAINS = [
  { key:"traffic",  label:"Traffic & transport",   color:T.amberHi,  bg:T.amberLo,  border:T.amberMid },
  { key:"arch",     label:"Architecture & zoning",  color:T.purpleHi, bg:T.purpleLo, border:T.purpleMid },
  { key:"fiscal",   label:"Budget & fiscal",        color:T.blueHi,   bg:T.blueLo,   border:T.blue },
  { key:"env",      label:"Environment",            color:T.tealHi,   bg:T.tealLo,   border:T.teal },
  { key:"legal",    label:"Local law & policy",     color:T.coralHi,  bg:T.coralLo,  border:T.coral },
  { key:"housing",  label:"Housing",                color:T.greenHi,  bg:"#0D2B1F",  border:T.green },
];

const TIERS = [
  { key:"resident",    label:"Resident",        req:"Verified",  pts:0,    color:T.creamDim, dot:T.borderHi },
  { key:"contributor", label:"Contributor",     req:"200 pts",   pts:200,  color:T.amberHi,  dot:T.amber },
  { key:"voice",       label:"Community voice", req:"600 pts",   pts:600,  color:T.blueHi,   dot:T.blue },
  { key:"moderator",   label:"Moderator",       req:"1200 pts",  pts:1200, color:T.purpleHi, dot:T.purple },
];

function domainStyle(key) { return DOMAINS.find(d=>d.key===key) || DOMAINS[0]; }

function timeAgo(d) {
  const s = Math.floor((Date.now()-new Date(d))/1000);
  if (s<60)    return "just now";
  if (s<3600)  return `${Math.floor(s/60)}m ago`;
  if (s<86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}
function initials(name) {
  if (!name) return "?";
  const p = name.trim().split(" ");
  return p.length>=2 ? `${p[0][0]}${p[p.length-1][0]}`.toUpperCase() : name.slice(0,2).toUpperCase();
}
const AV=[{bg:"#2A1E08",color:"#F0B84A"},{bg:"#0A2A1E",color:"#4CAF80"},{bg:"#1A1835",color:"#AFA9EC"},{bg:"#0D1E35",color:"#85B7EB"},{bg:"#2A0E0A",color:"#E57373"}];
function av(id){return AV[(id?id.charCodeAt(0):0)%AV.length];}

function LogoMark(){return<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="7" width="5" height="6" rx="1" fill={T.amber}/><rect x="8" y="4" width="5" height="9" rx="1" fill={T.amber} opacity="0.6"/><rect x="1" y="1" width="5" height="4" rx="1" fill={T.amber} opacity="0.4"/></svg>;}
function CheckIcon({color,size=12}){return<svg width={size} height={size} viewBox="0 0 12 12" fill="none"><path d="M2 6l2.5 2.5L10 3" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;}
function UpIcon({color}){return<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 9V3M3 6l3-3 3 3" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;}

// ── Score ring ────────────────────────────────────────────────────────────
function ScoreRing({score}){
  const max=1200, pct=Math.min(score/max,1);
  const r=46,cx=55,cy=55,circ=2*Math.PI*r,dash=pct*circ;
  const tierIdx=[...TIERS].reverse().findIndex(t=>score>=t.pts);
  const tier=TIERS[TIERS.length-1-(tierIdx===-1?TIERS.length-1:tierIdx)];
  return(
    <div className="score-ring-wrap">
      <div className="score-ring">
        <svg width="110" height="110" viewBox="0 0 110 110">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={T.border} strokeWidth="6"/>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={tier.dot} strokeWidth="6" strokeDasharray={`${dash} ${circ-dash}`} strokeLinecap="round" style={{transition:"stroke-dasharray 0.6s ease"}}/>
        </svg>
        <div className="score-ring-num"><div className="score-num" style={{color:tier.dot}}>{score}</div><div className="score-label">trust pts</div></div>
      </div>
      <div className="score-tier" style={{background:tier.dot+"22",color:tier.dot,border:`1px solid ${tier.dot}44`}}>{tier.label}</div>
    </div>
  );
}

// ── Expert Answer Block ───────────────────────────────────────────────────
function ExpertAnswerBlock({answer, onHelpful}){
  const [marked,setMarked]=useState(answer.user_marked_helpful||false);
  const [count,setCount]=useState(answer.helpful_count||0);
  const expertName=answer.profiles?.display_name||"Expert";
  const expertOrg=answer.profiles?.expert_org||"Verified expert";
  const a=av(answer.expert_id);
  async function markHelpful(){
    if(marked) return;
    setMarked(true); setCount(c=>c+1);
    await supabase.from("expert_answers").update({helpful_count:count+1}).eq("id",answer.id);
    if(onHelpful) onHelpful();
  }
  return(
    <div className="expert-answer">
      <div className="expert-answer-header">
        <div className="expert-av" style={{background:a.bg,color:a.color}}>{initials(expertName)}</div>
        <div><div className="expert-name">{expertName}</div><div style={{fontSize:11,color:T.creamDim}}>{expertOrg}</div></div>
        <div className="expert-cred"><div style={{width:8,height:8,borderRadius:"50%",background:T.purpleHi}}/>Verified expert</div>
      </div>
      <div className="expert-answer-body">{answer.body}</div>
      <div className="expert-answer-footer">
        <span>{timeAgo(answer.created_at)}</span>
        <button className={`q-btn${marked?" voted":""}`} style={{padding:"3px 8px",fontSize:11}} onClick={markHelpful}>
          <UpIcon color={marked?T.amberHi:T.creamFaint}/> Helpful ({count})
        </button>
      </div>
    </div>
  );
}

// ── Question Card ─────────────────────────────────────────────────────────
function QuestionCard({q, isExpert, currentUserId, onUpvote, onAnswer, isNew}){
  const dom=domainStyle(q.domain);
  const name=q.profiles?.display_name||"Resident";
  const a=av(q.author_id);
  return(
    <div className={`q-card${isNew?" new-card":""}`}>
      <div className="q-meta">
        <div className="q-avatar" style={{background:a.bg,color:a.color}}>{initials(name)}</div>
        <div><div className="q-author">{name}{q.author_id===currentUserId&&<span style={{fontSize:10,color:T.amberHi,marginLeft:6}}>you</span>}</div></div>
        <div className="q-time">{timeAgo(q.created_at)}</div>
      </div>
      <div className="q-domain-tag" style={{background:dom.bg,color:dom.color,border:`1px solid ${dom.border}`}}>{dom.label}</div>
      <div className="q-body">{q.body}</div>

      {/* Expert answers */}
      {(q.expert_answers||[]).map(ans=>(
        <ExpertAnswerBlock key={ans.id} answer={ans}/>
      ))}

      {/* Answer compose */}
      {q.answering&&(
        <div className="answering-box">
          <div style={{fontSize:12,color:T.purpleHi,marginBottom:8,fontWeight:500}}>Responding as verified expert</div>
          <textarea className="answer-textarea" rows={4} placeholder="Share your expert perspective…"
            value={q.answerDraft||""} onChange={e=>onAnswer(q.id,"draft",e.target.value)}/>
          <div className="answer-submit-row">
            <button className="cancel-btn" onClick={()=>onAnswer(q.id,"cancel")}>Cancel</button>
            <button className="submit-btn" disabled={!(q.answerDraft||"").trim()} onClick={()=>onAnswer(q.id,"submit")}>Post expert answer</button>
          </div>
        </div>
      )}

      <div className="q-actions">
        <button className={`q-btn${q.user_has_upvoted?" voted":""}`} onClick={()=>onUpvote(q)}>
          <UpIcon color={q.user_has_upvoted?T.amberHi:T.creamDim}/>{q.upvote_count||0}
        </button>
        <button className="q-btn">Share</button>
        {isExpert&&!(q.expert_answers||[]).length&&!q.answering&&(
          <button className="q-btn answer-btn" onClick={()=>onAnswer(q.id,"open")}>Answer as expert →</button>
        )}
        {!isExpert&&!(q.expert_answers||[]).length&&(
          <span style={{marginLeft:"auto",fontSize:11,color:T.creamFaint}}>Awaiting expert response</span>
        )}
        {(q.expert_answers||[]).length>0&&(
          <span style={{marginLeft:"auto",fontSize:11,color:T.tealHi,display:"flex",alignItems:"center",gap:4}}>
            <CheckIcon color={T.tealHi}/> Expert answered
          </span>
        )}
      </div>
    </div>
  );
}

// ── Apply Panel — sheet wrapping ApplyExpert ─────────────────────────────
function ApplyPanel({onClose, onSuccess}){
  return(
    <>
      <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.65)",zIndex:100}}/>
      <div style={{position:"fixed",left:0,right:0,bottom:0,background:T.surface,borderRadius:"16px 16px 0 0",borderTop:`1px solid ${T.border}`,maxHeight:"90vh",overflowY:"auto",zIndex:101}}>
        <div style={{width:36,height:4,borderRadius:99,background:T.border,margin:"12px auto 0"}}/>
        <ApplyExpert onClose={onClose} onSuccess={onSuccess}/>
      </div>
    </>
  );
}
// ── Trust Panel ───────────────────────────────────────────────────────────
function TrustPanel({profile}){
  const score=profile?.trust_score||0;
  const tier=profile?.trust_tier||"resident";
  const tierIdx=TIERS.findIndex(t=>t.key===tier);
  const nextTier=TIERS[tierIdx+1];
  return(
    <div className="trust-panel">
      <div className="trust-header"><div className="trust-title">Your reputation</div><div className="trust-sub">ZK verified resident</div></div>
      <div className="trust-body">
        <ScoreRing score={score}/>
        {nextTier&&<div style={{textAlign:"center",fontSize:12,color:T.creamDim,marginTop:-8}}>{nextTier.pts-score} pts to <span style={{color:nextTier.dot,fontWeight:500}}>{nextTier.label}</span></div>}
        <div>
          <div className="section-label">Trust ladder</div>
          <div className="tier-ladder">
            {TIERS.map((t,i)=>{
              const isCurrent=t.key===tier, isLocked=i>tierIdx;
              return(
                <div key={t.key} className={`tier-row${isCurrent?" current":isLocked?" locked":""}`}>
                  <div className="tier-dot" style={{background:t.dot}}/>
                  <div><div className="tier-name" style={{color:t.color}}>{t.label}</div></div>
                  <div className="tier-req">{t.req}</div>
                  {isCurrent&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:99,background:T.amberLo,color:T.amberHi,border:`1px solid ${T.amberMid}`}}>Current</span>}
                  {!isLocked&&!isCurrent&&<CheckIcon color={T.tealHi} size={12}/>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────
export default function ExpertScreen({ onNavigate }){
  const [tab,       setTab]       = useState("questions");
  const [questions, setQuestions] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [askDraft,  setAskDraft]  = useState("");
  const [askDomain, setAskDomain] = useState("traffic");
  const [asking,    setAsking]    = useState(false);
  const [isExpert,  setIsExpert]  = useState(false);
  const [showApply, setShowApply] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [profile,   setProfile]   = useState(null);
  const [neighborhood,setNeighborhood]=useState("Riverdale");
  const [toast,     setToast]     = useState(null);
  const [newQIds,   setNewQIds]   = useState([]);
  const toastTimer  = useRef(null);
  const channelRef  = useRef(null);

  function showToast(msg,dot=T.amberHi){
    if(toastTimer.current) clearTimeout(toastTimer.current);
    setToast({msg,dot});
    toastTimer.current=setTimeout(()=>setToast(null),3000);
  }

  useEffect(()=>{
    async function init(){
      const {data:{user}}=await supabase.auth.getUser();
      if(user){
        setCurrentUser(user);
        setNeighborhood(user.user_metadata?.neighborhood||"Riverdale");
        const {data:prof}=await supabase.from("profiles").select("*").eq("id",user.id).single();
        if(prof){ setProfile(prof); setIsExpert(prof.is_expert||false); }
      }
      await loadQuestions(user);
      setLoading(false);
    }
    init();

    channelRef.current=supabase.channel("expert-rt")
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"expert_questions"},async(payload)=>{
        const {data}=await supabase.from("expert_questions").select("*, profiles(display_name,expert_org,is_expert), expert_answers(*, profiles(display_name,expert_org))").eq("id",payload.new.id).single();
        if(data){
          setPosts(prev=>[{...data,answering:false,answerDraft:""},...prev]);
          setNewQIds(ids=>[...ids,data.id]);
          setTimeout(()=>setNewQIds(ids=>ids.filter(i=>i!==data.id)),1500);
        }
      })
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"expert_answers"},async(payload)=>{
        const {data:ans}=await supabase.from("expert_answers").select("*, profiles(display_name,expert_org)").eq("id",payload.new.id).single();
        if(ans){
          setQuestions(qs=>qs.map(q=>q.id===payload.new.question_id?{...q,expert_answers:[...(q.expert_answers||[]),ans]}:q));
        }
      })
      .subscribe();

    return()=>{if(channelRef.current)channelRef.current.unsubscribe();};
  },[]);

  function setPosts(fn){ setQuestions(fn); } // alias for realtime handler

  async function loadQuestions(user){
    const {data}=await supabase.from("expert_questions")
      .select("*, profiles(display_name,expert_org,is_expert), expert_answers(*, profiles(display_name,expert_org))")
      .order("created_at",{ascending:false}).limit(30);
    if(!data) return;

    // Check upvotes
    if(user&&data.length){
      const {data:upvotes}=await supabase.from("question_upvotes").select("question_id").eq("user_id",user.id).in("question_id",data.map(q=>q.id));
      const set=new Set((upvotes||[]).map(u=>u.question_id));
      data.forEach(q=>{q.user_has_upvoted=set.has(q.id); q.answering=false; q.answerDraft="";});
    } else {
      data.forEach(q=>{q.answering=false;q.answerDraft="";});
    }
    setQuestions(data);
  }

  async function handleAsk(){
    if(!askDraft.trim()||asking) return;
    setAsking(true);
    const {data:{user}}=await supabase.auth.getUser();
    if(!user){showToast("Please sign in");setAsking(false);return;}
    const {error}=await supabase.from("expert_questions").insert({
      author_id:user.id, domain:askDomain, body:askDraft.trim(), upvote_count:0, answered:false,
    });
    if(error){showToast("Failed to post — "+error.message);}
    else{setAskDraft("");showToast("Question posted · experts notified",T.purpleHi);}
    setAsking(false);
  }

  async function handleUpvote(q){
    if(!currentUser) return;
    if(q.user_has_upvoted){
      await supabase.from("question_upvotes").delete().match({user_id:currentUser.id,question_id:q.id});
      setQuestions(qs=>qs.map(x=>x.id===q.id?{...x,user_has_upvoted:false,upvote_count:Math.max(0,(x.upvote_count||1)-1)}:x));
    } else {
      await supabase.from("question_upvotes").insert({user_id:currentUser.id,question_id:q.id});
      setQuestions(qs=>qs.map(x=>x.id===q.id?{...x,user_has_upvoted:true,upvote_count:(x.upvote_count||0)+1}:x));
    }
  }

  function handleAnswer(id,action,value){
    if(action==="open"){
      setQuestions(qs=>qs.map(q=>q.id===id?{...q,answering:true}:q));
    } else if(action==="cancel"){
      setQuestions(qs=>qs.map(q=>q.id===id?{...q,answering:false,answerDraft:""}:q));
    } else if(action==="draft"){
      setQuestions(qs=>qs.map(q=>q.id===id?{...q,answerDraft:value}:q));
    } else if(action==="submit"){
      const q=questions.find(x=>x.id===id);
      if(!(q?.answerDraft||"").trim()) return;
      submitAnswer(id,q.answerDraft);
    }
  }

  async function submitAnswer(questionId,body){
    const {data:{user}}=await supabase.auth.getUser();
    if(!user) return;
    const {error}=await supabase.from("expert_answers").insert({
      question_id:questionId, expert_id:user.id, body, helpful_count:0,
    });
    if(error){showToast("Failed to post answer — "+error.message);return;}
    // Mark question as answered
    await supabase.from("expert_questions").update({answered:true}).eq("id",questionId);
    setQuestions(qs=>qs.map(q=>q.id===questionId?{...q,answering:false,answerDraft:"",answered:true}:q));
    showToast("Expert answer posted",T.purpleHi);
    // Award trust points
    if(profile){
      const newScore=(profile.trust_score||0)+40;
      await supabase.from("profiles").update({trust_score:newScore}).eq("id",user.id);
      setProfile(p=>({...p,trust_score:newScore}));
    }
  }


  const displayed = tab==="unanswered"
    ? questions.filter(q=>!(q.expert_answers||[]).length)
    : questions;

  const userInit=initials(currentUser?.user_metadata?.display_name||currentUser?.email||"?");

  return(
    <>
      {/* Two-column: Q&A + trust panel */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 260px", height:"100%", overflow:"hidden" }}>

        {/* Main Q&A column */}
        <div className="main">
          <div className="panel-header">
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div>
                <div className="panel-title">{tab==="roster"?<><em>Expert</em> roster</>:<><em>Expert</em> Q&amp;A</>}</div>
                <div className="panel-sub">
                  {tab==="roster"
                    ? "Apply to join as a verified expert"
                    : `${questions.filter(q=>!(q.expert_answers||[]).length).length} awaiting answer · credentialed experts only`}
                </div>
              </div>
              <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:8 }}>
                {isExpert
                  ? <div className="expert-mode-badge"><CheckIcon color={T.purpleHi}/> Expert mode</div>
                  : <button className="apply-btn" onClick={()=>{setShowApply(true);setTab("roster");}}>Apply as expert</button>
                }
              </div>
            </div>
          </div>

          <div className="tab-bar">
            <div className={`tab-item${tab==="questions"?" active":""}`} onClick={()=>setTab("questions")}>All questions</div>
            <div className={`tab-item${tab==="unanswered"?" active":""}`} onClick={()=>setTab("unanswered")}>
              Unanswered ({questions.filter(q=>!(q.expert_answers||[]).length).length})
            </div>
            <div className={`tab-item${tab==="roster"?" active":""}`} onClick={()=>setTab("roster")}>Expert roster</div>
          </div>

          {(tab==="questions"||tab==="unanswered")&&(
            <div className="ask-box">
              <textarea className="ask-area" rows={2} placeholder="Ask a question for the expert panel…" value={askDraft}
                onChange={e=>setAskDraft(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter"&&(e.metaKey||e.ctrlKey))handleAsk();}}/>
              <div className="ask-row">
                <div className="ask-domain-row">
                  {DOMAINS.map(d=>(
                    <div key={d.key} className={`domain-chip${askDomain===d.key?" sel":""}`} onClick={()=>setAskDomain(d.key)}>{d.label}</div>
                  ))}
                </div>
                <button className="ask-btn" disabled={!askDraft.trim()||asking} onClick={handleAsk}>
                  {asking?"Posting…":"Ask"}
                </button>
              </div>
            </div>
          )}

          {(tab==="questions"||tab==="unanswered")&&(
            loading
              ? <div className="th-loading"><div className="th-spinner"/>Loading questions…</div>
              : displayed.length===0
                ? <div className="th-empty">No questions yet.<br/>Ask the first one above.</div>
                : displayed.map(q=>(
                    <QuestionCard key={q.id} q={q}
                      isExpert={isExpert}
                      currentUserId={currentUser?.id}
                      onUpvote={handleUpvote}
                      onAnswer={handleAnswer}
                      isNew={newQIds.includes(q.id)}
                    />
                  ))
          )}

          {tab==="roster"&&(
            <>
              {showApply&&(
                <div style={{padding:"16px 22px 0"}}>
                  <ApplyPanel
                    onClose={()=>setShowApply(false)}
                    onSuccess={()=>{
                      setIsExpert(true);
                      setTimeout(()=>{setShowApply(false);setTab("questions");},1800);
                      showToast("Expert status granted",T.purpleHi);
                    }}
                  />
                </div>
              )}
              {!showApply&&!isExpert&&(
                <div style={{padding:"16px 22px 0"}}>
                  <button className="ask-btn" style={{width:"100%",padding:12}} onClick={()=>setShowApply(true)}>
                    Apply to join as an expert →
                  </button>
                </div>
              )}
              <div className="expert-roster">
                {questions.filter(q=>(q.expert_answers||[]).length>0).flatMap(q=>q.expert_answers).filter((a,i,arr)=>arr.findIndex(x=>x.expert_id===a.expert_id)===i).map((ans,i)=>{
                  const name=ans.profiles?.display_name||"Expert";
                  const org=ans.profiles?.expert_org||"Verified expert";
                  const a=av(ans.expert_id);
                  return(
                    <div key={ans.expert_id} className="expert-card verified" style={{animationDelay:`${i*0.07}s`}}>
                      <div className="expert-card-av" style={{background:a.bg,color:a.color}}>{initials(name)}</div>
                      <div style={{flex:1}}>
                        <div className="expert-card-name">{name}</div>
                        <div className="expert-card-role">{org}</div>
                        <div className="expert-chips">
                          <span className="expert-chip chip-verified">Verified</span>
                          <span className="expert-chip chip-online">Active</span>
                        </div>
                      </div>
                      <div className="expert-stat">
                        <div className="expert-stat-num">{questions.filter(q=>(q.expert_answers||[]).some(a=>a.expert_id===ans.expert_id)).length}</div>
                        <div className="expert-stat-label">answers</div>
                      </div>
                    </div>
                  );
                })}
                {questions.filter(q=>(q.expert_answers||[]).length>0).length===0&&(
                  <div className="th-empty">No experts have answered yet.<br/>Be the first to apply.</div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Right: trust panel — hidden on mobile */}
        <TrustPanel profile={profile}/>

      </div>

      {toast&&<div className="th-toast"><div className="th-toast-dot" style={{background:toast.dot}}/>{toast.msg}</div>}
    </>
  );
}
