"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const T = {
  bg:"#0F0E0C", surface:"#1A1916", border:"#2C2A26",
  cream:"#F2EDE4", creamDim:"#9A9188", creamFaint:"#4A4640",
  amber:"#D4922A", amberLo:"#2A1E08", amberMid:"#8C5E14", amberHi:"#F0B84A",
  teal:"#1D9E75", tealLo:"#0A2A1E", tealHi:"#4CAF80",
  blue:"#378ADD", blueLo:"#0D1E35", blueHi:"#85B7EB",
  purple:"#7F77DD", purpleLo:"#1A1835", purpleHi:"#AFA9EC",
};

// Each step targets a CSS selector and shows a tooltip
const STEPS = [
  {
    id:      "welcome",
    title:   "Welcome to Townhall Café ☕",
    body:    "Where you can have a coffee break with the mayor. This quick tour shows you how to get the most out of your neighborhood platform.",
    position: "center",
    icon:    "☕",
  },
  {
    id:      "feed",
    title:   "The Banter Feed",
    body:    "This is your neighborhood's public square. Share observations, ask questions, post bulletins. Keep it civil — your neighbors are reading.",
    target:  ".th-feed-header",
    position: "bottom",
    icon:    "📋",
  },
  {
    id:      "compose",
    title:   "Post something",
    body:    "Type in the box and hit Post. Tag your post as Banter, Issue, Question, or Bulletin so neighbors know what kind of response you're looking for.",
    target:  ".th-compose",
    position: "bottom",
    icon:    "✏️",
  },
  {
    id:      "escalate",
    title:   "Escalate to Civic",
    body:    "See a real problem that needs official attention? Hit Escalate on any post. It moves the issue to the Civic tracker where residents can prioritize it with verified votes.",
    target:  ".th-action-btn.escalate-btn",
    position: "top",
    icon:    "⬆️",
  },
  {
    id:      "civic",
    title:   "Civic Issues Tracker",
    body:    "Issues escalated from the feed appear here. Vote to prioritize them — your vote is anonymous and verified by your ZK residency proof. Officials can see which issues matter most.",
    target:  ".th-tracker",
    position: "left",
    icon:    "🏛️",
  },
  {
    id:      "expert",
    title:   "Expert Q&A",
    body:    "Got a question about zoning, housing law, traffic signals, or the city budget? Ask the expert panel. Verified professionals in each domain answer questions from residents.",
    position: "center",
    icon:    "🎓",
    tab:     "expert",
  },
  {
    id:      "alerts",
    title:   "Notifications & Officials",
    body:    "Get notified when experts answer your questions, when officials respond to civic issues you care about, and when your trust score hits a new tier. Officials can also join here.",
    position: "center",
    icon:    "🔔",
    tab:     "alerts",
  },
  {
    id:      "profile",
    title:   "Your Trust Score",
    body:    "Every post, upvote, expert answer, and civic vote builds your trust score. Higher tiers unlock more influence on the platform. Your ZK proof keeps it honest.",
    position: "center",
    icon:    "⭐",
    tab:     "profile",
  },
  {
    id:      "done",
    title:   "You're all set",
    body:    "That's everything. Your neighborhood is waiting — go say hello. If you ever need a refresher, find the Help section in your profile.",
    position: "center",
    icon:    "✓",
  },
];

function useCSS(id, css) {
  if (typeof window === "undefined") return;
  let el = document.getElementById(id);
  if (!el) { el = document.createElement("style"); el.id = id; document.head.appendChild(el); }
  el.textContent = css;
}

const css = `
  @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes slideUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse   { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }

  .wt-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.72);
    z-index: 1000;
    animation: fadeIn 0.3s ease;
  }

  .wt-tooltip {
    position: fixed;
    z-index: 1001;
    background: ${T.surface};
    border: 1px solid ${T.border};
    border-radius: 14px;
    padding: 20px 22px 18px;
    max-width: 320px;
    width: calc(100vw - 48px);
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    animation: slideUp 0.3s ease;
  }

  .wt-tooltip.center {
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .wt-tooltip.bottom {
    top: var(--target-bottom, 50%);
    left: 50%;
    transform: translateX(-50%);
    margin-top: 12px;
  }

  .wt-tooltip.top {
    bottom: calc(100vh - var(--target-top, 50%) + 12px);
    left: 50%;
    transform: translateX(-50%);
  }

  .wt-tooltip.left {
    top: 50%;
    right: calc(100vw - var(--target-left, 50%) + 12px);
    transform: translateY(-50%);
  }

  .wt-icon {
    font-size: 28px;
    margin-bottom: 10px;
    display: block;
    animation: pulse 1s ease infinite;
  }

  .wt-title {
    font-family: 'DM Serif Display', serif;
    font-size: 17px;
    color: ${T.cream};
    margin-bottom: 8px;
    line-height: 1.3;
  }

  .wt-body {
    font-size: 13px;
    color: ${T.creamDim};
    line-height: 1.7;
    margin-bottom: 16px;
  }

  .wt-footer {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .wt-progress {
    display: flex;
    gap: 4px;
    flex: 1;
  }

  .wt-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${T.border};
    transition: background 0.2s;
  }

  .wt-dot.active { background: ${T.amber}; }
  .wt-dot.done   { background: ${T.teal}; }

  .wt-skip {
    background: transparent;
    border: none;
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    color: ${T.creamFaint};
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 6px;
    transition: color 0.15s;
  }
  .wt-skip:hover { color: ${T.creamDim}; }

  .wt-next {
    background: ${T.amber};
    color: ${T.bg};
    border: none;
    border-radius: 8px;
    padding: 8px 18px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
    white-space: nowrap;
  }
  .wt-next:hover { background: ${T.amberHi}; }
  .wt-next.final { background: ${T.teal}; }
  .wt-next.final:hover { background: ${T.tealHi}; }

  .wt-spotlight {
    position: fixed;
    border-radius: 8px;
    box-shadow: 0 0 0 9999px rgba(0,0,0,0.72);
    z-index: 1000;
    pointer-events: none;
    transition: all 0.4s ease;
    border: 2px solid ${T.amberHi};
  }
`;

export default function Walkthrough({ onNavigate, onComplete }) {
  useCSS("walkthrough-css", css);

  const [step,    setStep]    = useState(0);
  const [visible, setVisible] = useState(true);
  const [rect,    setRect]    = useState(null);

  const current = STEPS[step];
  const isLast  = step === STEPS.length - 1;

  useEffect(() => {
    if (current.target) {
      const el = document.querySelector(current.target);
      if (el) {
        setRect(el.getBoundingClientRect());
        el.scrollIntoView({ behavior:"smooth", block:"center" });
      } else {
        setRect(null);
      }
    } else {
      setRect(null);
    }

    // Navigate to the right tab if needed
    if (current.tab && onNavigate) {
      onNavigate(current.tab);
    }
  }, [step]);

  function next() {
    if (isLast) {
      finish();
    } else {
      setStep(s => s + 1);
    }
  }

  function finish() {
    setVisible(false);
    // Mark walkthrough as seen in localStorage
    try { localStorage.setItem("th_walkthrough_done", "1"); } catch(e) {}
    // Update profile to mark onboarded
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from("profiles").update({ onboarded:true }).eq("id", user.id).then(() => {});
      }
    });
    if (onComplete) onComplete();
  }

  if (!visible) return null;

  // Compute tooltip position
  const tooltipStyle = {};
  if (current.position === "bottom" && rect) {
    tooltipStyle["--target-bottom"] = `${rect.bottom + window.scrollY}px`;
  }
  if (current.position === "top" && rect) {
    tooltipStyle["--target-top"] = `${rect.top + window.scrollY}px`;
  }
  if (current.position === "left" && rect) {
    tooltipStyle["--target-left"] = `${rect.left}px`;
  }

  return (
    <>
      <div className="wt-backdrop" onClick={() => {}}/>

      {/* Spotlight on target element */}
      {rect && (
        <div className="wt-spotlight" style={{
          top:    rect.top - 4,
          left:   rect.left - 4,
          width:  rect.width + 8,
          height: rect.height + 8,
        }}/>
      )}

      {/* Tooltip */}
      <div className={`wt-tooltip ${current.position}`} style={tooltipStyle}>
        <span className="wt-icon">{current.icon}</span>
        <div className="wt-title">{current.title}</div>
        <div className="wt-body">{current.body}</div>

        <div className="wt-footer">
          <div className="wt-progress">
            {STEPS.map((_, i) => (
              <div key={i} className={`wt-dot${i === step ? " active" : i < step ? " done" : ""}`}/>
            ))}
          </div>
          <button className="wt-skip" onClick={finish}>Skip</button>
          <button className={`wt-next${isLast ? " final" : ""}`} onClick={next}>
            {isLast ? "Let's go →" : "Next →"}
          </button>
        </div>
      </div>
    </>
  );
}
