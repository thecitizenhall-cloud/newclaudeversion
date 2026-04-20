"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import ApplyOfficial from "./ApplyOfficial";

const T = {
  bg:         "#0F0E0C",
  surface:    "#1A1916",
  surfaceHi:  "#222019",
  border:     "#2C2A26",
  borderHi:   "#4A4640",
  cream:      "#F2EDE4",
  creamDim:   "#9A9188",
  creamFaint: "#3A3830",
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
  greenHi:    "#52C48A",
  red:        "#C0392B",
  redLo:      "#2A0E0A",
  redHi:      "#E57373",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${T.bg}; color: ${T.cream}; font-family: 'DM Sans', sans-serif; font-size: 14px; min-height: 100vh; }

  @keyframes fadeUp    { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
  @keyframes slideUp   { from{opacity:0;transform:translateY(100%)} to{opacity:1;transform:translateY(0)} }
  @keyframes popIn     { 0%{transform:scale(0.92);opacity:0} 70%{transform:scale(1.02)} 100%{transform:scale(1);opacity:1} }
  @keyframes spin      { to{transform:rotate(360deg)} }
  @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:0.35} }
  @keyframes notifPing { 0%{transform:scale(1);opacity:1} 100%{transform:scale(2.2);opacity:0} }
  @keyframes barGrow   { from{width:0} to{width:var(--w)} }

  /* Layout handled by shell */
  @media(max-width:767px){ .settings-panel { display:none; } }

  /* Topbar handled by shell */
  .logo { display:flex;align-items:center;gap:9px; font-family:'DM Serif Display',serif; font-size:16px;color:${T.cream};flex-shrink:0; }
  .logo-mark { width:26px;height:26px;border:1.5px solid ${T.amber}; border-radius:6px;display:flex;align-items:center;justify-content:center; }
  .topbar-pill { display:flex;align-items:center;gap:6px; padding:4px 12px;border-radius:99px;font-size:12px; }
  .pill-amber { background:${T.amberLo};border:1px solid ${T.amberMid};color:${T.amberHi}; }
  .pill-teal  { background:${T.tealLo};border:1px solid ${T.teal};color:${T.tealHi}; }
  .pill-dot   { width:6px;height:6px;border-radius:50%; }
  .topbar-right { margin-left:auto;display:flex;align-items:center;gap:10px;position:relative; }
  .notif-btn { position:relative;width:32px;height:32px;border-radius:8px; background:transparent;border:1px solid ${T.border}; display:flex;align-items:center;justify-content:center; cursor:pointer;transition:all 0.15s; }
  .notif-btn:hover{border-color:${T.borderHi};}
  .notif-count { position:absolute;top:-4px;right:-4px; width:16px;height:16px;border-radius:50%; background:${T.amber};color:${T.bg}; font-size:9px;font-weight:500; display:flex;align-items:center;justify-content:center; border:1.5px solid ${T.bg}; }
  .notif-ping { position:absolute;top:-4px;right:-4px; width:16px;height:16px;border-radius:50%; background:${T.amber};opacity:0.4; animation:notifPing 1.4s ease infinite; }
  .avatar { width:30px;height:30px;border-radius:8px; background:${T.amberLo};border:1px solid ${T.amberMid}; display:flex;align-items:center;justify-content:center; font-family:'DM Serif Display',serif;font-size:12px;color:${T.amberHi}; cursor:pointer; }

  /* Sidebar handled by shell */
  .sidebar-section { padding:4px 16px 2px;font-size:10px;font-weight:500;color:${T.creamFaint};text-transform:uppercase;letter-spacing:0.1em;margin-top:12px; }
  .nav-item { display:flex;align-items:center;gap:10px;padding:8px 16px;cursor:pointer;font-size:13px;color:${T.creamDim};transition:all 0.15s;border-left:2px solid transparent; }
  .nav-item:hover{color:${T.cream};background:${T.surfaceHi};}
  .nav-item.active{color:${T.tealHi};border-left-color:${T.teal};background:${T.tealLo};}
  .nav-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;}
  .nav-badge{margin-left:auto;border-radius:99px;padding:1px 7px;font-size:10px;font-weight:500;}
  .badge-amber{background:${T.amberLo};border:1px solid ${T.amberMid};color:${T.amberHi};}
  .badge-teal {background:${T.tealLo};border:1px solid ${T.teal}44;color:${T.tealHi};}

  /* ── Tabs ── */
  .tab-bar { display:flex;border-bottom:1px solid ${T.border};background:${T.bg};position:sticky;top:0;z-index:9; }
  .tab-item { padding:11px 20px;font-size:13px;color:${T.creamDim};cursor:pointer;border-bottom:2px solid transparent;transition:all 0.15s;white-space:nowrap; }
  .tab-item:hover{color:${T.cream};}
  .tab-item.active{color:${T.tealHi};border-bottom-color:${T.teal};}

  /* ── Main ── */
  .main { overflow-y:auto;display:flex;flex-direction:column;background:${T.bg};height:100%; }

  .notif-header { padding:16px 22px 14px;border-bottom:1px solid ${T.border}; position:sticky;top:0;background:${T.bg};z-index:10; display:flex;align-items:flex-start;justify-content:space-between;gap:12px; }
  .notif-title { font-family:'DM Serif Display',serif;font-size:20px;color:${T.cream}; }
  .notif-title em{font-style:italic;color:${T.tealHi};}
  .notif-sub{font-size:12px;color:${T.creamDim};margin-top:2px;}
  .mark-all-btn { background:transparent;border:1px solid ${T.border};border-radius:7px; padding:5px 12px;font-family:'DM Sans',sans-serif;font-size:12px; color:${T.creamDim};cursor:pointer;transition:all 0.15s;white-space:nowrap;flex-shrink:0; }
  .mark-all-btn:hover{border-color:${T.borderHi};color:${T.cream};}

  .digest-bar { padding:12px 22px;border-bottom:1px solid ${T.border}; display:flex;align-items:center;gap:12px;flex-wrap:wrap; background:${T.surface}; }
  .digest-label{font-size:12px;color:${T.creamDim};}
  .digest-opts{display:flex;gap:6px;}
  .digest-chip { padding:4px 12px;border-radius:99px;font-size:11px; cursor:pointer;border:1px solid ${T.border}; color:${T.creamDim};transition:all 0.15s; }
  .digest-chip:hover{border-color:${T.borderHi};color:${T.cream};}
  .digest-chip.sel{background:${T.tealLo};border-color:${T.teal};color:${T.tealHi};}
  .push-toggle{margin-left:auto;display:flex;align-items:center;gap:8px;font-size:12px;color:${T.creamDim};}
  .toggle-track{position:relative;width:32px;height:18px;background:${T.border};border-radius:9px;transition:background 0.2s;cursor:pointer;flex-shrink:0;}
  .toggle-track.on{background:${T.teal};}
  .toggle-thumb{position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:${T.cream};transition:transform 0.2s;}
  .toggle-track.on .toggle-thumb{transform:translateX(14px);}

  .notif-group-label { padding:8px 22px 4px;font-size:10px;font-weight:500; color:${T.creamFaint};text-transform:uppercase;letter-spacing:0.1em;background:${T.bg}; }
  .notif-item { display:flex;align-items:flex-start;gap:12px; padding:13px 22px;border-bottom:1px solid ${T.border}; cursor:pointer;transition:background 0.15s; animation:fadeUp 0.3s ease both; position:relative; }
  .notif-item:hover{background:${T.surfaceHi}44;}
  .notif-item.unread::before{ content:'';position:absolute;left:10px;top:50%;transform:translateY(-50%); width:5px;height:5px;border-radius:50%;background:${T.amber}; }
  .notif-icon { width:36px;height:36px;border-radius:10px;flex-shrink:0; display:flex;align-items:center;justify-content:center;font-size:14px; margin-top:1px; }
  .notif-body{flex:1;}
  .notif-text{font-size:13px;color:${T.creamDim};line-height:1.5;}
  .notif-text strong{color:${T.cream};}
  .notif-time{font-size:11px;color:${T.creamFaint};margin-top:3px;}
  .notif-action { margin-top:7px;display:inline-flex;align-items:center;gap:5px; padding:4px 10px;border-radius:6px;font-size:11px; border:1px solid ${T.border};color:${T.creamDim}; cursor:pointer;transition:all 0.15s;background:transparent; font-family:'DM Sans',sans-serif; }
  .notif-action:hover{border-color:${T.borderHi};color:${T.cream};}
  .notif-action.primary{background:${T.tealLo};border-color:${T.teal}44;color:${T.tealHi};}

  /* ── City Rollup ── */
  .rollup-header { padding:16px 22px 14px;border-bottom:1px solid ${T.border}; position:sticky;top:0;background:${T.bg};z-index:10; }
  .rollup-title{font-family:'DM Serif Display',serif;font-size:20px;color:${T.cream};}
  .rollup-title em{font-style:italic;color:${T.blueHi};}
  .rollup-sub{font-size:12px;color:${T.creamDim};margin-top:2px;}
  .city-grid { padding:16px 22px; display:grid; grid-template-columns:repeat(4,1fr); gap:8px; border-bottom:1px solid ${T.border}; }
  @media(max-width:767px){ .city-grid { grid-template-columns:repeat(2,1fr); } }
  .hood-tile { background:${T.surface};border:1px solid ${T.border}; border-radius:10px;padding:12px 10px; cursor:pointer;transition:all 0.2s; position:relative;overflow:hidden; animation:fadeUp 0.3s ease both; }
  .hood-tile:hover{border-color:${T.borderHi};transform:translateY(-1px);}
  .hood-tile.active-hood{border-color:${T.blue};background:${T.blueLo};}
  .hood-tile-heat{position:absolute;inset:0;border-radius:9px;opacity:0.08;pointer-events:none;transition:opacity 0.3s;}
  .hood-tile:hover .hood-tile-heat{opacity:0.14;}
  .hood-tile-name{font-size:12px;font-weight:500;color:${T.cream};margin-bottom:4px;}
  .hood-tile-issues{font-size:11px;color:${T.creamDim};}
  .hood-tile-bar{height:3px;border-radius:99px;background:${T.border};margin-top:8px;overflow:hidden;}
  .hood-tile-fill{height:100%;border-radius:99px;animation:barGrow 0.8s ease both;}
  .hood-tile-residents{font-size:10px;color:${T.creamFaint};margin-top:4px;}
  .city-issue-list{padding:0 22px 20px;}
  .section-head{padding:14px 0 8px;font-size:10px;font-weight:500;color:${T.creamFaint};text-transform:uppercase;letter-spacing:0.1em;display:flex;align-items:center;gap:8px;}
  .section-head-line{flex:1;height:1px;background:${T.border};}
  .city-issue { background:${T.surface};border:1px solid ${T.border}; border-radius:12px;margin-bottom:10px;overflow:hidden; animation:fadeUp 0.3s ease both;transition:border-color 0.15s; cursor:pointer; }
  .city-issue:hover{border-color:${T.borderHi};}
  .city-issue.responded{border-color:${T.teal}44;}
  .city-issue-top{padding:14px 16px 10px;display:flex;align-items:flex-start;gap:10px;}
  .city-issue-rank{width:26px;height:26px;border-radius:7px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:500;background:${T.blueLo};color:${T.blueHi};border:1px solid ${T.blue}44;}
  .city-issue-title{font-size:14px;font-weight:500;color:${T.cream};line-height:1.4;}
  .city-issue-meta{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:0 16px 10px;}
  .hood-chip{padding:2px 8px;border-radius:99px;font-size:10px;font-weight:500;}
  .city-issue-bar-row{padding:0 16px;margin-bottom:10px;display:flex;align-items:center;gap:10px;}
  .city-bar-bg{flex:1;height:5px;border-radius:99px;background:${T.border};overflow:hidden;}
  .city-bar-fill{height:100%;border-radius:99px;animation:barGrow 0.9s ease both;}
  .city-bar-stat{font-size:11px;color:${T.creamDim};white-space:nowrap;}
  .official-resp{border-top:1px solid ${T.border};padding:12px 16px;background:${T.tealLo};display:flex;gap:10px;align-items:flex-start;}
  .official-av{width:28px;height:28px;border-radius:7px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:500;background:${T.teal}33;color:${T.tealHi};border:1px solid ${T.teal}44;}
  .official-byline{font-size:12px;color:${T.tealHi};font-weight:500;margin-bottom:3px;}
  .official-role{font-size:10px;color:${T.tealHi};opacity:0.7;}
  .official-text{font-size:12px;color:${T.creamDim};line-height:1.6;margin-top:4px;}
  .awaiting-resp{border-top:1px solid ${T.border};padding:10px 16px;display:flex;align-items:center;gap:8px;font-size:11px;color:${T.creamFaint};}
  .pulse-dot{width:6px;height:6px;border-radius:50%;background:${T.amberHi};animation:pulse 1.4s ease infinite;flex-shrink:0;}

  /* ── Settings panel ── */
  .settings-panel { background:${T.surface};border-left:1px solid ${T.border};display:flex;flex-direction:column;overflow-y:auto; }
  .settings-header{padding:14px 18px 12px;border-bottom:1px solid ${T.border};position:sticky;top:0;background:${T.surface};z-index:5;}
  .settings-title{font-family:'DM Serif Display',serif;font-size:16px;color:${T.cream};margin-bottom:2px;}
  .settings-sub{font-size:11px;color:${T.creamDim};}
  .settings-body{padding:16px;display:flex;flex-direction:column;gap:16px;}
  .settings-section-label{font-size:10px;font-weight:500;color:${T.creamFaint};text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;}
  .pref-row{display:flex;align-items:center;gap:10px;padding:10px 12px;background:${T.bg};border:1px solid ${T.border};border-radius:8px;margin-bottom:6px;cursor:pointer;transition:border-color 0.15s;}
  .pref-row:hover{border-color:${T.borderHi};}
  .pref-icon{width:28px;height:28px;border-radius:7px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:13px;}
  .pref-info{flex:1;}
  .pref-label{font-size:13px;color:${T.cream};}
  .pref-desc{font-size:11px;color:${T.creamDim};margin-top:1px;}
  .live-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
  .live-stat{display:flex;align-items:baseline;gap:6px;padding:10px 12px;background:${T.bg};border:1px solid ${T.border};border-radius:8px;}
  .live-num{font-family:'DM Serif Display',serif;font-size:22px;color:${T.cream};transition:all 0.4s;}
  .live-label{font-size:11px;color:${T.creamDim};}

  /* ── Official onboard card ── */
  .official-onboard-card{background:${T.bg};border:1px solid ${T.teal}44;border-radius:10px;overflow:hidden;}
  .official-onboard-header{background:${T.tealLo};padding:12px 14px;border-bottom:1px solid ${T.teal}22;font-size:13px;font-weight:500;color:${T.tealHi};display:flex;align-items:center;gap:8px;}
  .official-onboard-body{padding:14px;}
  .official-step{display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;}
  .official-step:last-child{margin-bottom:0;}
  .official-step-num{width:20px;height:20px;border-radius:50%;flex-shrink:0;background:${T.tealLo};border:1px solid ${T.teal}44;font-size:10px;color:${T.tealHi};font-weight:500;display:flex;align-items:center;justify-content:center;margin-top:1px;}
  .official-step-text{font-size:12px;color:${T.creamDim};line-height:1.5;}
  .official-step-text strong{color:${T.cream};}
  .invite-official-btn{width:100%;padding:10px;border-radius:8px;background:${T.teal};border:none;color:#fff;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;cursor:pointer;transition:all 0.2s;margin-top:12px;}
  .invite-official-btn:hover{opacity:0.9;}

  /* ── Mobile bottom sheet for ApplyOfficial ── */
  .sheet-backdrop{position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:100;animation:fadeIn 0.2s ease;}
  .sheet-panel{position:fixed;left:0;right:0;bottom:0;background:${T.surface};border-radius:16px 16px 0 0;border-top:1px solid ${T.border};max-height:90vh;overflow-y:auto;z-index:101;animation:slideUp 0.3s ease;}
  .sheet-handle{width:36px;height:4px;border-radius:99px;background:${T.border};margin:12px auto 0;}

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

const NOTIF_PREFS = [
  { id:"expert",    icon:"◈", iconBg:T.purpleLo, iconColor:T.purpleHi, label:"Expert answers",     desc:"When an expert answers a question you asked" },
  { id:"official",  icon:"↩", iconBg:T.tealLo,   iconColor:T.tealHi,   label:"Official responses", desc:"When an official responds to a city issue" },
  { id:"escalated", icon:"◈", iconBg:T.blueLo,   iconColor:T.blueHi,   label:"Issue escalations",  desc:"When a post you upvoted becomes a civic issue" },
  { id:"trust",     icon:"↑", iconBg:T.amberLo,  iconColor:T.amberHi,  label:"Trust milestones",   desc:"When you reach a new reputation tier" },
  { id:"rollup",    icon:"⊕", iconBg:T.surface,  iconColor:T.creamDim, label:"City-wide rollup",    desc:"When a neighborhood issue enters the city tracker" },
];

const CITY_ISSUES = [
  { id:1, rank:1, title:"Main St corridor traffic signalling overhaul", hoods:["Riverdale","Midtown","Northbank"], totalVoices:847, pct:91, status:"responded", official:{ initials:"RD", name:"Councillor R. Delgado", role:"District 4 · Transport committee" }, response:"The signal timing study has been commissioned and will report by Oct 14. We've allocated emergency interim funding for manual crossing guards at the three highest-risk intersections starting Monday.", respTime:"2h ago" },
  { id:2, rank:2, title:"Affordable housing density — R2 to C1 rezoning review", hoods:["Eastside","Hillcrest","Westbridge"], totalVoices:612, pct:78, status:"awaiting", official:null, response:null, respTime:null },
  { id:3, rank:3, title:"City parks lighting — safety infrastructure budget", hoods:["Riverdale","Parkside","Southline"], totalVoices:489, pct:64, status:"responded", official:{ initials:"KM", name:"Dir. K. Moore", role:"Parks & Recreation Dept" }, response:"Lighting upgrades have been moved forward to Q2 of next fiscal year pending council approval.", respTime:"Yesterday" },
  { id:4, rank:4, title:"Elm St construction overrun — contractor accountability", hoods:["Riverdale","Midtown"], totalVoices:334, pct:51, status:"awaiting", official:null, response:null, respTime:null },
];

const HOODS = [
  { id:"rv", name:"Riverdale",  issues:7,  residents:1240, heat:T.amber,  pct:72 },
  { id:"mt", name:"Midtown",    issues:12, residents:3100, heat:T.coral,  pct:88 },
  { id:"es", name:"Eastside",   issues:4,  residents:890,  heat:T.blue,   pct:45 },
  { id:"hc", name:"Hillcrest",  issues:6,  residents:1050, heat:T.purple, pct:61 },
  { id:"nb", name:"Northbank",  issues:9,  residents:2200, heat:T.teal,   pct:79 },
  { id:"sl", name:"Southline",  issues:3,  residents:670,  heat:T.green,  pct:38 },
  { id:"wb", name:"Westbridge", issues:8,  residents:1800, heat:T.amber,  pct:66 },
  { id:"pk", name:"Parkside",   issues:5,  residents:940,  heat:T.blue,   pct:53 },
];

function timeAgo(d) {
  const s = Math.floor((Date.now()-new Date(d))/1000);
  if (s<60) return "just now";
  if (s<3600) return `${Math.floor(s/60)}m ago`;
  if (s<86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}
function initials(name) {
  if (!name) return "?";
  const p = name.trim().split(" ");
  return p.length>=2 ? `${p[0][0]}${p[p.length-1][0]}`.toUpperCase() : name.slice(0,2).toUpperCase();
}

function LogoMark(){return<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="7" width="5" height="6" rx="1" fill={T.amber}/><rect x="8" y="4" width="5" height="9" rx="1" fill={T.amber} opacity="0.6"/><rect x="1" y="1" width="5" height="4" rx="1" fill={T.amber} opacity="0.4"/></svg>;}
function CheckIcon({color,size=12}){return<svg width={size} height={size} viewBox="0 0 12 12" fill="none"><path d="M2 6l2.5 2.5L10 3" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;}
function BellIcon({color=T.creamDim}){return<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2a5 5 0 00-5 5v2l-1 2h12l-1-2V7a5 5 0 00-5-5z" stroke={color} strokeWidth="1.3" strokeLinejoin="round"/><path d="M6.5 13a1.5 1.5 0 003 0" stroke={color} strokeWidth="1.3" strokeLinecap="round"/></svg>;}
function UpIcon({color}){return<svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 8.5V2.5M2.5 5.5l3-3 3 3" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;}

function NotifItem({ n, onRead, idx }) {
  return (
    <div className={`notif-item${n.read?"":" unread"}`}
      style={{ animationDelay:`${idx*0.04}s` }}
      onClick={() => onRead(n.id)}>
      <div className="notif-icon" style={{ background:n.iconBg, color:n.iconColor }}>{n.icon}</div>
      <div className="notif-body">
        <div className="notif-text" dangerouslySetInnerHTML={{ __html:n.text }}/>
        <div className="notif-time">{timeAgo(n.created_at)}</div>
        {n.action && <button className={`notif-action${n.actionPrimary?" primary":""}`}>{n.action} →</button>}
      </div>
    </div>
  );
}

function CityIssueCard({ issue, idx }) {
  const [expanded, setExpanded] = useState(issue.status==="responded"&&idx===0);
  const hoodColors = [T.amber,T.blue,T.purple,T.teal,T.coral];
  return (
    <div className={`city-issue${issue.status==="responded"?" responded":""}`}
      onClick={()=>setExpanded(e=>!e)} style={{ animationDelay:`${idx*0.06}s` }}>
      <div className="city-issue-top">
        <div className="city-issue-rank">#{issue.rank}</div>
        <div className="city-issue-title">{issue.title}</div>
      </div>
      <div className="city-issue-meta">
        {issue.hoods.map((h,i)=>(
          <span key={h} className="hood-chip" style={{ background:hoodColors[i]+"22", color:hoodColors[i], border:`1px solid ${hoodColors[i]}44` }}>{h}</span>
        ))}
        <span style={{ marginLeft:"auto",fontSize:11,color:T.creamFaint }}>{issue.totalVoices.toLocaleString()} voices</span>
      </div>
      <div className="city-issue-bar-row">
        <div className="city-bar-bg"><div className="city-bar-fill" style={{ "--w":`${issue.pct}%`,width:`${issue.pct}%`,background:issue.pct>75?T.coral:issue.pct>50?T.amber:T.blue }}/></div>
        <span className="city-bar-stat">{issue.pct}% priority</span>
      </div>
      {issue.status==="responded"&&expanded&&issue.official&&(
        <div className="official-resp">
          <div className="official-av">{issue.official.initials}</div>
          <div style={{ flex:1 }}>
            <div className="official-byline">{issue.official.name}</div>
            <div className="official-role">{issue.official.role}</div>
            <div className="official-text">{issue.response}</div>
            <div style={{ fontSize:10,color:T.teal,marginTop:5,opacity:0.7 }}>Responded {issue.respTime}</div>
          </div>
        </div>
      )}
      {issue.status==="awaiting"&&(
        <div className="awaiting-resp"><div className="pulse-dot"/>Awaiting official response — visible to district representatives</div>
      )}
    </div>
  );
}

export default function NotificationsScreen({ onNavigate }) {
  const [tab,          setTab]          = useState("notifications");
  const [notifs,       setNotifs]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [prefs,        setPrefs]        = useState({ expert:true, official:true, escalated:true, trust:false, rollup:false });
  const [push,         setPush]         = useState(true);
  const [digest,       setDigest]       = useState("realtime");
  const [activeHood,   setActiveHood]   = useState(null);
  const [toast,        setToast]        = useState(null);
  const [liveStats,    setLiveStats]    = useState({ voices:3847, issues:49, responses:8, experts:4 });
  const [currentUser,  setCurrentUser]  = useState(null);
  const [neighborhood, setNeighborhood] = useState("Riverdale");
  const [showOfficial, setShowOfficial] = useState(false);
  const [officialAppStatus, setOfficialAppStatus] = useState(null);
  const toastTimer = useRef(null);
  const channelRef = useRef(null);

  function showToast(msg, dot=T.amberHi) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, dot });
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
        setNeighborhood(user.user_metadata?.neighborhood || "Riverdale");
        // Check if already applied as official
        const { data: app } = await supabase
          .from("official_applications")
          .select("status")
          .eq("user_id", user.id)
          .maybeSingle();
        if (app) setOfficialAppStatus(app.status);
      }
      await loadNotifs();
      setLoading(false);
    }
    init();

    // Live stats ticker
    const ticker = setInterval(() => {
      setLiveStats(s => ({ ...s, voices: s.voices + Math.floor(Math.random()*3) }));
    }, 4000);

    // Real-time notifications
    channelRef.current = supabase
      .channel("notifs-rt")
      .on("postgres_changes", { event:"INSERT", schema:"public", table:"notifications" }, (payload) => {
        setNotifs(prev => [formatNotif(payload.new), ...prev]);
      })
      .subscribe();

    return () => {
      clearInterval(ticker);
      if (channelRef.current) channelRef.current.unsubscribe();
    };
  }, []);

  function formatNotif(n) {
    const iconMap = {
      expert_answer:     { icon:"◈", iconBg:T.purpleLo, iconColor:T.purpleHi },
      official_response: { icon:"↩", iconBg:T.tealLo,   iconColor:T.tealHi },
      escalation:        { icon:"◈", iconBg:T.blueLo,   iconColor:T.blueHi },
      trust_milestone:   { icon:"↑", iconBg:T.amberLo,  iconColor:T.amberHi },
      city_wide:         { icon:"⊕", iconBg:T.surface,  iconColor:T.creamDim },
      upvote:            { icon:"↑", iconBg:T.amberLo,  iconColor:T.amberHi },
    };
    const style = iconMap[n.type] || iconMap.upvote;
    const textMap = {
      expert_answer:     `An expert answered your question`,
      official_response: `An official responded to a city issue you follow`,
      escalation:        `A post you upvoted was escalated to a civic issue`,
      trust_milestone:   `You reached a new trust tier: <strong>${n.payload?.new_tier||""}</strong>`,
      city_wide:         `An issue entered the city-wide tracker`,
      upvote:            `Your post received new upvotes`,
    };
    return { ...n, ...style, text: textMap[n.type] || "New notification" };
  }

  async function loadNotifs() {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending:false })
      .limit(40);
    setNotifs((data||[]).map(formatNotif));
  }

  async function markRead(id) {
    await supabase.from("notifications").update({ read:true }).eq("id", id);
    setNotifs(prev => prev.map(n => n.id===id ? { ...n, read:true } : n));
  }

  async function markAll() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("notifications").update({ read:true }).eq("user_id", user.id).eq("read", false);
    setNotifs(prev => prev.map(n => ({ ...n, read:true })));
    showToast("All notifications marked as read", T.tealHi);
  }

  function togglePref(id) {
    setPrefs(p => ({ ...p, [id]:!p[id] }));
    showToast(`${NOTIF_PREFS.find(p=>p.id===id)?.label} ${prefs[id]?"off":"on"}`, T.tealHi);
  }


  const unreadCount = notifs.filter(n => !n.read).length;
  const groups = ["today","yesterday","earlier"];
  const filteredIssues = activeHood
    ? CITY_ISSUES.filter(i => i.hoods.some(h => h.toLowerCase().includes(activeHood.toLowerCase())))
    : CITY_ISSUES;

  const userInit = initials(currentUser?.user_metadata?.display_name || currentUser?.email || "?");

  // Group notifications by date
  function getGroup(dateStr) {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - d) / 86400000);
    if (diff < 1) return "today";
    if (diff < 2) return "yesterday";
    return "earlier";
  }

  return (
    <>
      <style>{css}</style>
      {/* Two-column: content + settings panel */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 280px", height:"100%", overflow:"hidden" }}>
      </div>{/* end two-column grid */}

      {/* ── ApplyOfficial bottom sheet ── */}
      {showOfficial && (
        <>
          <div className="sheet-backdrop" onClick={()=>setShowOfficial(false)}/>
          <div className="sheet-panel">
            <div className="sheet-handle"/>
            <ApplyOfficial
              onClose={()=>{
                setShowOfficial(false);
                // Refresh application status
                supabase.auth.getUser().then(({data:{user}})=>{
                  if (!user) return;
                  supabase.from("official_applications").select("status").eq("user_id",user.id).maybeSingle()
                    .then(({data})=>{ if(data) setOfficialAppStatus(data.status); });
                });
              }}
            />
          </div>
        </>
      )}

      {toast&&<div className="th-toast"><div className="th-toast-dot" style={{background:toast.dot}}/>{toast.msg}</div>}
    </>
  );
}
