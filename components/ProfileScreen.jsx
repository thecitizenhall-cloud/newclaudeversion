"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const T = {
  bg:"#0F0E0C", surface:"#1A1916", surfaceHi:"#222019",
  border:"#2C2A26", borderHi:"#4A4640",
  cream:"#F2EDE4", creamDim:"#9A9188", creamFaint:"#4A4640",
  amber:"#D4922A", amberLo:"#2A1E08", amberMid:"#8C5E14", amberHi:"#F0B84A",
  teal:"#1D9E75", tealLo:"#0A2A1E", tealHi:"#4CAF80",
  blue:"#378ADD", blueLo:"#0D1E35", blueHi:"#85B7EB",
  purple:"#7F77DD", purpleLo:"#1A1835", purpleHi:"#AFA9EC", purpleMid:"#534AB7",
  red:"#C0392B", redLo:"#2A0E0A", redHi:"#E57373",
};

const TIERS = [
  { key:"resident",    label:"Resident",        pts:0,    color:T.creamDim, dot:"#4A4640" },
  { key:"contributor", label:"Contributor",     pts:200,  color:T.amberHi,  dot:T.amber   },
  { key:"voice",       label:"Community voice", pts:600,  color:T.blueHi,   dot:T.blue    },
  { key:"moderator",   label:"Moderator",       pts:1200, color:T.purpleHi, dot:T.purple  },
];

function currentTier(score) {
  return [...TIERS].reverse().find(t => score >= t.pts) || TIERS[0];
}

function nextTier(score) {
  return TIERS.find(t => t.pts > score) || null;
}

function ScoreRing({ score }) {
  const max = 1200;
  const pct = Math.min(score / max, 1);
  const r = 46, cx = 55, cy = 55;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;
  const tier = currentTier(score);
  // Only animate on first mount — not on every tab switch
  const mounted = React.useRef(false);
  const [animate, setAnimate] = React.useState(false);
  React.useEffect(() => {
    if (!mounted.current) { mounted.current = true; setTimeout(()=>setAnimate(true), 50); }
  }, []);
  return (
    <div style={{ position:"relative", width:110, height:110 }}>
      <svg width="110" height="110" viewBox="0 0 110 110" style={{ transform:"rotate(-90deg)" }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={T.border} strokeWidth="6"/>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={tier.dot} strokeWidth="6"
          strokeDasharray={animate ? `${dash} ${circ - dash}` : `0 ${circ}`} strokeLinecap="round"
          style={{ transition: animate ? "stroke-dasharray 0.6s ease" : "none" }}/>
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
        <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:26, color:tier.dot, lineHeight:1 }}>{score}</div>
        <div style={{ fontSize:10, color:T.creamDim, marginTop:2 }}>trust pts</div>
      </div>
    </div>
  );
}

function CheckIcon({ color, size=14 }) {
  return <svg width={size} height={size} viewBox="0 0 14 14" fill="none"><path d="M2 7l3.5 3.5L12 3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

function useCSS(id, css) {
  if (typeof window === "undefined") return;
  let el = document.getElementById(id);
  if (!el) { el = document.createElement("style"); el.id = id; document.head.appendChild(el); }
  el.textContent = css;
}

const css = `
  .profile-input {
    width: 100%;
    background: ${T.bg};
    border: 1px solid ${T.border};
    border-radius: 8px;
    padding: 10px 14px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    color: ${T.cream};
    outline: none;
    transition: border-color 0.2s;
    -webkit-appearance: none;
  }
  .profile-input:focus { border-color: ${T.amber}; }
  .profile-input:disabled { opacity: 0.5; cursor: not-allowed; }
  .profile-select {
    width: 100%;
    background: ${T.bg};
    border: 1px solid ${T.border};
    border-radius: 8px;
    padding: 10px 14px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    color: ${T.cream};
    outline: none;
    cursor: pointer;
    -webkit-appearance: none;
    transition: border-color 0.2s;
  }
  .profile-select:focus { border-color: ${T.amber}; }
  .save-btn {
    background: ${T.amber};
    color: ${T.bg};
    border: none;
    border-radius: 8px;
    padding: 11px 24px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  .save-btn:hover { background: ${T.amberHi}; }
  .save-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .tier-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    border-radius: 9px;
    border: 1px solid transparent;
    transition: all 0.2s;
  }
  .tier-row.current { background: ${T.amberLo}; border-color: ${T.amberMid}; }
  .tier-row.locked  { opacity: 0.35; }
`;

export default function ProfileScreen({ onNavigate, onSignOut }) {
  useCSS("profile-css", css);

  const [profile,      setProfile]      = useState(null);
  const [neighborhoods,setNeighborhoods]= useState([]);
  const [form,         setForm]         = useState({ display_name:"", neighborhood_id:"" });
  const [citySearch,   setCitySearch]   = useState("");
  const [cityResults,  setCityResults]  = useState([]);
  const [showCitySearch, setShowCitySearch] = useState(false);
  const [showCreateHood, setShowCreateHood] = useState(false);
  const [newHoodName,  setNewHoodName]  = useState("");
  const [creating,     setCreating]     = useState(false);
  const [selectedCity, setSelectedCity] = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [saved,        setSaved]        = useState(false);
  const [error,        setError]        = useState("");
  const [postCount,    setPostCount]    = useState(0);
  const [answerCount,  setAnswerCount]  = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) { setLoading(false); return; }

        const [profResult, hoodsResult, postsResult, answersResult] = await Promise.allSettled([
          supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
          supabase.from("neighborhoods").select("id, name").order("name"),
          supabase.from("posts").select("*", { count:"exact", head:true }).eq("author_id", user.id),
          supabase.from("expert_answers").select("*", { count:"exact", head:true }).eq("expert_id", user.id),
        ]);

        const prof    = profResult.status    === "fulfilled" ? profResult.value.data    : null;
        const hoods   = hoodsResult.status   === "fulfilled" ? hoodsResult.value.data   : [];
        const posts   = postsResult.status   === "fulfilled" ? postsResult.value.count  : 0;
        const answers = answersResult.status === "fulfilled" ? answersResult.value.count : 0;

        setProfile({ ...(prof || {}), email: user.email });
        setNeighborhoods(hoods || []);
        setForm({
          display_name:    prof?.display_name || "",
          neighborhood_id: prof?.neighborhood_id || "",
        });

        // Pre-populate city search from the saved neighborhood's city
        if (prof?.neighborhood_id) {
          const { data: hoodCity } = await supabase
            .from("neighborhoods")
            .select("id, name, city_id, cities(id, name, state, lat, lng)")
            .eq("id", prof.neighborhood_id)
            .maybeSingle();
          if (hoodCity?.cities) {
            setSelectedCity(hoodCity.cities);
            setCitySearch(hoodCity.cities.name + ", " + hoodCity.cities.state);
            // Load all neighborhoods for that city so the picker is populated
            const { data: cityHoods } = await supabase
              .from("neighborhoods")
              .select("id, name")
              .eq("city_id", hoodCity.cities.id)
              .order("name");
            if (cityHoods?.length) setNeighborhoods(cityHoods);
          }
        }
        setPostCount(posts || 0);
        setAnswerCount(answers || 0);
      } catch(e) {
        console.error("Profile load error:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function searchCities(query) {
    setCitySearch(query);
    if (query.length < 2) { setCityResults([]); return; }

    const [dbResult, nominatimResult] = await Promise.allSettled([
      supabase
        .from("cities")
        .select("id, name, state, lat, lng")
        .ilike("name", `%${query}%`)
        .order("name")
        .limit(15),

      fetch(`/api/city-search?q=${encodeURIComponent(query)}`).then(r => r.json()).then(d => d.results || [])
    ]);

    const dbCities = dbResult.status === "fulfilled" ? (dbResult.value.data || []) : [];

    let nominatimCities = [];
    if (nominatimResult.status === "fulfilled") {
      nominatimCities = (nominatimResult.value || [])
        .filter(r => ["city","town","village","municipality","borough","hamlet"].includes(r.type) || r.addresstype === "city")
        .map(r => ({
          nominatim_id: r.place_id,
          name:  r.address?.city || r.address?.town || r.address?.village || r.address?.hamlet || r.name,
          state: r.address?.state_code || r.address?.ISO3166_2_lvl4?.replace("US-","") || "",
          lat:   parseFloat(r.lat),
          lng:   parseFloat(r.lon),
          fromNominatim: true,
        }))
        .filter(r => r.name && r.state);
    }

    const dbNames = new Set(dbCities.map(c => `${c.name.toLowerCase()}-${c.state.toLowerCase()}`));
    const newFromNominatim = nominatimCities.filter(c =>
      !dbNames.has(`${c.name.toLowerCase()}-${c.state.toLowerCase()}`)
    );

    setCityResults([...dbCities, ...newFromNominatim].slice(0, 15));
  }

  async function loadHoodsForCity(city) {
    setSelectedCity(city);
    setCityResults([]);
    setCitySearch(city.name + ", " + city.state);
    setForm(f => ({ ...f, neighborhood_id:"" })); // clear selection so user picks fresh
    // Try DB first
    const { data: linked } = await supabase
      .from("neighborhoods")
      .select("id, name")
      .eq("city_id", city.id)
      .order("name");
    if (linked?.length) {
      setNeighborhoods(linked);
    } else {
      // Query API route
      try {
        const res = await fetch(`/api/neighborhoods-lookup?city=${encodeURIComponent(city.name)}&state=${city.state}&lat=${city.lat}&lng=${city.lng}`);
        const data = await res.json();
        if (data.neighborhoods?.length) {
          const saveRes = await fetch("/api/save-neighborhoods", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ neighborhoods: data.neighborhoods, city_id: city.id }),
          });
          const saveData = await saveRes.json();
          setNeighborhoods(saveData.saved || []);
        } else {
          setNeighborhoods([]);
        }
      } catch(e) {
        setNeighborhoods([]);
      }
    }
    setShowCitySearch(false);
  }

  async function handleCreateHood() {
    if (!newHoodName.trim() || creating) return;
    setCreating(true);
    const name = newHoodName.trim();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const { data, error: err } = await supabase
      .from("neighborhoods")
      .insert({ name, slug, city_id: selectedCity?.id || null })
      .select("id, name")
      .single();
    if (err && err.code === "23505") {
      const { data: ex } = await supabase.from("neighborhoods").select("id, name").eq("slug", slug).maybeSingle();
      if (ex) { setForm(f => ({ ...f, neighborhood_id: ex.id })); setNeighborhoods(p => p.find(h => h.id === ex.id) ? p : [ex, ...p]); }
    } else if (data) {
      setForm(f => ({ ...f, neighborhood_id: data.id }));
      setNeighborhoods(p => [data, ...p]);
    }
    setNewHoodName(""); setShowCreateHood(false); setCreating(false);
  }

  async function handleSave() {
    if (!form.display_name.trim()) { setError("Display name can't be empty."); return; }
    setSaving(true); setError(""); setSaved(false);

    const hood = neighborhoods.find(n => n.id === form.neighborhood_id);

    const { error: profileError } = await supabase.from("profiles").update({
      display_name:    form.display_name.trim(),
      neighborhood_id: form.neighborhood_id || null,
      neighborhood:    hood?.name || null,
      updated_at:      new Date().toISOString(),
    }).eq("id", profile.id);

    if (profileError) { setError(profileError.message); setSaving(false); return; }

    // Also update auth metadata
    await supabase.auth.updateUser({
      data: {
        display_name:    form.display_name.trim(),
        neighborhood:    hood?.name || null,
        neighborhood_id: form.neighborhood_id || null,
      },
    });

    setProfile(p => ({ ...p, display_name:form.display_name.trim(), neighborhood:hood?.name, neighborhood_id:form.neighborhood_id }));
    // Keep city search populated after save — don't reset it
    setCityResults([]);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function handleDeleteAccount() {
    if (!window.confirm("This will submit a deletion request. Your account will be fully removed within 30 days. Continue?")) return;
    // Sign out immediately so the user can't continue using the account
    if (onSignOut) onSignOut();
    // Full deletion is handled server-side within 30 days
  }

  if (loading) return (
    <div style={{ flex:1, background:T.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ width:20, height:20, border:`2px solid ${T.border}`, borderTopColor:T.amber, borderRadius:"50%", animation:"spin 0.8s linear infinite" }}/>
    </div>
  );

  const score     = profile?.trust_score || 0;
  const tier      = currentTier(score);
  const next      = nextTier(score);
  const tierIndex = TIERS.findIndex(t => t.key === tier.key);
  const initials  = (profile?.display_name || "?").slice(0,2).toUpperCase();

  return (
    <div style={{ height:"100%", overflowY:"auto", background:T.bg, padding:"0 0 40px" }}>

      {/* Header */}
      <div style={{ background:T.surface, borderBottom:`1px solid ${T.border}`, padding:"16px 24px", position:"sticky", top:0, zIndex:10, display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:18, color:T.cream, flex:1 }}>
          Your <em style={{ fontStyle:"italic", color:T.amberHi }}>profile</em>
        </div>
        <button onClick={() => onNavigate && onNavigate("feed")}
          style={{ background:"transparent", border:`1px solid ${T.border}`, borderRadius:7, padding:"5px 12px", fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.creamDim, cursor:"pointer" }}>
          ← Back to feed
        </button>
      </div>

      <div style={{ maxWidth:640, margin:"0 auto", padding:"28px 24px" }}>

        {/* Avatar + name */}
        <div style={{ display:"flex", alignItems:"center", gap:20, marginBottom:32 }}>
          <div style={{ width:64, height:64, borderRadius:16, background:T.amberLo, border:`2px solid ${T.amberMid}`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Serif Display',serif", fontSize:24, color:T.amberHi, flexShrink:0 }}>
            {initials}
          </div>
          <div>
            <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:22, color:T.cream, marginBottom:4 }}>
              {profile?.display_name || "Resident"}
            </div>
            <div style={{ fontSize:13, color:T.creamDim }}>{profile?.email}</div>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:6, flexWrap:"wrap" }}>
              {profile?.neighborhood && (
                <span style={{ fontSize:11, background:T.amberLo, border:`1px solid ${T.amberMid}`, borderRadius:99, padding:"2px 9px", color:T.amberHi }}>
                  {profile.neighborhood}
                </span>
              )}
              {profile?.is_expert && (
                <span style={{ fontSize:11, background:T.purpleLo, border:`1px solid ${T.purpleMid}`, borderRadius:99, padding:"2px 9px", color:T.purpleHi }}>
                  ✓ Verified expert
                </span>
              )}
              {profile?.is_official && (
                <span style={{ fontSize:11, background:T.tealLo, border:`1px solid ${T.teal}`, borderRadius:99, padding:"2px 9px", color:T.tealHi }}>
                  ✓ Verified official
                </span>
              )}
              <span style={{ fontSize:11, background:"#0D2B1F", border:`1px solid #1B4A35`, borderRadius:99, padding:"2px 9px", color:T.tealHi, display:"flex", alignItems:"center", gap:4 }}>
                <CheckIcon color={T.tealHi} size={10}/> ZK verified resident
              </span>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:32 }}>
          {[
            { label:"Posts",         value:postCount   },
            { label:"Expert answers",value:answerCount },
            { label:"Trust score",   value:score       },
          ].map(stat => (
            <div key={stat.label} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:"14px 16px", textAlign:"center" }}>
              <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:24, color:T.cream }}>{stat.value}</div>
              <div style={{ fontSize:11, color:T.creamDim, marginTop:3 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Trust tier */}
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:"20px", marginBottom:24 }}>
          <div style={{ display:"flex", alignItems:"flex-start", gap:20, marginBottom:20 }}>
            <ScoreRing score={score}/>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, fontWeight:500, color:T.creamFaint, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6 }}>Trust tier</div>
              <div style={{ fontSize:20, fontWeight:500, color:tier.color, marginBottom:4 }}>{tier.label}</div>
              {next ? (
                <div style={{ fontSize:12, color:T.creamDim }}>
                  <span style={{ color:next.color, fontWeight:500 }}>{next.pts - score} pts</span> to {next.label}
                </div>
              ) : (
                <div style={{ fontSize:12, color:T.tealHi, display:"flex", alignItems:"center", gap:4 }}>
                  <CheckIcon color={T.tealHi} size={12}/> Maximum tier reached
                </div>
              )}
            </div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {TIERS.map((t, i) => {
              const isCurrent = t.key === tier.key;
              const isLocked  = i > tierIndex;
              const isDone    = i < tierIndex;
              return (
                <div key={t.key} className={`tier-row${isCurrent?" current":isLocked?" locked":""}`}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:t.dot, flexShrink:0 }}/>
                  <div style={{ flex:1, fontSize:13, color:t.color, fontWeight:isCurrent?500:400 }}>{t.label}</div>
                  <div style={{ fontSize:11, color:T.creamFaint }}>{t.pts} pts</div>
                  {isCurrent && <span style={{ fontSize:10, background:T.amberLo, color:T.amberHi, border:`1px solid ${T.amberMid}`, borderRadius:99, padding:"1px 8px" }}>Current</span>}
                  {isDone    && <CheckIcon color={T.tealHi} size={12}/>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Edit form */}
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:"20px", marginBottom:24 }}>
          <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:16, color:T.cream, marginBottom:18 }}>
            Edit <em style={{ fontStyle:"italic", color:T.amberHi }}>details</em>
          </div>

          <div style={{ marginBottom:14 }}>
            <label style={{ display:"block", fontSize:11, fontWeight:500, color:T.creamDim, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6 }}>
              Display name
            </label>
            <input className="profile-input" value={form.display_name}
              onChange={e => setForm(f => ({ ...f, display_name:e.target.value }))}
              placeholder="Your name"/>
          </div>

          <div style={{ marginBottom:20 }}>
            <label style={{ display:"block", fontSize:11, fontWeight:500, color:T.creamDim, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6 }}>
              Neighborhood
            </label>

            {/* Step 1 — City search */}
            <div style={{ marginBottom:8 }}>
              <input className="profile-input"
                placeholder={selectedCity ? "Change city…" : "Search your city…"}
                value={citySearch} onChange={e => searchCities(e.target.value)}
                style={{ marginBottom:4 }}/>
              {cityResults.length > 0 && (
                <div style={{ background:T.bg, border:`1px solid ${T.border}`, borderRadius:8, overflow:"hidden", marginBottom:6 }}>
                  {cityResults.map(city => (
                    <div key={city.id} onClick={() => loadHoodsForCity(city)}
                      style={{ padding:"9px 14px", fontSize:13, color:T.cream, cursor:"pointer", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between" }}
                      onMouseEnter={e => e.currentTarget.style.background = T.surfaceHi}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <span>{city.name}</span>
                      <span style={{ fontSize:11, color:T.creamDim }}>{city.state}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Step 2 — Neighborhood picker */}
            <select className="profile-select" value={form.neighborhood_id}
              onChange={e => setForm(f => ({ ...f, neighborhood_id:e.target.value }))}
              style={{ marginBottom:6 }}>
              <option value="">
                {selectedCity ? `Select neighborhood in ${selectedCity.name}…` : "Select neighborhood…"}
              </option>
              {neighborhoods.map(n => (
                <option key={n.id} value={n.id}>{n.name}</option>
              ))}
            </select>

            {/* Create neighborhood */}
            {!showCreateHood ? (
              <button onClick={() => setShowCreateHood(true)}
                style={{ background:"transparent", border:"none", fontSize:12, color:T.creamDim, cursor:"pointer", textDecoration:"underline", fontFamily:"'DM Sans',sans-serif", padding:"2px 0" }}>
                Don&apos;t see your neighborhood? Create one
              </button>
            ) : (
              <div style={{ background:T.surfaceHi, border:`1px solid ${T.border}`, borderRadius:8, padding:"12px", marginTop:6 }}>
                <input className="profile-input" placeholder="Neighborhood name"
                  value={newHoodName} onChange={e => setNewHoodName(e.target.value)}
                  style={{ marginBottom:8 }} autoFocus/>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={() => { setShowCreateHood(false); setNewHoodName(""); }}
                    style={{ flex:1, padding:"8px", background:"transparent", border:`1px solid ${T.border}`, borderRadius:7, fontSize:12, color:T.creamDim, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                    Cancel
                  </button>
                  <button onClick={handleCreateHood} disabled={!newHoodName.trim() || creating}
                    style={{ flex:2, padding:"8px", background:T.amber, border:"none", borderRadius:7, fontSize:12, fontWeight:500, color:T.bg, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", opacity:!newHoodName.trim()||creating?0.4:1 }}>
                    {creating ? "Creating…" : "Create →"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div style={{ background:T.redLo, border:`1px solid ${T.red}44`, borderRadius:7, padding:"9px 12px", fontSize:12, color:T.redHi, marginBottom:14 }}>
              {error}
            </div>
          )}

          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <button className="save-btn" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </button>
            {saved && (
              <div style={{ fontSize:13, color:T.tealHi, display:"flex", alignItems:"center", gap:6 }}>
                <CheckIcon color={T.tealHi}/> Saved
              </div>
            )}
          </div>
        </div>

        {/* Account section */}
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:"20px", marginBottom:24 }}>
          <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:16, color:T.cream, marginBottom:16 }}>Account</div>

          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", background:T.bg, border:`1px solid ${T.border}`, borderRadius:8 }}>
              <div>
                <div style={{ fontSize:13, color:T.cream }}>Email address</div>
                <div style={{ fontSize:12, color:T.creamDim, marginTop:2 }}>{profile?.email}</div>
              </div>
              <a href="mailto:hello@townhallcafe.org?subject=Email change request"
                style={{fontSize:11,color:T.creamDim,textDecoration:"none",
                  background:T.surface,border:`1px solid ${T.border}`,borderRadius:7,padding:"3px 10px"}}>
                Contact us to change
              </a>
            </div>

            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", background:T.bg, border:`1px solid ${T.border}`, borderRadius:8 }}>
              <div>
                <div style={{ fontSize:13, color:T.cream }}>Password</div>
                <div style={{ fontSize:12, color:T.creamDim, marginTop:2 }}>Change your password</div>
              </div>
              <a href="/reset-password" style={{ fontSize:12, color:T.amberHi, textDecoration:"none", background:T.amberLo, border:`1px solid ${T.amberMid}`, borderRadius:7, padding:"5px 12px" }}>
                Reset →
              </a>
            </div>

            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", background:T.bg, border:`1px solid ${T.border}`, borderRadius:8 }}>
              <div>
                <div style={{ fontSize:13, color:T.cream }}>App tour</div>
                <div style={{ fontSize:12, color:T.creamDim, marginTop:2 }}>Retake the walkthrough</div>
              </div>
              <button onClick={() => {
                try { localStorage.removeItem("th_walkthrough_done"); } catch(e) {}
                window.location.reload();
              }} style={{ fontSize:12, color:T.creamDim, background:"transparent", border:`1px solid ${T.border}`, borderRadius:7, padding:"5px 12px", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                Retake tour
              </button>
            </div>

            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", background:T.bg, border:`1px solid ${T.border}`, borderRadius:8 }}>
              <div>
                <div style={{ fontSize:13, color:T.cream }}>Sign out</div>
                <div style={{ fontSize:12, color:T.creamDim, marginTop:2 }}>Sign out of this device</div>
              </div>
              <button onClick={onSignOut}
                style={{ fontSize:12, color:T.creamDim, background:"transparent", border:`1px solid ${T.border}`, borderRadius:7, padding:"5px 12px", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                Sign out
              </button>
            </div>
          </div>
        </div>

        {/* Danger zone */}
        <div style={{ background:T.redLo, border:`1px solid ${T.red}22`, borderRadius:12, padding:"16px 20px" }}>
          <div style={{ fontSize:13, fontWeight:500, color:T.redHi, marginBottom:4 }}>Danger zone</div>
          <div style={{ fontSize:12, color:T.creamDim, marginBottom:12, lineHeight:1.6 }}>
            Submitting a deletion request signs you out immediately. Your profile and personal data will be fully removed within 30 days. Posts remain but are anonymised.
          </div>
          <button onClick={handleDeleteAccount}
            style={{ background:"transparent", border:`1px solid ${T.red}44`, borderRadius:7, padding:"7px 16px", fontSize:12, color:T.redHi, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
            Request account deletion
          </button>
        </div>

      </div>
    </div>
  );
}
