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

  .app {
    display: grid;
    grid-template-columns: 220px 1fr 320px;
    grid-template-rows: 52px 1fr;
    height: 100vh;
    overflow: hidden;
  }
  @media(max-width:767px) {
    .app { grid-template-columns:1fr; grid-template-rows:52px 1fr; }
    .sidebar, .settings-panel { display:none; }
  }

  .topbar { grid-column:1/-1; background:${T.surface}; border-bottom:1px solid ${T.border}; display:flex; align-items:center; padding:0 20px; gap:12px; height:52px; }
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

  .sidebar { background:${T.surface};border-right:1px solid ${T.border};padding:16px 0;overflow-y:auto; }
  .sidebar-section { padding:4px 16px 2px;font-size:10px;font-weight:500;color:${T.creamFaint};text-transform:uppercase;letter-spacing:0.1em;margin-top:12px; }
  .nav-item { display:flex;align-items:center;gap:10px;padding:8px 16px;cursor:pointer;font-size:13px;color:${T.creamDim};transition:all 0.15s;border-left:2px solid transparent; }
  .nav-item:hover{color:${T.cream};background:${T.surfaceHi};}
  .nav-item.active{color:${T.tealHi};border-left-color:${T.teal};background:${T.tealLo};}
  .nav-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;}
  .nav-badge{margin-left:auto;border-radius:99px;padding:1px 7px;font-size:10px;font-weight:500;}
  .badge-amber{background:${T.amberLo};border:1px solid ${T.amberMid};color:${T.amberHi};}
  .badge-teal {background:${T.tealLo};border:1px solid ${T.teal}44;color:${T.tealHi};}

  .tab-bar { display:flex;border-bottom:1px solid ${T.border};background:${T.bg};position:sticky;top:0;z-index:9; }
  .tab-item { padding:11px 20px;font-size:13px;color:${T.creamDim};cursor:pointer;border-bottom:2px solid transparent;transition:all 0.15s;white-space:nowrap; }
  .tab-item:hover{color:${T.cream};}
  .tab-item.active{color:${T.tealHi};border-bottom-color:${T.teal};}

  .main { overflow-y:auto;display:flex;flex-direction:column;background:${T.bg}; }

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

  .sheet-backdrop{position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:100;animation:fadeIn 0.2s ease;}
  .sheet-panel{position:fixed;left:0;right:0;bottom:0;background:${T.surface};border-radius:16px 16px 0 0;border-top:1px solid ${T.border};max-height:90vh;overflow-y:auto;z-index:101;animation:slideUp 0.3s ease;}
  .sheet-handle{width:36px;height:4px;border-radius:99px;background:${T.border};margin:12px auto 0;}

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
  { id:"rollup",    icon:"⊕", iconBg:T.surface,  iconColor:T.creamDim, label:"City-wide rollup",   desc:"When a neighborhood issue enters the city tracker" },
];

const HEAT_COLORS = [T.amber, T.coral, T.blue, T.purple, T.teal, T.green, T.amberHi, T.blueHi];

function timeAgo(d) {
  if (!d) return "";
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
  const [expanded, setExpanded] = useState(issue.status==="responded" && idx===0);
  const hoodColors = [T.amber, T.blue, T.purple, T.teal, T.coral];
  return (
    <div className={`city-issue${issue.status==="responded"?" responded":""}`}
      onClick={()=>setExpanded(e=>!e)} style={{ animationDelay:`${idx*0.06}s` }}>
      <div className="city-issue-top">
        <div className="city-issue-rank">#{issue.rank}</div>
        <div className="city-issue-title">{issue.title}</div>
      </div>
      <div className="city-issue-meta">
        {(issue.hoods||[]).map((h,i)=>(
          <span key={h} className="hood-chip" style={{ background:hoodColors[i%hoodColors.length]+"22", color:hoodColors[i%hoodColors.length], border:`1px solid ${hoodColors[i%hoodColors.length]}44` }}>{h}</span>
        ))}
        <span style={{ marginLeft:"auto",fontSize:11,color:T.creamFaint }}>{(issue.totalVoices||0).toLocaleString()} voices</span>
      </div>
      <div className="city-issue-bar-row">
        <div className="city-bar-bg"><div className="city-bar-fill" style={{ "--w":`${issue.pct||0}%`,width:`${issue.pct||0}%`,background:issue.pct>75?T.coral:issue.pct>50?T.amber:T.blue }}/></div>
        <span className="city-bar-stat">{issue.pct||0}% priority</span>
      </div>
      {issue.status==="responded" && expanded && issue.official && (
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
      {issue.status==="awaiting" && (
        <div className="awaiting-resp"><div className="pulse-dot"/>Awaiting official response — visible to district representatives</div>
      )}
    </div>
  );
}

export default function NotificationsScreen() {
  useCSS("notificationsscreen-css", css);
  const [tab,               setTab]               = useState("notifications");
  const [notifs,            setNotifs]            = useState([]);
  const [cityIssues,        setCityIssues]        = useState([]);
  const [hoods,             setHoods]             = useState([]);
  const [loadingNotifs,     setLoadingNotifs]     = useState(true);
  const [loadingRollup,     setLoadingRollup]     = useState(true);
  const [prefs,             setPrefs]             = useState({ expert:true, official:true, escalated:true, trust:false, rollup:false });
  const [push,              setPush]              = useState(true);
  const [digest,            setDigest]            = useState("realtime");
  const [activeHood,        setActiveHood]        = useState(null);
  const [toast,             setToast]             = useState(null);
  const [liveStats,         setLiveStats]         = useState({ voices:0, issues:0, responses:0, experts:0 });
  const [currentUser,       setCurrentUser]       = useState(null);
  const [neighborhood,      setNeighborhood]      = useState("Your neighborhood");
  const [showOfficial,      setShowOfficial]      = useState(false);
  const [officialAppStatus, setOfficialAppStatus] = useState(null);
  const toastTimer = useRef(null);
  const channelRef = useRef(null);

  function showToast(msg, dot=T.amberHi) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, dot });
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }

  // ── Load city issues from Supabase ──────────────────────────────────────
  async function loadCityIssues() {
    setLoadingRollup(true);
    try {
      const { data: issues } = await supabase
        .from("civic_issues")
        .select(`
          id, title, voice_count, priority_pct, status,
          official_response, responded_at,
          neighborhood_id,
          neighborhoods ( name ),
          profiles ( display_name, official_title, official_district )
        `)
        .neq("status", "resolved")
        .order("priority_pct", { ascending: false })
        .limit(20);

      const { data: hoodsData } = await supabase
        .from("neighborhoods")
        .select("id, name, resident_count")
        .order("name");

      // Count issues per neighborhood
      const issueCounts = {};
      (issues || []).forEach(iss => {
        const nid = iss.neighborhood_id;
        if (nid) issueCounts[nid] = (issueCounts[nid] || 0) + 1;
      });

      const mappedHoods = (hoodsData || []).map((h, i) => ({
        id:        h.id,
        name:      h.name,
        issues:    issueCounts[h.id] || 0,
        residents: h.resident_count || 0,
        heat:      HEAT_COLORS[i % HEAT_COLORS.length],
        pct:       h.resident_count
                     ? Math.min(99, Math.round((issueCounts[h.id] || 0) / h.resident_count * 100 * 10))
                     : 0,
      }));
      setHoods(mappedHoods);

      const mappedIssues = (issues || []).map((iss, i) => {
        const hasResponse = iss.official_response && iss.profiles;
        const officialName = iss.profiles?.display_name || null;
        const officialRole = [iss.profiles?.official_title, iss.profiles?.official_district].filter(Boolean).join(" · ");
        return {
          id:          iss.id,
          rank:        i + 1,
          title:       iss.title,
          hoods:       iss.neighborhoods ? [iss.neighborhoods.name] : [],
          totalVoices: iss.voice_count || 0,
          pct:         iss.priority_pct || 0,
          status:      hasResponse ? "responded" : "awaiting",
          official:    hasResponse ? {
            initials: initials(officialName),
            name:     officialName,
            role:     officialRole,
          } : null,
          response:  iss.official_response || null,
          respTime:  iss.responded_at ? timeAgo(iss.responded_at) : null,
        };
      });
      setCityIssues(mappedIssues);

      // Live stats
      const responded = mappedIssues.filter(i => i.status === "responded").length;
      const totalVoices = mappedIssues.reduce((sum, i) => sum + i.totalVoices, 0);
      setLiveStats(s => ({ ...s, voices: totalVoices, issues: mappedIssues.length, responses: responded }));

    } catch(e) {
      console.error("loadCityIssues error:", e);
    } finally {
      setLoadingRollup(false);
    }
  }

  // ── Persist prefs to Supabase ───────────────────────────────────────────
  async function upsertPrefs(newPrefs, newPush, newDigest) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("profiles").update({
      notification_prefs: { ...newPrefs, push: newPush, digest: newDigest },
      updated_at: new Date().toISOString(),
    }).eq("id", user.id);
  }

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
        setNeighborhood(user.user_metadata?.neighborhood || "Your neighborhood");

        // Load profile prefs
        const { data: prof } = await supabase
          .from("profiles")
          .select("notification_prefs")
          .eq("id", user.id)
          .maybeSingle();

        if (prof?.notification_prefs) {
          const p = prof.notification_prefs;
          setPrefs({
            expert:   p.expert   ?? true,
            official: p.official ?? true,
            escalated:p.escalated?? true,
            trust:    p.trust    ?? false,
            rollup:   p.rollup   ?? false,
          });
          if (p.push    !== undefined) setPush(p.push);
          if (p.digest  !== undefined) setDigest(p.digest);
        }

        // Check official application status
        const { data: app } = await supabase
          .from("official_applications")
          .select("status")
          .eq("user_id", user.id)
          .maybeSingle();
        if (app) setOfficialAppStatus(app.status);
      }

      await loadNotifs();
      await loadCityIssues();
    }
    init();

    // Live stats ticker
    const ticker = setInterval(() => {
      setLiveStats(s => ({ ...s, voices: s.voices + Math.floor(Math.random()*2) }));
    }, 5000);

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
    setLoadingNotifs(true);
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending:false })
      .limit(40);
    setNotifs((data||[]).map(formatNotif));
    setLoadingNotifs(false);
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
    const newPrefs = { ...prefs, [id]: !prefs[id] };
    setPrefs(newPrefs);
    upsertPrefs(newPrefs, push, digest);
    showToast(`${NOTIF_PREFS.find(p=>p.id===id)?.label} ${prefs[id]?"off":"on"}`, T.tealHi);
  }

  function handleSetDigest(d) {
    setDigest(d);
    upsertPrefs(prefs, push, d);
    showToast(`Digest set to ${d}`, T.tealHi);
  }

  function handleSetPush(val) {
    setPush(val);
    upsertPrefs(prefs, val, digest);
  }

  async function handleSignOut() { await supabase.auth.signOut(); }

  const unreadCount   = notifs.filter(n => !n.read).length;
  const groups        = ["today","yesterday","earlier"];
  const filteredIssues = activeHood
    ? cityIssues.filter(i => (i.hoods||[]).some(h => h.toLowerCase().includes(activeHood.toLowerCase())))
    : cityIssues;

  const userInit = initials(currentUser?.user_metadata?.display_name || currentUser?.email || "?");

  function getGroup(dateStr) {
    const d   = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - d) / 86400000);
    if (diff < 1) return "today";
    if (diff < 2) return "yesterday";
    return "earlier";
  }

  return (
    <>
      <div className="app">

        {/* Topbar */}
        <div className="topbar">
          <div className="logo"><div className="logo-mark"><LogoMark/></div>Townhall</div>
          <div className="topbar-pill pill-amber"><div className="pill-dot" style={{background:T.amber}}/>{neighborhood}</div>
          <div className="topbar-pill pill-teal" style={{cursor:"pointer"}} onClick={()=>setTab("rollup")}>
            <div className="pill-dot" style={{background:T.teal}}/>City-wide
          </div>
          <div className="topbar-right">
            <div className="notif-btn" onClick={()=>setTab("notifications")}>
              <BellIcon color={unreadCount>0?T.amberHi:T.creamDim}/>
              {unreadCount>0&&<><div className="notif-count">{unreadCount}</div><div className="notif-ping"/></>}
            </div>
            <div className="topbar-pill pill-teal"><CheckIcon color={T.tealHi}/>ZK verified</div>
            <div className="avatar" onClick={handleSignOut} title="Sign out">{userInit}</div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="sidebar">
          <div className="sidebar-section">Alerts</div>
          <div className={`nav-item${tab==="notifications"?" active":""}`} onClick={()=>setTab("notifications")}>
            <div className="nav-dot" style={{background:tab==="notifications"?T.teal:T.creamFaint}}/>
            Notifications
            {unreadCount>0&&<span className="nav-badge badge-amber">{unreadCount}</span>}
          </div>
          <div className={`nav-item${tab==="rollup"?" active":""}`} onClick={()=>setTab("rollup")}>
            <div className="nav-dot" style={{background:tab==="rollup"?T.teal:T.creamFaint}}/>
            City-wide rollup
            {cityIssues.length>0&&<span className="nav-badge badge-teal">{cityIssues.length}</span>}
          </div>
          <div className={`nav-item${tab==="officials"?" active":""}`} onClick={()=>setTab("officials")}>
            <div className="nav-dot" style={{background:tab==="officials"?T.teal:T.creamFaint}}/>
            Official responses
            {cityIssues.filter(i=>i.status==="responded").length>0&&(
              <span className="nav-badge badge-teal">{cityIssues.filter(i=>i.status==="responded").length}</span>
            )}
          </div>
          <div className="sidebar-section">Navigation</div>
          {["Banter feed","Expert Q&A"].map(n=>(
            <div key={n} className="nav-item"><div className="nav-dot" style={{background:T.creamFaint}}/>{n}</div>
          ))}
          <div className="sidebar-section">Account</div>
          <div className="nav-item" onClick={handleSignOut} style={{color:"#C0392B"}}>
            <div className="nav-dot" style={{background:"#C0392B"}}/>Sign out
          </div>
        </div>

        {/* Main */}
        <div className="main">

          {/* ── Notifications tab ── */}
          {tab==="notifications"&&(
            <>
              <div className="notif-header">
                <div>
                  <div className="notif-title">Your <em>notifications</em></div>
                  <div className="notif-sub">{unreadCount>0?`${unreadCount} unread`:"All caught up"} · {neighborhood} + city-wide</div>
                </div>
                {unreadCount>0&&<button className="mark-all-btn" onClick={markAll}>Mark all read</button>}
              </div>
              <div className="digest-bar">
                <span className="digest-label">Digest</span>
                <div className="digest-opts">
                  {["realtime","daily","weekly"].map(d=>(
                    <div key={d} className={`digest-chip${digest===d?" sel":""}`} onClick={()=>handleSetDigest(d)}>
                      {d.charAt(0).toUpperCase()+d.slice(1)}
                    </div>
                  ))}
                </div>
                <div className="push-toggle">
                  Push
                  <div className={`toggle-track${push?" on":""}`} onClick={()=>handleSetPush(!push)}>
                    <div className="toggle-thumb"/>
                  </div>
                </div>
              </div>

              {loadingNotifs&&<div className="th-loading"><div className="th-spinner"/>Loading notifications…</div>}

              {!loadingNotifs&&notifs.length===0&&(
                <div className="th-empty">No notifications yet.<br/>Activity in your neighborhood will appear here.</div>
              )}

              {!loadingNotifs&&groups.map(group=>{
                const items = notifs.filter(n=>getGroup(n.created_at)===group);
                if (!items.length) return null;
                return(
                  <div key={group}>
                    <div className="notif-group-label">{group.charAt(0).toUpperCase()+group.slice(1)}</div>
                    {items.map((n,i)=><NotifItem key={n.id} n={n} onRead={markRead} idx={i}/>)}
                  </div>
                );
              })}
            </>
          )}

          {/* ── City rollup + officials tabs ── */}
          {(tab==="rollup"||tab==="officials")&&(
            <>
              <div className="rollup-header">
                <div className="rollup-title">{tab==="officials"?<><em>Official</em> responses</>:<><em>City-wide</em> rollup</>}</div>
                <div className="rollup-sub">
                  {tab==="officials"
                    ?`${cityIssues.filter(i=>i.status==="responded").length} responses · ${cityIssues.filter(i=>i.status==="awaiting").length} awaiting`
                    :`${hoods.length} neighborhoods · ${cityIssues.length} active issues`}
                </div>
              </div>
              <div className="tab-bar">
                <div className={`tab-item${tab==="rollup"?" active":""}`} onClick={()=>setTab("rollup")}>All issues</div>
                <div className={`tab-item${tab==="officials"?" active":""}`} onClick={()=>setTab("officials")}>
                  Official responses ({cityIssues.filter(i=>i.status==="responded").length})
                </div>
              </div>

              {loadingRollup&&<div className="th-loading"><div className="th-spinner"/>Loading city data…</div>}

              {!loadingRollup&&tab==="rollup"&&(
                <div className="city-grid">
                  {hoods.map((h,i)=>(
                    <div key={h.id} className={`hood-tile${activeHood===h.name?" active-hood":""}`}
                      style={{ animationDelay:`${i*0.04}s` }}
                      onClick={()=>setActiveHood(activeHood===h.name?null:h.name)}>
                      <div className="hood-tile-heat" style={{background:h.heat}}/>
                      <div className="hood-tile-name">{h.name}</div>
                      <div className="hood-tile-issues">{h.issues} issues</div>
                      <div className="hood-tile-bar"><div className="hood-tile-fill" style={{"--w":`${h.pct}%`,width:`${h.pct}%`,background:h.heat}}/></div>
                      <div className="hood-tile-residents">{h.residents.toLocaleString()} residents</div>
                    </div>
                  ))}
                  {hoods.length===0&&<div style={{gridColumn:"1/-1",padding:"20px 0"}} className="th-empty">No neighborhoods yet.</div>}
                </div>
              )}

              {!loadingRollup&&(
                <div className="city-issue-list">
                  <div className="section-head">
                    {activeHood
                      ?<><span>{activeHood} issues</span><div className="section-head-line"/><span style={{color:T.creamFaint,cursor:"pointer",fontSize:11}} onClick={()=>setActiveHood(null)}>clear ×</span></>
                      :<><span>All city-wide issues</span><div className="section-head-line"/></>}
                  </div>
                  {(tab==="officials"?cityIssues.filter(i=>i.status==="responded"):filteredIssues).map((issue,i)=>(
                    <CityIssueCard key={issue.id} issue={issue} idx={i}/>
                  ))}
                  {filteredIssues.length===0&&<div className="th-empty">No issues yet.<br/>Escalate posts from the feed to create civic issues.</div>}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Settings panel ── */}
        <div className="settings-panel">
          <div className="settings-header">
            <div className="settings-title">Notifications</div>
            <div className="settings-sub">Your preferences</div>
          </div>
          <div className="settings-body">

            {/* Live stats */}
            <div>
              <div className="settings-section-label">City activity · live</div>
              <div className="live-grid">
                {[
                  { num:liveStats.voices,    label:"Voices today"       },
                  { num:liveStats.issues,    label:"Active issues"      },
                  { num:liveStats.responses, label:"Official responses" },
                  { num:liveStats.experts,   label:"Experts online"     },
                ].map((s,i)=>(
                  <div key={i} className="live-stat">
                    <div className="live-num">{s.num.toLocaleString()}</div>
                    <div style={{flex:1}}>
                      <div className="live-label">{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Push toggle */}
            <div>
              <div className="settings-section-label">Push notifications</div>
              <div style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:T.bg,border:`1px solid ${T.border}`,borderRadius:8 }}>
                <BellIcon color={T.creamDim}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,color:T.cream}}>Mobile push</div>
                  <div style={{fontSize:11,color:T.creamDim}}>Receive alerts on your device</div>
                </div>
                <div className={`toggle-track${push?" on":""}`} onClick={()=>handleSetPush(!push)}>
                  <div className="toggle-thumb"/>
                </div>
              </div>
            </div>

            {/* Alert types */}
            <div>
              <div className="settings-section-label">Alert types</div>
              {NOTIF_PREFS.map(p=>(
                <div key={p.id} className="pref-row" onClick={()=>togglePref(p.id)}>
                  <div className="pref-icon" style={{background:p.iconBg,color:p.iconColor}}>{p.icon}</div>
                  <div className="pref-info">
                    <div className="pref-label">{p.label}</div>
                    <div className="pref-desc">{p.desc}</div>
                  </div>
                  <div className={`toggle-track${prefs[p.id]?" on":""}`}>
                    <div className="toggle-thumb"/>
                  </div>
                </div>
              ))}
            </div>

            {/* Official onboarding */}
            <div>
              <div className="settings-section-label">Phase 3 · official access</div>
              <div className="official-onboard-card">
                <div className="official-onboard-header">
                  <CheckIcon color={T.tealHi}/>
                  Are you a government official?
                </div>
                <div className="official-onboard-body">
                  {officialAppStatus === "pending" && (
                    <div style={{ fontSize:12,color:T.amberHi,background:T.amberLo,border:`1px solid ${T.amberMid}`,borderRadius:8,padding:"10px 12px",marginBottom:12,lineHeight:1.6 }}>
                      Your application is under review. You&apos;ll be notified once approved.
                    </div>
                  )}
                  {officialAppStatus === "approved" && (
                    <div style={{ fontSize:12,color:T.tealHi,background:T.tealLo,border:`1px solid ${T.teal}44`,borderRadius:8,padding:"10px 12px",marginBottom:12,lineHeight:1.6,display:"flex",alignItems:"center",gap:8 }}>
                      <CheckIcon color={T.tealHi}/> Your official account is verified and active.
                    </div>
                  )}
                  {officialAppStatus !== "approved" && (
                    <>
                      <div className="official-step">
                        <div className="official-step-num">1</div>
                        <div className="official-step-text">Submit your name, title, and jurisdiction — we verify against <strong>US government records</strong>.</div>
                      </div>
                      <div className="official-step">
                        <div className="official-step-num">2</div>
                        <div className="official-step-text">Elected officials are <strong>auto-verified</strong> via Google Civic API. Appointed staff go through brief manual review.</div>
                      </div>
                      <div className="official-step">
                        <div className="official-step-num">3</div>
                        <div className="official-step-text">Once approved, your responses to civic issues carry a <strong>verified official badge</strong> visible to all residents.</div>
                      </div>
                      <div className="official-step">
                        <div className="official-step-num">4</div>
                        <div className="official-step-text">Your silence on issues is also visible — Townhall shows residents <strong>which officials have responded</strong> and which haven&apos;t.</div>
                      </div>
                      <button className="invite-official-btn" onClick={()=>setShowOfficial(true)}>
                        {officialAppStatus==="pending" ? "View my application →" : "Apply as a verified official →"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ApplyOfficial sheet */}
      {showOfficial && (
        <>
          <div className="sheet-backdrop" onClick={()=>setShowOfficial(false)}/>
          <div className="sheet-panel">
            <div className="sheet-handle"/>
            <ApplyOfficial
              onClose={()=>{
                setShowOfficial(false);
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
