"use client";
import { useState, useEffect, useRef } from "react";

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
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: ${T.bg};
    color: ${T.cream};
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    min-height: 100vh;
  }

  @keyframes fadeUp   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
  @keyframes popIn    { 0%{transform:scale(0.9);opacity:0} 70%{transform:scale(1.02)} 100%{transform:scale(1);opacity:1} }
  @keyframes slideIn  { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
  @keyframes spin     { to{transform:rotate(360deg)} }
  @keyframes fillBar  { from{width:0} to{width:var(--w)} }
  @keyframes trustTick{ 0%{transform:scale(1)} 40%{transform:scale(1.18)} 100%{transform:scale(1)} }
  @keyframes shimmer  {
    0%   { background-position: -600px 0; }
    100% { background-position:  600px 0; }
  }
  @keyframes scanline {
    from { top: -2px; }
    to   { top: 100%; }
  }
  @keyframes glow {
    0%,100% { box-shadow: 0 0 0 0 ${T.purpleMid}44; }
    50%      { box-shadow: 0 0 0 6px ${T.purpleMid}00; }
  }

  /* ── Layout ── */
  .app {
    display: grid;
    grid-template-columns: 220px 1fr 300px;
    grid-template-rows: 52px 1fr;
    height: 100vh;
    overflow: hidden;
  }

  /* ── Topbar ── */
  .topbar {
    grid-column: 1/-1;
    background: ${T.surface};
    border-bottom: 1px solid ${T.border};
    display: flex; align-items: center;
    padding: 0 20px; gap: 14px;
  }
  .logo {
    display:flex;align-items:center;gap:9px;
    font-family:'DM Serif Display',serif;
    font-size:16px;color:${T.cream};flex-shrink:0;
  }
  .logo-mark {
    width:26px;height:26px;border:1.5px solid ${T.amber};
    border-radius:6px;display:flex;align-items:center;justify-content:center;
  }
  .topbar-pill {
    display:flex;align-items:center;gap:7px;
    padding:4px 12px;border-radius:99px;
    font-size:12px;cursor:pointer;
  }
  .pill-amber { background:${T.amberLo};border:1px solid ${T.amberMid};color:${T.amberHi}; }
  .pill-purple{ background:${T.purpleLo};border:1px solid ${T.purpleMid};color:${T.purpleHi}; }
  .pill-dot   { width:6px;height:6px;border-radius:50%; }
  .topbar-right{ margin-left:auto;display:flex;align-items:center;gap:10px; }
  .avatar {
    width:30px;height:30px;border-radius:8px;
    background:${T.amberLo};border:1px solid ${T.amberMid};
    display:flex;align-items:center;justify-content:center;
    font-family:'DM Serif Display',serif;font-size:12px;color:${T.amberHi};
  }

  /* ── Sidebar ── */
  .sidebar {
    background:${T.surface};border-right:1px solid ${T.border};
    padding:16px 0;overflow-y:auto;
  }
  .sidebar-section {
    padding:4px 16px 2px;font-size:10px;font-weight:500;
    color:${T.creamFaint};text-transform:uppercase;
    letter-spacing:0.1em;margin-top:12px;
  }
  .nav-item {
    display:flex;align-items:center;gap:10px;
    padding:8px 16px;cursor:pointer;font-size:13px;
    color:${T.creamDim};transition:all 0.15s;
    border-left:2px solid transparent;
  }
  .nav-item:hover{color:${T.cream};background:${T.surfaceHi};}
  .nav-item.active{color:${T.purple};border-left-color:${T.purple};background:${T.purpleLo};}
  .nav-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;}
  .nav-badge{
    margin-left:auto;background:${T.purpleLo};
    border:1px solid ${T.purpleMid};border-radius:99px;
    padding:1px 7px;font-size:10px;color:${T.purpleHi};
  }

  /* ── Main panel ── */
  .main { overflow-y:auto; display:flex; flex-direction:column; }

  .panel-header {
    padding:16px 22px 14px;border-bottom:1px solid ${T.border};
    position:sticky;top:0;background:${T.bg};z-index:10;
  }
  .panel-title {
    font-family:'DM Serif Display',serif;
    font-size:20px;color:${T.cream};margin-bottom:3px;
  }
  .panel-title em { font-style:italic;color:${T.purpleHi}; }
  .panel-sub { font-size:12px;color:${T.creamDim}; }

  /* ── Tab bar ── */
  .tab-bar {
    display:flex;gap:0;border-bottom:1px solid ${T.border};
    background:${T.bg};position:sticky;top:57px;z-index:9;
  }
  .tab-item {
    padding:10px 20px;font-size:13px;color:${T.creamDim};
    cursor:pointer;border-bottom:2px solid transparent;
    transition:all 0.15s;white-space:nowrap;
  }
  .tab-item:hover{color:${T.cream};}
  .tab-item.active{color:${T.purpleHi};border-bottom-color:${T.purple};}

  /* ── Ask box ── */
  .ask-box {
    padding:16px 22px;border-bottom:1px solid ${T.border};
  }
  .ask-area {
    width:100%;background:${T.surface};
    border:1px solid ${T.border};border-radius:10px;
    padding:12px 14px;font-family:'DM Sans',sans-serif;
    font-size:13px;color:${T.cream};outline:none;resize:none;
    transition:border-color 0.2s;line-height:1.6;
  }
  .ask-area:focus{border-color:${T.purple};}
  .ask-area::placeholder{color:${T.creamFaint};}
  .ask-row {
    display:flex;align-items:center;gap:10px;margin-top:10px;
  }
  .ask-domain-row {
    display:flex;gap:6px;flex-wrap:wrap;flex:1;
  }
  .domain-chip {
    padding:3px 11px;border-radius:99px;font-size:11px;
    cursor:pointer;border:1px solid ${T.border};
    color:${T.creamDim};transition:all 0.15s;
  }
  .domain-chip:hover{border-color:${T.borderHi};color:${T.cream};}
  .domain-chip.sel{background:${T.purpleLo};border-color:${T.purpleMid};color:${T.purpleHi};}
  .ask-btn {
    background:${T.purple};color:#fff;border:none;
    border-radius:8px;padding:8px 18px;
    font-family:'DM Sans',sans-serif;font-size:13px;
    font-weight:500;cursor:pointer;transition:all 0.2s;
    white-space:nowrap;
  }
  .ask-btn:hover{background:${T.purpleHi};color:${T.bg};}
  .ask-btn:disabled{opacity:0.4;cursor:not-allowed;}

  /* ── Question thread ── */
  .q-card {
    padding:18px 22px;border-bottom:1px solid ${T.border};
    animation:fadeUp 0.3s ease both;
    transition:background 0.15s;
  }
  .q-card:hover{background:${T.surfaceHi}22;}
  .q-card.new-card{animation:popIn 0.4s ease both;}

  .q-meta {
    display:flex;align-items:center;gap:8px;margin-bottom:10px;
  }
  .q-avatar {
    width:32px;height:32px;border-radius:8px;flex-shrink:0;
    display:flex;align-items:center;justify-content:center;
    font-size:12px;font-weight:500;
  }
  .q-author{font-size:13px;font-weight:500;color:${T.cream};}
  .q-hood{font-size:11px;color:${T.creamDim};}
  .q-time{font-size:11px;color:${T.creamFaint};margin-left:auto;}

  .q-domain-tag {
    display:inline-flex;align-items:center;gap:4px;
    padding:2px 9px;border-radius:99px;font-size:11px;
    font-weight:500;margin-bottom:8px;
  }

  .q-body{font-size:13px;color:${T.creamDim};line-height:1.65;margin-bottom:12px;}

  .q-actions{display:flex;align-items:center;gap:2px;}
  .q-btn {
    display:flex;align-items:center;gap:5px;
    padding:5px 10px;border-radius:6px;
    font-size:12px;color:${T.creamDim};
    cursor:pointer;border:none;background:transparent;
    font-family:'DM Sans',sans-serif;transition:all 0.15s;
  }
  .q-btn:hover{background:${T.surface};color:${T.cream};}
  .q-btn.voted{color:${T.amberHi};}
  .q-btn.answer-btn{color:${T.purple};margin-left:auto;}
  .q-btn.answer-btn:hover{background:${T.purpleLo};}

  /* Expert answer */
  .expert-answer {
    margin-top:12px;
    border:1px solid ${T.purpleMid}66;
    border-radius:10px;overflow:hidden;
    animation:fadeIn 0.4s ease;
  }
  .expert-answer-header {
    background:${T.purpleLo};
    padding:10px 14px;
    display:flex;align-items:center;gap:10px;
  }
  .expert-av {
    width:28px;height:28px;border-radius:7px;flex-shrink:0;
    display:flex;align-items:center;justify-content:center;
    font-size:11px;font-weight:500;
    background:${T.purpleMid}44;color:${T.purpleHi};
    border:1px solid ${T.purpleMid};
  }
  .expert-name{font-size:13px;color:${T.cream};font-weight:500;}
  .expert-cred{
    display:flex;align-items:center;gap:5px;
    background:#26215C;border:1px solid ${T.purpleMid};
    border-radius:99px;padding:2px 9px;
    font-size:10px;color:${T.purpleHi};font-weight:500;
    margin-left:auto;
  }
  .expert-cred-check{width:8px;height:8px;border-radius:50%;background:${T.purpleHi};}
  .expert-answer-body {
    padding:12px 14px;
    font-size:13px;color:${T.creamDim};line-height:1.7;
    background:${T.bg};
  }
  .expert-answer-footer {
    padding:8px 14px;background:${T.surface};
    border-top:1px solid ${T.border};
    display:flex;align-items:center;gap:8px;
    font-size:11px;color:${T.creamFaint};
  }

  /* Answering state */
  .answering-box {
    margin-top:12px;
    background:${T.purpleLo};
    border:1px solid ${T.purpleMid}66;
    border-radius:10px;padding:14px;
    animation:fadeIn 0.3s ease;
  }
  .answer-textarea {
    width:100%;background:${T.bg};
    border:1px solid ${T.border};border-radius:8px;
    padding:10px 12px;font-family:'DM Sans',sans-serif;
    font-size:13px;color:${T.cream};
    outline:none;resize:none;line-height:1.6;
    transition:border-color 0.2s;
  }
  .answer-textarea:focus{border-color:${T.purple};}
  .answer-textarea::placeholder{color:${T.creamFaint};}
  .answer-submit-row{
    display:flex;align-items:center;justify-content:flex-end;
    gap:8px;margin-top:10px;
  }
  .cancel-btn{
    background:transparent;border:1px solid ${T.border};
    border-radius:7px;padding:6px 14px;
    font-family:'DM Sans',sans-serif;font-size:12px;
    color:${T.creamDim};cursor:pointer;transition:all 0.15s;
  }
  .cancel-btn:hover{border-color:${T.borderHi};color:${T.cream};}
  .submit-answer-btn{
    background:${T.purple};color:#fff;border:none;
    border-radius:7px;padding:6px 16px;
    font-family:'DM Sans',sans-serif;font-size:12px;
    font-weight:500;cursor:pointer;transition:all 0.2s;
  }
  .submit-answer-btn:hover{background:${T.purpleHi};color:${T.bg};}
  .submit-answer-btn:disabled{opacity:0.4;cursor:not-allowed;}

  /* ── Expert roster tab ── */
  .expert-roster { padding:16px 22px;display:flex;flex-direction:column;gap:10px; }
  .expert-card {
    background:${T.surface};border:1px solid ${T.border};
    border-radius:12px;padding:16px;
    display:flex;gap:14px;align-items:flex-start;
    animation:fadeUp 0.3s ease both;
    transition:border-color 0.15s;cursor:pointer;
  }
  .expert-card:hover{border-color:${T.borderHi};}
  .expert-card.verified{border-color:${T.purpleMid}66;animation:glow 3s ease infinite;}
  .expert-card-av{
    width:44px;height:44px;border-radius:10px;flex-shrink:0;
    display:flex;align-items:center;justify-content:center;
    font-family:'DM Serif Display',serif;font-size:18px;
  }
  .expert-card-name{font-size:14px;font-weight:500;color:${T.cream};margin-bottom:2px;}
  .expert-card-role{font-size:12px;color:${T.creamDim};margin-bottom:8px;}
  .expert-chips{display:flex;gap:6px;flex-wrap:wrap;}
  .expert-chip{
    padding:2px 8px;border-radius:99px;
    font-size:10px;font-weight:500;
  }
  .chip-verified{background:#26215C;color:${T.purpleHi};border:1px solid ${T.purpleMid};}
  .chip-online{background:${T.tealLo};color:${T.tealHi};border:1px solid ${T.teal}44;}
  .chip-busy{background:${T.amberLo};color:${T.amberHi};border:1px solid ${T.amberMid};}
  .expert-stat{margin-left:auto;text-align:right;flex-shrink:0;}
  .expert-stat-num{font-size:18px;font-weight:500;color:${T.cream};font-family:'DM Serif Display',serif;}
  .expert-stat-label{font-size:10px;color:${T.creamFaint};}

  /* Apply modal */
  .apply-panel {
    margin:0 22px 20px;
    background:${T.surface};border:1px solid ${T.border};
    border-radius:12px;overflow:hidden;
    animation:fadeUp 0.35s ease both;
  }
  .apply-header{
    background:${T.purpleLo};padding:14px 18px;
    border-bottom:1px solid ${T.purpleMid}44;
    font-family:'DM Serif Display',serif;font-size:16px;
    color:${T.cream};
  }
  .apply-header em{font-style:italic;color:${T.purpleHi};}
  .apply-body{padding:16px 18px;display:flex;flex-direction:column;gap:12px;}
  .apply-field label{
    display:block;font-size:11px;font-weight:500;
    color:${T.creamDim};text-transform:uppercase;
    letter-spacing:0.08em;margin-bottom:6px;
  }
  .apply-input{
    width:100%;background:${T.bg};border:1px solid ${T.border};
    border-radius:7px;padding:9px 12px;
    font-family:'DM Sans',sans-serif;font-size:13px;
    color:${T.cream};outline:none;
    transition:border-color 0.2s;
  }
  .apply-input:focus{border-color:${T.purple};}
  .apply-input::placeholder{color:${T.creamFaint};}
  .domain-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px;}
  .domain-sel-chip{
    padding:7px 10px;border-radius:8px;font-size:12px;
    cursor:pointer;border:1px solid ${T.border};
    color:${T.creamDim};transition:all 0.15s;text-align:center;
  }
  .domain-sel-chip:hover{border-color:${T.borderHi};color:${T.cream};}
  .domain-sel-chip.sel{background:${T.purpleLo};border-color:${T.purpleMid};color:${T.purpleHi};}
  .apply-submit{
    background:${T.purple};color:#fff;border:none;
    border-radius:8px;padding:11px;width:100%;
    font-family:'DM Sans',sans-serif;font-size:13px;
    font-weight:500;cursor:pointer;transition:all 0.2s;
  }
  .apply-submit:hover{background:${T.purpleHi};color:${T.bg};}
  .apply-submit:disabled{opacity:0.4;cursor:not-allowed;}
  .apply-success{
    padding:20px;text-align:center;
    animation:popIn 0.4s ease both;
  }
  .apply-success-icon{
    width:52px;height:52px;border-radius:50%;
    border:2px solid ${T.tealHi};
    display:flex;align-items:center;justify-content:center;
    margin:0 auto 12px;
  }

  /* ── Trust panel ── */
  .trust-panel {
    background:${T.surface};border-left:1px solid ${T.border};
    display:flex;flex-direction:column;overflow-y:auto;
  }
  .trust-header{
    padding:14px 18px 12px;border-bottom:1px solid ${T.border};
    position:sticky;top:0;background:${T.surface};z-index:5;
  }
  .trust-title{
    font-family:'DM Serif Display',serif;font-size:16px;
    color:${T.cream};margin-bottom:2px;
  }
  .trust-sub{font-size:11px;color:${T.creamDim};}

  .trust-body{padding:16px;display:flex;flex-direction:column;gap:14px;}

  /* Score ring */
  .score-ring-wrap{
    display:flex;flex-direction:column;align-items:center;
    padding:20px 0 14px;
  }
  .score-ring{
    position:relative;width:110px;height:110px;
    margin-bottom:14px;
  }
  .score-ring svg{transform:rotate(-90deg);}
  .score-ring-num{
    position:absolute;inset:0;
    display:flex;flex-direction:column;
    align-items:center;justify-content:center;
  }
  .score-num{
    font-family:'DM Serif Display',serif;font-size:26px;
    color:${T.cream};line-height:1;
    transition:all 0.4s;
  }
  .score-label{font-size:10px;color:${T.creamDim};margin-top:2px;}
  .score-tier{
    font-size:13px;font-weight:500;padding:4px 16px;
    border-radius:99px;
  }

  /* Progress bars */
  .stat-row{display:flex;flex-direction:column;gap:10px;}
  .stat-item{}
  .stat-top{
    display:flex;justify-content:space-between;
    font-size:12px;margin-bottom:5px;
  }
  .stat-name{color:${T.creamDim};}
  .stat-val{color:${T.cream};font-weight:500;}
  .stat-bar-bg{height:4px;border-radius:99px;background:${T.border};overflow:hidden;}
  .stat-bar-fill{
    height:100%;border-radius:99px;
    animation:fillBar 0.7s ease both;
    transition:width 0.5s ease;
  }

  /* Tier ladder */
  .tier-ladder{display:flex;flex-direction:column;gap:6px;}
  .tier-row{
    display:flex;align-items:center;gap:10px;
    padding:8px 10px;border-radius:8px;
    border:1px solid transparent;transition:all 0.2s;
  }
  .tier-row.current{
    background:${T.amberLo};border-color:${T.amberMid};
  }
  .tier-row.unlocked{opacity:0.6;}
  .tier-row.locked{opacity:0.3;}
  .tier-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}
  .tier-name{font-size:12px;color:${T.cream};font-weight:500;}
  .tier-req{font-size:10px;color:${T.creamDim};margin-left:auto;}
  .tier-badge{
    padding:2px 8px;border-radius:99px;
    font-size:10px;font-weight:500;
  }

  /* Activity feed */
  .activity-list{display:flex;flex-direction:column;gap:0;}
  .activity-item{
    display:flex;align-items:flex-start;gap:10px;
    padding:9px 0;border-bottom:1px solid ${T.border};
    font-size:12px;animation:slideIn 0.3s ease both;
  }
  .activity-item:last-child{border-bottom:none;}
  .activity-icon{
    width:24px;height:24px;border-radius:6px;flex-shrink:0;
    display:flex;align-items:center;justify-content:center;
    font-size:11px;
  }
  .activity-text{color:${T.creamDim};line-height:1.5;flex:1;}
  .activity-text strong{color:${T.cream};}
  .activity-pts{
    font-size:11px;font-weight:500;
    white-space:nowrap;
  }
  .activity-time{font-size:10px;color:${T.creamFaint};}

  .section-label{
    font-size:10px;font-weight:500;color:${T.creamFaint};
    text-transform:uppercase;letter-spacing:0.1em;
    margin-bottom:8px;
  }

  /* Toast */
  .toast{
    position:fixed;bottom:22px;left:50%;transform:translateX(-50%);
    background:${T.surface};border:1px solid ${T.border};
    border-radius:10px;padding:9px 18px;
    font-size:13px;color:${T.cream};
    display:flex;align-items:center;gap:8px;
    animation:fadeUp 0.3s ease;z-index:200;
    white-space:nowrap;pointer-events:none;
  }
  .toast-dot{width:7px;height:7px;border-radius:50%;}

  ::-webkit-scrollbar{width:3px;}
  ::-webkit-scrollbar-track{background:transparent;}
  ::-webkit-scrollbar-thumb{background:${T.border};border-radius:99px;}
`;

// ── Domain config ─────────────────────────────────────────────────────────
const DOMAINS = [
  { key:"traffic",    label:"Traffic & transport", color:T.amberHi,  bg:T.amberLo,  border:T.amberMid },
  { key:"arch",       label:"Architecture & zoning",color:T.purpleHi, bg:T.purpleLo, border:T.purpleMid },
  { key:"fiscal",     label:"Budget & fiscal",     color:T.blueHi,   bg:T.blueLo,   border:T.blue },
  { key:"env",        label:"Environment",         color:T.tealHi,   bg:T.tealLo,   border:T.teal },
  { key:"legal",      label:"Local law & policy",  color:T.coralHi,  bg:T.coralLo,  border:T.coral },
  { key:"housing",    label:"Housing",             color:T.greenHi,  bg:"#0D2B1F",  border:T.green },
];

function domainStyle(key) {
  return DOMAINS.find(d => d.key === key) || DOMAINS[0];
}

// ── Seed experts ──────────────────────────────────────────────────────────
const SEED_EXPERTS = [
  {
    id:1, initials:"TP", name:"T. Park, AICP",
    role:"Traffic & Transportation Planner · City DOT",
    domains:["traffic"], answers:47, status:"online",
    av:{ bg:T.amberLo, color:T.amberHi },
  },
  {
    id:2, initials:"AO", name:"Dr. A. Osei",
    role:"Urban Architect · District Zoning Board",
    domains:["arch","housing"], answers:31, status:"busy",
    av:{ bg:T.purpleLo, color:T.purpleHi },
  },
  {
    id:3, initials:"CM", name:"C. Medina",
    role:"Municipal Budget Analyst",
    domains:["fiscal"], answers:22, status:"online",
    av:{ bg:T.blueLo, color:T.blueHi },
  },
  {
    id:4, initials:"LW", name:"L. Walsh",
    role:"Environmental Policy Officer",
    domains:["env"], answers:18, status:"online",
    av:{ bg:T.tealLo, color:T.tealHi },
  },
];

// ── Seed questions ────────────────────────────────────────────────────────
const SEED_QS = [
  {
    id:1,
    author:"Margot K.", hood:"Riverdale", time:"2h ago",
    av:{ bg:T.amberLo, color:T.amberHi, initials:"MK" },
    domain:"traffic",
    body:"The Elm St detour has been running 6 weeks over schedule. Who is accountable, and what legal recourse do residents have if a contractor overruns this significantly?",
    upvotes:34, upvoted:false,
    answer:{
      expert:SEED_EXPERTS[0],
      text:"Contractor overruns beyond 15% of the scheduled timeline typically trigger a liquidated damages clause in the city contract — meaning the contractor pays a daily penalty. I've requested the Elm St contract terms from DOT records. I'll post the clause here once confirmed. In the meantime, residents can formally write to the District Engineer via the DOT portal.",
      helpful:21, time:"45m ago",
    },
    answering:false, answerDraft:"",
  },
  {
    id:2,
    author:"Sam O.", hood:"Hillcrest", time:"4h ago",
    av:{ bg:T.coralLo, color:T.coralHi, initials:"SO" },
    domain:"fiscal",
    body:"The parks department says there's no budget for new lighting in Riverside Park until Q3. Is there a discretionary fund that could be accessed earlier for safety infrastructure?",
    upvotes:19, upvoted:false,
    answer:null,
    answering:false, answerDraft:"",
  },
  {
    id:3,
    author:"Jo L.", hood:"Eastside", time:"6h ago",
    av:{ bg:T.tealLo, color:T.tealHi, initials:"JL" },
    domain:"arch",
    body:"If a developer rezones the empty lot at 12th & Broadway from R2 to C1, what's the process for community input, and at what stage does it become binding?",
    upvotes:28, upvoted:false,
    answer:{
      expert:SEED_EXPERTS[1],
      text:"Rezoning from R2 (residential) to C1 (commercial) requires a public hearing before the Zoning Board — that's where community input is formally recorded. After the hearing, the Board has 60 days to issue a decision. If approved, it goes to City Council for a ratification vote. The community input stage — the public hearing — is binding in the sense that the Board must formally respond to objections in their written decision.",
      helpful:16, time:"3h ago",
    },
    answering:false, answerDraft:"",
  },
];

// ── Trust seed data ───────────────────────────────────────────────────────
const INITIAL_TRUST = {
  score: 340,
  tier: "contributor",
  posts: 12,
  upvotesReceived: 87,
  questionsAsked: 4,
  escalations: 2,
  activity: [
    { id:1, icon:"↑", iconBg:T.amberLo, iconColor:T.amberHi, text:"Your post about Elm St got <strong>8 upvotes</strong>", pts:"+16 pts", time:"1h ago" },
    { id:2, icon:"◈", iconBg:T.blueLo,  iconColor:T.blueHi,  text:"Issue escalated: <strong>Park lighting</strong>", pts:"+25 pts", time:"3h ago" },
    { id:3, icon:"?", iconBg:T.purpleLo,iconColor:T.purpleHi,text:"Expert answered your <strong>zoning question</strong>", pts:"+10 pts", time:"5h ago" },
    { id:4, icon:"↑", iconBg:T.amberLo, iconColor:T.amberHi, text:"Your reply got <strong>5 upvotes</strong>", pts:"+10 pts", time:"1d ago" },
  ],
};

const TIERS = [
  { key:"resident",    label:"Resident",    req:"Verified address",   pts:0,    color:T.creamDim, dot:T.borderHi },
  { key:"contributor", label:"Contributor", req:"200 pts",            pts:200,  color:T.amberHi,  dot:T.amber },
  { key:"voice",       label:"Community voice", req:"600 pts",        pts:600,  color:T.blueHi,   dot:T.blue },
  { key:"moderator",   label:"Moderator",   req:"1200 pts",           pts:1200, color:T.purpleHi, dot:T.purple },
  { key:"organizer",   label:"Organizer",   req:"Appointed",          pts:9999, color:T.tealHi,   dot:T.teal },
];

// ── SVG helpers ───────────────────────────────────────────────────────────
function CheckIcon({ color, size=12 }) {
  return <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
    <path d="M2 6l2.5 2.5L10 3" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>;
}
function UpIcon({ color }) {
  return <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M6 9V3M3 6l3-3 3 3" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>;
}
function LogoMark() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="1" y="7" width="5" height="6" rx="1" fill={T.amber}/>
    <rect x="8" y="4" width="5" height="9" rx="1" fill={T.amber} opacity="0.6"/>
    <rect x="1" y="1" width="5" height="4" rx="1" fill={T.amber} opacity="0.4"/>
  </svg>;
}

// ── Score ring ────────────────────────────────────────────────────────────
function ScoreRing({ score }) {
  const max = 1200;
  const pct = Math.min(score / max, 1);
  const r = 46, cx = 55, cy = 55;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;
  const tierIdx = [...TIERS].reverse().findIndex(t => score >= t.pts);
  const tier = TIERS[TIERS.length - 1 - (tierIdx === -1 ? TIERS.length - 1 : tierIdx)];

  return (
    <div className="score-ring-wrap">
      <div className="score-ring">
        <svg width="110" height="110" viewBox="0 0 110 110">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={T.border} strokeWidth="6"/>
          <circle cx={cx} cy={cy} r={r} fill="none"
            stroke={tier.dot} strokeWidth="6"
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeLinecap="round"
            style={{ transition:"stroke-dasharray 0.6s ease" }}
          />
        </svg>
        <div className="score-ring-num">
          <div className="score-num" style={{ color: tier.dot }}>{score}</div>
          <div className="score-label">trust pts</div>
        </div>
      </div>
      <div className="score-tier"
        style={{ background: tier.dot + "22", color: tier.dot, border:`1px solid ${tier.dot}44` }}>
        {tier.label}
      </div>
    </div>
  );
}

// ── Expert answer block ───────────────────────────────────────────────────
function ExpertAnswerBlock({ answer }) {
  const [helpful, setHelpful] = useState(answer.helpful);
  const [marked, setMarked] = useState(false);
  return (
    <div className="expert-answer">
      <div className="expert-answer-header">
        <div className="expert-av">{answer.expert.initials}</div>
        <div>
          <div className="expert-name">{answer.expert.name}</div>
          <div style={{ fontSize:11, color:T.creamDim }}>{answer.expert.role}</div>
        </div>
        <div className="expert-cred">
          <div className="expert-cred-check"/>
          Verified expert
        </div>
      </div>
      <div className="expert-answer-body">{answer.text}</div>
      <div className="expert-answer-footer">
        <span>{answer.time}</span>
        <button className={`q-btn${marked?" voted":""}`} style={{ padding:"3px 8px", fontSize:11 }}
          onClick={() => { if(!marked){ setHelpful(h=>h+1); setMarked(true); }}}>
          <UpIcon color={marked?T.amberHi:T.creamFaint}/> Helpful ({helpful})
        </button>
      </div>
    </div>
  );
}

// ── Question card ─────────────────────────────────────────────────────────
function QuestionCard({ q, isExpert, onUpvote, onAnswer, isNew }) {
  const dom = domainStyle(q.domain);
  return (
    <div className={`q-card${isNew?" new-card":""}`}>
      <div className="q-meta">
        <div className="q-avatar" style={{ background:q.av.bg, color:q.av.color }}>
          {q.av.initials}
        </div>
        <div>
          <div className="q-author">{q.author}</div>
          <div className="q-hood">{q.hood}</div>
        </div>
        <div className="q-time">{q.time}</div>
      </div>

      <div className="q-domain-tag"
        style={{ background:dom.bg, color:dom.color, border:`1px solid ${dom.border}` }}>
        {dom.label}
      </div>

      <div className="q-body">{q.body}</div>

      {q.answer && <ExpertAnswerBlock answer={q.answer} />}

      {q.answering && (
        <div className="answering-box">
          <div style={{ fontSize:12, color:T.purpleHi, marginBottom:8, fontWeight:500 }}>
            Responding as verified expert
          </div>
          <textarea
            className="answer-textarea"
            rows={4}
            placeholder="Share your expert perspective on this question…"
            value={q.answerDraft}
            onChange={e => onAnswer(q.id, "draft", e.target.value)}
          />
          <div className="answer-submit-row">
            <button className="cancel-btn" onClick={() => onAnswer(q.id, "cancel")}>Cancel</button>
            <button className="submit-answer-btn"
              disabled={!q.answerDraft.trim()}
              onClick={() => onAnswer(q.id, "submit")}>
              Post expert answer
            </button>
          </div>
        </div>
      )}

      <div className="q-actions">
        <button className={`q-btn${q.upvoted?" voted":""}`} onClick={() => onUpvote(q.id)}>
          <UpIcon color={q.upvoted?T.amberHi:T.creamDim}/> {q.upvotes}
        </button>
        <button className="q-btn">Share</button>
        {isExpert && !q.answer && !q.answering && (
          <button className="q-btn answer-btn" onClick={() => onAnswer(q.id, "open")}>
            Answer as expert →
          </button>
        )}
        {isExpert && !q.answer && q.answering && null}
        {!isExpert && !q.answer && (
          <span style={{ marginLeft:"auto", fontSize:11, color:T.creamFaint,
            display:"flex", alignItems:"center", gap:4 }}>
            Awaiting expert response
          </span>
        )}
        {!isExpert && q.answer && (
          <span style={{ marginLeft:"auto", fontSize:11, color:T.tealHi,
            display:"flex", alignItems:"center", gap:4 }}>
            <CheckIcon color={T.tealHi}/> Expert answered
          </span>
        )}
      </div>
    </div>
  );
}

// ── Apply panel ───────────────────────────────────────────────────────────
function ApplyPanel({ onClose, onSuccess }) {
  const [form, setForm] = useState({ name:"", org:"", license:"" });
  const [selDomains, setSelDomains] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const valid = form.name && form.org && selDomains.length > 0;

  function toggleDomain(k) {
    setSelDomains(ds => ds.includes(k) ? ds.filter(d=>d!==k) : [...ds, k]);
  }
  function submit() {
    if (!valid) return;
    setSubmitting(true);
    setTimeout(() => { setDone(true); onSuccess(); }, 1400);
  }

  if (done) return (
    <div className="apply-panel">
      <div className="apply-success">
        <div className="apply-success-icon">
          <CheckIcon color={T.tealHi} size={22}/>
        </div>
        <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:16, color:T.cream, marginBottom:6 }}>
          Application submitted
        </div>
        <div style={{ fontSize:13, color:T.creamDim, lineHeight:1.6 }}>
          Your credentials are under review. You'll be notified within 48 hours.
        </div>
        <button className="cancel-btn" style={{ marginTop:14, width:"100%" }} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );

  return (
    <div className="apply-panel">
      <div className="apply-header">Apply as an <em>expert</em></div>
      <div className="apply-body">
        <div className="apply-field">
          <label>Full name + credentials</label>
          <input className="apply-input" placeholder="Dr. Jane Smith, PE"
            value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
        </div>
        <div className="apply-field">
          <label>Organisation or affiliation</label>
          <input className="apply-input" placeholder="City Planning Dept / AICP member"
            value={form.org} onChange={e=>setForm(f=>({...f,org:e.target.value}))}/>
        </div>
        <div className="apply-field">
          <label>License or credential number (optional)</label>
          <input className="apply-input" placeholder="e.g. PE-12345"
            value={form.license} onChange={e=>setForm(f=>({...f,license:e.target.value}))}/>
        </div>
        <div className="apply-field">
          <label>Domains you can answer in</label>
          <div className="domain-grid">
            {DOMAINS.map(d => (
              <div key={d.key}
                className={`domain-sel-chip${selDomains.includes(d.key)?" sel":""}`}
                onClick={() => toggleDomain(d.key)}>
                {d.label}
              </div>
            ))}
          </div>
        </div>
        <button className="apply-submit" disabled={!valid||submitting} onClick={submit}>
          {submitting
            ? <span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                <span style={{width:13,height:13,border:"2px solid #fff4",borderTopColor:"#fff",
                  borderRadius:"50%",animation:"spin 0.8s linear infinite",display:"inline-block"}}/>
                Submitting…
              </span>
            : "Submit for review"}
        </button>
      </div>
    </div>
  );
}

// ── Trust sidebar ─────────────────────────────────────────────────────────
function TrustPanel({ trust, onAction }) {
  const tierIdx = TIERS.findIndex(t => t.key === trust.tier);
  const nextTier = TIERS[tierIdx + 1];
  const nextPts = nextTier ? nextTier.pts : 9999;

  return (
    <div className="trust-panel">
      <div className="trust-header">
        <div className="trust-title">Your reputation</div>
        <div className="trust-sub">Riverdale · ZK verified resident</div>
      </div>
      <div className="trust-body">

        <ScoreRing score={trust.score} />

        {nextTier && (
          <div style={{ textAlign:"center", fontSize:12, color:T.creamDim, marginTop:-8 }}>
            {nextPts - trust.score} pts to <span style={{ color:nextTier.dot, fontWeight:500 }}>{nextTier.label}</span>
          </div>
        )}

        <div>
          <div className="section-label">Activity breakdown</div>
          <div className="stat-row">
            {[
              { label:"Posts & replies", val:trust.posts,           max:50,  color:T.amber,    pct:`${Math.min(trust.posts/50*100,100)}%` },
              { label:"Upvotes received", val:trust.upvotesReceived, max:200, color:T.amberHi,  pct:`${Math.min(trust.upvotesReceived/200*100,100)}%` },
              { label:"Issues escalated", val:trust.escalations,    max:20,  color:T.blue,     pct:`${Math.min(trust.escalations/20*100,100)}%` },
              { label:"Questions asked",  val:trust.questionsAsked,  max:20,  color:T.purple,   pct:`${Math.min(trust.questionsAsked/20*100,100)}%` },
            ].map(s => (
              <div key={s.label} className="stat-item">
                <div className="stat-top">
                  <span className="stat-name">{s.label}</span>
                  <span className="stat-val">{s.val}</span>
                </div>
                <div className="stat-bar-bg">
                  <div className="stat-bar-fill"
                    style={{ "--w":s.pct, width:s.pct, background:s.color }}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="section-label">Trust ladder</div>
          <div className="tier-ladder">
            {TIERS.map((t, i) => {
              const isCurrent = t.key === trust.tier;
              const isUnlocked = i < tierIdx;
              const isLocked = i > tierIdx;
              return (
                <div key={t.key}
                  className={`tier-row${isCurrent?" current":isUnlocked?" unlocked":isLocked?" locked":""}`}>
                  <div className="tier-dot" style={{ background: t.dot }}/>
                  <div>
                    <div className="tier-name" style={{ color: t.color }}>{t.label}</div>
                  </div>
                  <div className="tier-req">{t.req}</div>
                  {isCurrent && (
                    <span className="tier-badge"
                      style={{ background:T.amberLo, color:T.amberHi, border:`1px solid ${T.amberMid}` }}>
                      Current
                    </span>
                  )}
                  {isUnlocked && <CheckIcon color={T.tealHi} size={12}/>}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div className="section-label">Recent activity</div>
          <div className="activity-list">
            {trust.activity.map((a, i) => (
              <div key={a.id} className="activity-item" style={{ animationDelay:`${i*0.05}s` }}>
                <div className="activity-icon" style={{ background:a.iconBg, color:a.iconColor }}>
                  {a.icon}
                </div>
                <div style={{ flex:1 }}>
                  <div className="activity-text"
                    dangerouslySetInnerHTML={{ __html: a.text }}/>
                  <div className="activity-time">{a.time}</div>
                </div>
                <div className="activity-pts" style={{ color:T.tealHi }}>{a.pts}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Main app ──────────────────────────────────────────────────────────────
export default function ExpertScreen() {
  const [tab, setTab] = useState("questions");
  const [questions, setQuestions] = useState(SEED_QS);
  const [experts] = useState(SEED_EXPERTS);
  const [askDraft, setAskDraft] = useState("");
  const [askDomain, setAskDomain] = useState("traffic");
  const [isExpert, setIsExpert] = useState(false);
  const [showApply, setShowApply] = useState(false);
  const [trust, setTrust] = useState(INITIAL_TRUST);
  const [toast, setToast] = useState(null);
  const [newQIds, setNewQIds] = useState([]);
  const nextId = useRef(100);
  const toastTimer = useRef(null);

  function showToast(msg, dot=T.amberHi) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, dot });
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }

  function addTrustPoints(pts, activityItem) {
    setTrust(t => ({
      ...t,
      score: t.score + pts,
      activity: [{ id: Date.now(), ...activityItem }, ...t.activity].slice(0, 8),
    }));
  }

  function handleUpvote(id) {
    setQuestions(qs => qs.map(q =>
      q.id === id
        ? { ...q, upvoted:!q.upvoted, upvotes: q.upvoted ? q.upvotes-1 : q.upvotes+1 }
        : q
    ));
  }

  function handleAnswer(id, action, value) {
    if (action === "open") {
      setQuestions(qs => qs.map(q => q.id===id ? {...q, answering:true} : q));
    } else if (action === "cancel") {
      setQuestions(qs => qs.map(q => q.id===id ? {...q, answering:false, answerDraft:""} : q));
    } else if (action === "draft") {
      setQuestions(qs => qs.map(q => q.id===id ? {...q, answerDraft:value} : q));
    } else if (action === "submit") {
      const q = questions.find(q => q.id===id);
      if (!q?.answerDraft?.trim()) return;
      setQuestions(qs => qs.map(q => q.id===id ? {
        ...q,
        answering: false,
        answerDraft: "",
        answer: {
          expert: { initials:"MC", name:"You (Expert)", role:"Verified · your domain" },
          text: q.answerDraft,
          helpful: 0, time:"just now",
        },
      } : q));
      addTrustPoints(40, {
        icon:"◈", iconBg:T.purpleLo, iconColor:T.purpleHi,
        text:"You posted an <strong>expert answer</strong>",
        pts:"+40 pts", time:"just now",
      });
      showToast("Expert answer posted · +40 trust pts", T.purpleHi);
    }
  }

  function handleAsk() {
    if (!askDraft.trim()) return;
    const newId = nextId.current++;
    setQuestions(qs => [{
      id:newId,
      author:"You", hood:"Riverdale", time:"just now",
      av:{ bg:T.amberLo, color:T.amberHi, initials:"MC" },
      domain: askDomain,
      body: askDraft.trim(),
      upvotes:0, upvoted:false,
      answer:null, answering:false, answerDraft:"",
    }, ...qs]);
    setNewQIds(ids => [...ids, newId]);
    setTimeout(() => setNewQIds(ids => ids.filter(i=>i!==newId)), 1500);
    setAskDraft("");
    addTrustPoints(10, {
      icon:"?", iconBg:T.purpleLo, iconColor:T.purpleHi,
      text:`You asked a <strong>${domainStyle(askDomain).label}</strong> question`,
      pts:"+10 pts", time:"just now",
    });
    showToast("Question posted · experts notified", T.purpleHi);
  }

  return (
    <>
      <style>{css}</style>
      <div className="app">

        {/* Topbar */}
        <div className="topbar">
          <div className="logo">
            <div className="logo-mark"><LogoMark/></div>
            Townhall
          </div>
          <div className="topbar-pill pill-amber">
            <div className="pill-dot" style={{background:T.amber}}/>
            Riverdale
          </div>
          <div className="topbar-pill pill-purple">
            <div className="pill-dot" style={{background:T.purple}}/>
            Expert Q&A
          </div>
          <div className="topbar-right">
            {!isExpert ? (
              <button style={{
                background:"transparent",border:`1px solid ${T.purpleMid}`,
                borderRadius:99,padding:"4px 12px",fontSize:12,
                color:T.purpleHi,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"
              }} onClick={() => { setShowApply(true); setTab("roster"); }}>
                Apply as expert
              </button>
            ) : (
              <div className="topbar-pill pill-purple">
                <CheckIcon color={T.purpleHi}/> Expert mode
              </div>
            )}
            <div className="avatar">MC</div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="sidebar">
          <div className="sidebar-section">Expert forum</div>
          <div className={`nav-item${tab==="questions"?" active":""}`} onClick={()=>setTab("questions")}>
            <div className="nav-dot" style={{background:tab==="questions"?T.purple:T.creamFaint}}/>
            Questions
            <span className="nav-badge">{questions.filter(q=>!q.answer).length}</span>
          </div>
          <div className={`nav-item${tab==="roster"?" active":""}`} onClick={()=>setTab("roster")}>
            <div className="nav-dot" style={{background:tab==="roster"?T.purple:T.creamFaint}}/>
            Expert roster
          </div>
          <div className="sidebar-section">Navigation</div>
          {["Banter feed","Civic issues","Bulletin board"].map(n => (
            <div key={n} className="nav-item">
              <div className="nav-dot" style={{background:T.creamFaint}}/>
              {n}
            </div>
          ))}
          <div className="sidebar-section">Account</div>
          <div className="nav-item">
            <div className="nav-dot" style={{background:T.tealHi}}/>
            Residency proof
          </div>
        </div>

        {/* Main */}
        <div className="main">
          <div className="panel-header">
            <div className="panel-title">
              {tab==="questions" ? <><em>Expert</em> Q&A</> : <><em>Expert</em> roster</>}
            </div>
            <div className="panel-sub">
              {tab==="questions"
                ? `${questions.filter(q=>!q.answer).length} awaiting answer · credentialed experts only`
                : `${experts.length} verified experts · apply to join`}
            </div>
          </div>

          <div className="tab-bar">
            <div className={`tab-item${tab==="questions"?" active":""}`} onClick={()=>setTab("questions")}>
              All questions
            </div>
            <div className={`tab-item${tab==="unanswered"?" active":""}`} onClick={()=>setTab("unanswered")}>
              Unanswered ({questions.filter(q=>!q.answer).length})
            </div>
            <div className={`tab-item${tab==="roster"?" active":""}`} onClick={()=>setTab("roster")}>
              Expert roster
            </div>
          </div>

          {/* Ask box — only on questions tabs */}
          {(tab==="questions"||tab==="unanswered") && (
            <div className="ask-box">
              <textarea className="ask-area" rows={2}
                placeholder="Ask a question for the expert panel…"
                value={askDraft}
                onChange={e=>setAskDraft(e.target.value)}
                onKeyDown={e=>{ if(e.key==="Enter"&&(e.metaKey||e.ctrlKey)) handleAsk(); }}
              />
              <div className="ask-row">
                <div className="ask-domain-row">
                  {DOMAINS.map(d => (
                    <div key={d.key}
                      className={`domain-chip${askDomain===d.key?" sel":""}`}
                      onClick={()=>setAskDomain(d.key)}>
                      {d.label}
                    </div>
                  ))}
                </div>
                <button className="ask-btn" disabled={!askDraft.trim()} onClick={handleAsk}>
                  Ask
                </button>
              </div>
            </div>
          )}

          {/* Questions */}
          {(tab==="questions"||tab==="unanswered") && (
            (tab==="unanswered" ? questions.filter(q=>!q.answer) : questions).map(q => (
              <QuestionCard key={q.id} q={q}
                isExpert={isExpert}
                onUpvote={handleUpvote}
                onAnswer={handleAnswer}
                isNew={newQIds.includes(q.id)}
              />
            ))
          )}

          {/* Roster */}
          {tab==="roster" && (
            <>
              {showApply && (
                <div style={{padding:"16px 22px 0"}}>
                  <ApplyPanel
                    onClose={()=>setShowApply(false)}
                    onSuccess={()=>{
                      setTimeout(()=>{ setIsExpert(true); setShowApply(false); setTab("questions"); },1600);
                      showToast("Expert application submitted · reviewing credentials", T.purpleHi);
                    }}
                  />
                </div>
              )}
              {!showApply && !isExpert && (
                <div style={{padding:"16px 22px 0"}}>
                  <button className="ask-btn" style={{width:"100%",padding:12,marginBottom:4}}
                    onClick={()=>setShowApply(true)}>
                    Apply to join as an expert →
                  </button>
                </div>
              )}
              <div className="expert-roster">
                {experts.map((e,i) => (
                  <div key={e.id} className={`expert-card verified`}
                    style={{animationDelay:`${i*0.07}s`}}>
                    <div className="expert-card-av" style={{background:e.av.bg,color:e.av.color}}>
                      {e.initials}
                    </div>
                    <div style={{flex:1}}>
                      <div className="expert-card-name">{e.name}</div>
                      <div className="expert-card-role">{e.role}</div>
                      <div className="expert-chips">
                        <span className="expert-chip chip-verified">Verified</span>
                        <span className={`expert-chip ${e.status==="online"?"chip-online":"chip-busy"}`}>
                          {e.status==="online"?"Online":"In review"}
                        </span>
                        {e.domains.map(d => {
                          const dom = domainStyle(d);
                          return <span key={d} className="expert-chip"
                            style={{background:dom.bg,color:dom.color,border:`1px solid ${dom.border}`}}>
                            {dom.label}
                          </span>;
                        })}
                      </div>
                    </div>
                    <div className="expert-stat">
                      <div className="expert-stat-num">{e.answers}</div>
                      <div className="expert-stat-label">answers</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Trust panel */}
        <TrustPanel trust={trust} />
      </div>

      {toast && (
        <div className="toast">
          <div className="toast-dot" style={{background:toast.dot}}/>
          {toast.msg}
        </div>
      )}
    </>
  );
}
