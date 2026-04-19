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

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: ${T.bg}; color: ${T.cream}; font-family: 'DM Sans', sans-serif; font-size: 14px; min-height: 100vh; }

  @keyframes fadeUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes popIn   { 0%{transform:scale(0.92);opacity:0} 70%{transform:scale(1.02)} 100%{transform:scale(1);opacity:1} }
  @keyframes spin    { to{transform:rotate(360deg)} }
  @keyframes slideUp { from{opacity:0;transform:translateY(100%)} to{opacity:1;transform:translateY(0)} }
  @keyframes glow    { 0%,100%{box-shadow:0 0 0 0 ${T.purpleMid}44} 50%{box-shadow:0 0 0 6px ${T.purpleMid}00} }

  /* ── Layout ── */
  .app { display:grid; grid-template-columns:220px 1fr 300px; grid-template-rows:52px 1fr; height:100vh; overflow:hidden; }
  @media(max-width:767px) { .app { grid-template-columns:1fr; grid-template-rows:52px 1fr; } }

  /* ── Topbar ── */
  .topbar { grid-column:1/-1; background:${T.surface}; border-bottom:1px solid ${T.border}; display:flex; align-items:center; padding:0 20px; gap:14px; height:52px; }
  @media(max-width:767px) { .topbar { padding:0 16px; gap:10px; } }
  .logo { display:flex;align-items:center;gap:9px; font-family:'DM Serif Display',serif; font-size:16px;color:${T.cream};flex-shrink:0; }
  .logo-mark { width:26px;height:26px;border:1.5px solid ${T.amber}; border-radius:6px;display:flex;align-items:center;justify-content:center; }
  .topbar-pill { display:flex;align-items:center;gap:6px; padding:4px 12px;border-radius:99px;font-size:12px; }
  .pill-amber  { background:${T.amberLo};border:1px solid ${T.amberMid};color:${T.amberHi}; }
  .pill-purple { background:${T.purpleLo};border:1px solid ${T.purpleMid};color:${T.purpleHi}; }
  .pill-dot    { width:6px;height:6px;border-radius:50%; }
  .topbar-right { margin-left:auto;display:flex;align-items:center;gap:10px; }
  .avatar { width:30px;height:30px;border-radius:8px; background:${T.amberLo};border:1px solid ${T.amberMid}; display:flex;align-items:center;justify-content:center; font-family:'DM Serif Display',serif;font-size:12px;color:${T.amberHi}; cursor:pointer; }
  .expert-mode-badge { display:flex;align-items:center;gap:5px; background:${T.purpleLo};border:1px solid ${T.purpleMid}; border-radius:99px;padding:4px 10px;font-size:11px;color:${T.purpleHi}; }
  .apply-btn { background:transparent;border:1px solid ${T.purpleMid};border-radius:99px;padding:4px 12px;font-family:'DM Sans',sans-serif;font-size:12px;color:${T.purpleHi};cursor:pointer;transition:all 0.15s; }
  .apply-btn:hover { background:${T.purpleLo}; }

  /* ── Sidebar ── */
  .sidebar { background:${T.surface};border-right:1px solid ${T.border};padding:16px 0;overflow-y:auto; }
  @media(max-width:767px) { .sidebar { display:none; } }
  .sidebar-section { padding:4px 16px 2px;font-size:10px;font-weight:500;color:${T.creamFaint};text-transform:uppercase;letter-spacing:0.1em;margin-top:12px; }
  .nav-item { display:flex;align-items:center;gap:10px;padding:8px 16px;cursor:pointer;font-size:13px;color:${T.creamDim};transition:all 0.15s;border-left:2px solid transparent; }
  .nav-item:hover{color:${T.cream};background:${T.surfaceHi};}
  .nav-item.active{color:${T.purple};border-left-color:${T.purple};background:${T.purpleLo};}
  .nav-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;}
  .nav-badge{margin-left:auto;background:${T.purpleLo};border:1px solid ${T.purpleMid};border-radius:99px;padding:1px 7px;font-size:10px;color:${T.purpleHi};}

  /* ── Main panel ── */
  .main { overflow-y:auto;display:flex;flex-direction:column; }
  .panel-header { padding:16px 22px 14px;border-bottom:1px solid ${T.border};position:sticky;top:0;background:${T.bg};z-index:10; }
  @media(max-width:767px) { .panel-header { padding:14px 16px 12px; } }
  .panel-title { font-family:'DM Serif Display',serif;font-size:20px;color:${T.cream};margin-bottom:3px; }
  .panel-title em { font-style:italic;color:${T.purpleHi}; }
  .panel-sub { font-size:12px;color:${T.creamDim}; }

  /* ── Tabs ── */
  .tab-bar { display:flex;border-bottom:1px solid ${T.border};background:${T.bg};position:sticky;top:57px;z-index:9; }
  .tab-item { padding:10px 20px;font-size:13px;color:${T.creamDim};cursor:pointer;border-bottom:2px solid transparent;transition:all 0.15s;white-space:nowrap; }
  @media(max-width:767px) { .tab-item { padding:10px 14px;font-size:12px; } }
  .tab-item:hover{color:${T.cream};}
  .tab-item.active{color:${T.purpleHi};border-bottom-color:${T.purple};}

  /* ── Ask box ── */
  .ask-box { padding:16px 22px;border-bottom:1px solid ${T.border}; }
  @media(max-width:767px) { .ask-box { padding:12px 16px; } }
  .ask-area { width:100%;background:${T.surface};border:1px solid ${T.border};border-radius:10px;padding:12px 14px;font-family:'DM Sans',sans-serif;font-size:14px;color:${T.cream};outline:none;resize:none;transition:border-color 0.2s;line-height:1.6;-webkit-appearance:none; }
  .ask-area:focus{border-color:${T.purple};}
  .ask-area::placeholder{color:${T.creamFaint};}
  .ask-row { display:flex;align-items:center;gap:10px;margin-top:10px;flex-wrap:wrap; }
  .ask-domain-row { display:flex;gap:6px;flex-wrap:wrap;flex:1; }
  .domain-chip { padding:4px 11px;border-radius:99px;font-size:11px;cursor:pointer;border:1px solid ${T.border};color:${T.creamDim};transition:all 0.15s; }
  .domain-chip:hover{border-color:${T.borderHi};color:${T.cream};}
  .domain-chip.sel{background:${T.purpleLo};border-color:${T.purpleMid};color:${T.purpleHi};}
  .ask-btn { background:${T.purple};color:#fff;border:none;border-radius:8px;padding:9px 18px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;cursor:pointer;transition:all 0.2s;white-space:nowrap; }
  .ask-btn:hover{background:${T.purpleHi};color:${T.bg};}
  .ask-btn:disabled{opacity:0.4;cursor:not-allowed;}

  /* ── Question card ── */
  .q-card { padding:18px 22px;border-bottom:1px solid ${T.border};animation:fadeUp 0.3s ease both;transition:background 0.15s; }
  @media(max-width:767px) { .q-card { padding:14px 16px; } }
  .q-card:hover{background:${T.surfaceHi}22;}
  .q-card.new-card{animation:popIn 0.4s ease both;}
  .q-meta { display:flex;align-items:center;gap:8px;margin-bottom:10px; }
  .q-avatar { width:32px;height:32px;border-radius:8px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:500; }
  .q-author{font-size:13px;font-weight:500;color:${T.cream};}
  .q-time{font-size:11px;color:${T.creamFaint};margin-left:auto;}
  .q-domain-tag { display:inline-flex;align-items:center;gap:4px;padding:2px 9px;border-radius:99px;font-size:11px;font-weight:500;margin-bottom:8px; }
  .q-body{font-size:13px;color:${T.creamDim};line-height:1.65;margin-bottom:12px;}
  .q-actions{display:flex;align-items:center;gap:2px;}
  .q-btn { display:flex;align-items:center;gap:5px;padding:5px 10px;border-radius:6px;font-size:12px;color:${T.creamDim};cursor:pointer;border:none;background:transparent;font-family:'DM Sans',sans-serif;transition:all 0.15s; }
  .q-btn:hover{background:${T.surface};color:${T.cream};}
  .q-btn.voted{color:${T.amberHi};}
  .q-btn.answer-btn{color:${T.purple};margin-left:auto;}
  .q-btn.answer-btn:hover{background:${T.purpleLo};}

  /* ── Expert answer ── */
  .expert-answer { margin-top:12px;border:1px solid ${T.purpleMid}66;border-radius:10px;overflow:hidden;animation:fadeIn 0.4s ease; }
  .expert-answer-header { background:${T.purpleLo};padding:10px 14px;display:flex;align-items:center;gap:10px; }
  .expert-av { width:28px;height:28px;border-radius:7px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:500;background:${T.purpleMid}44;color:${T.purpleHi};border:1px solid ${T.purpleMid}; }
  .expert-name{font-size:13px;color:${T.cream};font-weight:500;}
  .expert-cred { display:flex;align-items:center;gap:5px;background:#26215C;border:1px solid ${T.purpleMid};border-radius:99px;padding:2px 9px;font-size:10px;color:${T.purpleHi};font-weight:500;margin-left:auto; }
  .expert-answer-body { padding:12px 14px;font-size:13px;color:${T.creamDim};line-height:1.7;background:${T.bg}; }
  .expert-answer-footer { padding:8px 14px;background:${T.surface};border-top:1px solid ${T.border};display:flex;align-items:center;gap:8px;font-size:11px;color:${T.creamFaint}; }

  /* ── Answer compose box ── */
  .answering-box { margin-top:12px;background:${T.purpleLo};border:1px solid ${T.purpleMid}66;border-radius:10px;padding:14px;animation:fadeIn 0.3s ease; }
  .answer-textarea { width:100%;background:${T.bg};border:1px solid ${T.border};border-radius:8px;padding:10px 12px;font-family:'DM Sans',sans-serif;font-size:13px;color:${T.cream};outline:none;resize:none;line-height:1.6;transition:border-color 0.2s;-webkit-appearance:none; }
  .answer-textarea:focus{border-color:${T.purple};}
  .answer-textarea::placeholder{color:${T.creamFaint};}
  .answer-submit-row{display:flex;align-items:center;justify-content:flex-end;gap:8px;margin-top:10px;}
  .cancel-btn{background:transparent;border:1px solid ${T.border};border-radius:7px;padding:6px 14px;font-family:'DM Sans',sans-serif;font-size:12px;color:${T.creamDim};cursor:pointer;transition:all 0.15s;}
  .cancel-btn:hover{border-color:${T.borderHi};color:${T.cream};}
  .submit-btn{background:${T.purple};color:#fff;border:none;border-radius:7px;padding:6px 16px;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:500;cursor:pointer;transition:all 0.2s;}
  .submit-btn:hover{background:${T.purpleHi};color:${T.bg};}
  .submit-btn:disabled{opacity:0.4;cursor:not-allowed;}

  /* ── Expert roster ── */
  .expert-roster{padding:16px 22px;display:flex;flex-direction:column;gap:10px;}
  @media(max-width:767px){.expert-roster{padding:12px 16px;}}
  .expert-card{background:${T.surface};border:1px solid ${T.border};border-radius:12px;padding:16px;display:flex;gap:14px;align-items:flex-start;animation:fadeUp 0.3s ease both;transition:border-color 0.15s;}
  .expert-card:hover{border-color:${T.borderHi};}
  .expert-card.verified{border-color:${T.purpleMid}66;}
  .expert-card-av{width:44px;height:44px;border-radius:10px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-family:'DM Serif Display',serif;font-size:18px;}
  .expert-card-name{font-size:14px;font-weight:500;color:${T.cream};margin-bottom:2px;}
  .expert-card-role{font-size:12px;color:${T.creamDim};margin-bottom:8px;}
  .expert-chips{display:flex;gap:6px;flex-wrap:wrap;}
  .expert-chip{padding:2px 8px;border-radius:99px;font-size:10px;font-weight:500;}
  .chip-verified{background:#26215C;color:${T.purpleHi};border:1px solid ${T.purpleMid};}
  .chip-online{background:${T.tealLo};color:${T.tealHi};border:1px solid ${T.teal}44;}
  .expert-stat{margin-left:auto;text-align:right;flex-shrink:0;}
  .expert-stat-num{font-size:18px;font-weight:500;color:${T.cream};font-family:'DM Serif Display',serif;}
  .expert-stat-label{font-size:10px;color:${T.creamFaint};}

  /* ── Apply panel ── */
  .apply-panel{margin:0 22px 20px;background:${T.surface};border:1px solid ${T.border};border-radius:12px;overflow:hidden;animation:fadeUp 0.35s ease both;}
  @media(max-width:767px){.apply-panel{margin:0 16px 16px;}}
  .apply-header{background:${T.purpleLo};padding:14px 18px;border-bottom:1px solid ${T.purpleMid}44;font-family:'DM Serif Display',serif;font-size:16px;color:${T.cream};}
  .apply-header em{font-style:italic;color:${T.purpleHi};}
  .apply-body{padding:16px 18px;display:flex;flex-direction:column;gap:12px;}
  .apply-field label{display:block;font-size:11px;font-weight:500;color:${T.creamDim};text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;}
  .apply-input{width:100%;background:${T.bg};border:1px solid ${T.border};border-radius:7px;padding:9px 12px;font-family:'DM Sans',sans-serif;font-size:13px;color:${T.cream};outline:none;transition:border-color 0.2s;-webkit-appearance:none;}
  .apply-input:focus{border-color:${T.purple};}
  .apply-input::placeholder{color:${T.creamFaint};}
  .domain-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px;}
  .domain-sel-chip{padding:7px 10px;border-radius:8px;font-size:12px;cursor:pointer;border:1px solid ${T.border};color:${T.creamDim};transition:all 0.15s;text-align:center;}
  .domain-sel-chip:hover{border-color:${T.borderHi};color:${T.cream};}
  .domain-sel-chip.sel{background:${T.purpleLo};border-color:${T.purpleMid};color:${T.purpleHi};}
  .apply-submit{background:${T.purple};color:#fff;border:none;border-radius:8px;padding:11px;width:100%;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;cursor:pointer;transition:all 0.2s;}
  .apply-submit:hover{background:${T.purpleHi};color:${T.bg};}
  .apply-submit:disabled{opacity:0.4;cursor:not-allowed;}
  .apply-success{padding:24px;text-align:center;animation:popIn 0.4s ease both;}
  .apply-success-icon{width:52px;height:52px;border-radius:50%;border:2px solid ${T.tealHi};display:flex;align-items:center;justify-content:center;margin:0 auto 12px;}

  /* ── Trust panel ── */
  .trust-panel{background:${T.surface};border-left:1px solid ${T.border};display:flex;flex-direction:column;overflow-y:auto;}
  @media(max-width:767px){.trust-panel{display:none;}}
  .trust-header{padding:14px 18px 12px;border-bottom:1px solid ${T.border};position:sticky;top:0;background:${T.surface};z-index:5;}
  .trust-title{font-family:'DM Serif Display',serif;font-size:16px;color:${T.cream};margin-bottom:2px;}
  .trust-sub{font-size:11px;color:${T.creamDim};}
  .trust-body{padding:16px;display:flex;flex-direction:column;gap:14px;}
  .section-label{font-size:10px;font-weight:500;color:${T.creamFaint};text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;}
  .score-ring-wrap{display:flex;flex-direction:column;align-items:center;padding:20px 0 14px;}
  .score-ring{position:relative;width:110px;height:110px;margin-bottom:14px;}
  .score-ring svg{transform:rotate(-90deg);}
  .score-ring-num{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;}
  .score-num{font-family:'DM Serif Display',serif;font-size:26px;color:${T.cream};line-height:1;}
  .score-label{font-size:10px;color:${T.creamDim};margin-top:2px;}
  .score-tier{font-size:13px;font-weight:500;padding:4px 16px;border-radius:99px;}
  .tier-ladder{display:flex;flex-direction:column;gap:6px;}
  .tier-row{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:8px;border:1px solid transparent;transition:all 0.2s;}
  .tier-row.current{background:${T.amberLo};border-color:${T.amberMid};}
  .tier-row.locked{opacity:0.3;}
  .tier-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}
  .tier-name{font-size:12px;color:${T.cream};font-weight:500;}
  .tier-req{font-size:10px;color:${T.creamDim};margin-left:auto;}

  /* ── Misc ── */
  .th-empty{text-align:center;padding:40px 20px;color:${T.creamFaint};font-size:13px;line-height:1.8;}
  .th-loading{display:flex;align-items:center;justify-content:center;gap:10px;padding:40px 20px;color:${T.creamDim};font-size:13px;}
  .th-spinner{width:16px;height:16px;border:2px solid ${T.border};border-top-color:${T.amber};border-radius:50%;animation:spin 0.8s linear infinite;}
  .th-toast{position:fixed;bottom:22px;left:50%;transform:translateX(-50%);background:${T.surface};border:1px solid ${T.border};border-radius:10px;padding:9px 18px;font-size:13px;color:${T.cream};display:flex;align-items:center;gap:8px;animation:fadeUp 0.3s ease;z-index:200;white-space:nowrap;max-width:90vw;}
  .th-toast-dot{width:7px;height:7px;border-radius:50%;}
  ::-webkit-scrollbar{width:3px;}
  ::-webkit-scrollbar-track{background:transparent;}
  ::-webkit-scrollbar-thumb{background:${T.border};border-radius:99px;}
`;

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
export default function ExpertScreen(){
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

  async function handleSignOut(){await supabase.auth.signOut();}

  const displayed = tab==="unanswered"
    ? questions.filter(q=>!(q.expert_answers||[]).length)
    : questions;

  const userInit=initials(currentUser?.user_metadata?.display_name||currentUser?.email||"?");

  return(
    <>
      <style>{css}</style>
      <div className="app">

        {/* Topbar */}
        <div className="topbar">
          <div className="logo"><div className="logo-mark"><LogoMark/></div>Townhall</div>
          <div className="topbar-pill pill-amber"><div className="pill-dot" style={{background:T.amber}}/>{neighborhood}</div>
          <div className="topbar-pill pill-purple"><div className="pill-dot" style={{background:T.purple}}/>Expert Q&amp;A</div>
          <div className="topbar-right">
            {isExpert
              ? <div className="expert-mode-badge"><CheckIcon color={T.purpleHi}/> Expert mode</div>
              : <button className="apply-btn" onClick={()=>{setShowApply(true);setTab("roster");}}>Apply as expert</button>
            }
            <div className="avatar" onClick={handleSignOut} title="Sign out">{userInit}</div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="sidebar">
          <div className="sidebar-section">Expert forum</div>
          <div className={`nav-item${tab==="questions"?" active":""}`} onClick={()=>setTab("questions")}>
            <div className="nav-dot" style={{background:tab==="questions"?T.purple:T.creamFaint}}/>Questions
            <span className="nav-badge">{questions.filter(q=>!(q.expert_answers||[]).length).length}</span>
          </div>
          <div className={`nav-item${tab==="roster"?" active":""}`} onClick={()=>setTab("roster")}>
            <div className="nav-dot" style={{background:tab==="roster"?T.purple:T.creamFaint}}/>Expert roster
          </div>
          <div className="sidebar-section">Navigation</div>
          {["Banter feed","Civic issues","Bulletin board"].map(n=>(
            <div key={n} className="nav-item"><div className="nav-dot" style={{background:T.creamFaint}}/>{n}</div>
          ))}
        </div>

        {/* Main */}
        <div className="main">
          <div className="panel-header">
            <div className="panel-title">{tab==="roster"?<><em>Expert</em> roster</>:<><em>Expert</em> Q&amp;A</>}</div>
            <div className="panel-sub">
              {tab==="roster"
                ? "Apply to join as a verified expert"
                : `${questions.filter(q=>!(q.expert_answers||[]).length).length} awaiting answer · credentialed experts only`}
            </div>
          </div>

          <div className="tab-bar">
            <div className={`tab-item${tab==="questions"?" active":""}`} onClick={()=>setTab("questions")}>All questions</div>
            <div className={`tab-item${tab==="unanswered"?" active":""}`} onClick={()=>setTab("unanswered")}>
              Unanswered ({questions.filter(q=>!(q.expert_answers||[]).length).length})
            </div>
            <div className={`tab-item${tab==="roster"?" active":""}`} onClick={()=>setTab("roster")}>Expert roster</div>
          </div>

          {/* Ask box */}
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

          {/* Questions */}
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

          {/* Roster */}
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

        {/* Trust panel */}
        <TrustPanel profile={profile}/>

      </div>

      {toast&&<div className="th-toast"><div className="th-toast-dot" style={{background:toast.dot}}/>{toast.msg}</div>}
    </>
  );
}
