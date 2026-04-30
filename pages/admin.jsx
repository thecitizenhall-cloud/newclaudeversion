import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { T } from "../styles/theme";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${T.bg}; color: ${T.cream}; font-family: 'DM Sans', sans-serif; min-height: 100vh; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin   { to{transform:rotate(360deg)} }
  .spinner { width:20px;height:20px;border:2px solid ${T.border};border-top-color:${T.amber};border-radius:50%;animation:spin 0.8s linear infinite; }
`;

function StatusBadge({ status }) {
  const s = {
    pending:  { bg:T.amberLo, color:T.amberHi, border:T.amberMid },
    approved: { bg:T.tealLo,  color:T.tealHi,  border:T.teal },
    rejected: { bg:T.redLo,   color:T.redHi,   border:T.red },
  }[status] || { bg:T.amberLo, color:T.amberHi, border:T.amberMid };
  return (
    <span style={{ padding:"2px 10px", borderRadius:99, fontSize:11, fontWeight:500,
      background:s.bg, color:s.color, border:`1px solid ${s.border}` }}>
      {status}
    </span>
  );
}

function ActionRow({ app, onApprove, onReject, processing, note, setNote }) {
  if (app.status !== "pending") return (
    <div style={{ padding:"10px 20px", fontSize:11, color:T.creamFaint }}>
      Reviewed {app.reviewed_at ? new Date(app.reviewed_at).toLocaleDateString() : ""}
      {app.admin_note && <span style={{ marginLeft:8, color:T.creamDim }}>· {app.admin_note}</span>}
    </div>
  );
  return (
    <div style={{ padding:"14px 20px", display:"flex", alignItems:"center", gap:10 }}>
      <input placeholder="Optional note…" value={note || ""} onChange={e => setNote(e.target.value)}
        style={{ flex:1, background:T.bg, border:`1px solid ${T.border}`, borderRadius:7,
          padding:"7px 12px", fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.cream, outline:"none" }}/>
      <button disabled={!!processing} onClick={onReject}
        style={{ background:T.redLo, border:`1px solid ${T.red}44`, borderRadius:7, padding:"7px 16px",
          fontSize:12, color:T.redHi, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", whiteSpace:"nowrap" }}>
        {processing === "rejecting" ? "Rejecting…" : "Reject"}
      </button>
      <button disabled={!!processing} onClick={onApprove}
        style={{ background:T.tealLo, border:`1px solid ${T.teal}44`, borderRadius:7, padding:"7px 16px",
          fontSize:12, color:T.tealHi, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", whiteSpace:"nowrap", fontWeight:500 }}>
        {processing === "approving" ? "Approving…" : "✓ Approve"}
      </button>
    </div>
  );
}

export default function AdminPage() {
  const [user,       setUser]       = useState(null);
  const [profile,    setProfile]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [tab,        setTab]        = useState("experts");
  const [experts,    setExperts]    = useState([]);
  const [officials,  setOfficials]  = useState([]);
  const [reports,    setReports]    = useState([]);
  const [filter,     setFilter]     = useState("pending");
  const [notes,      setNotes]      = useState({});
  const [processing, setProcessing] = useState({});
  const [docUrls,    setDocUrls]    = useState({});
  const [toast,      setToast]      = useState(null);

  useEffect(() => {
    async function init() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }
        setUser(user);

        // FIX: use maybeSingle() so missing profile doesn't throw 406
        const { data: prof } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .maybeSingle();

        // FIX: guard against null profile
        setProfile(prof || {});
        if (prof?.is_admin) await loadAll();
      } catch (e) {
        console.error("Admin init error:", e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  async function loadAll() {
    const [{ data: exp }, { data: off }, { data: rep }] = await Promise.all([
      supabase.from("expert_applications").select("*").order("created_at", { ascending:false }),
      supabase.from("official_applications").select("*").order("created_at", { ascending:false }),
      supabase.from("reported_posts")
        .select("*, posts(body, author_id), reporter:reporter_id(email)")
        .order("created_at", { ascending:false }),
    ]);
    setExperts(exp || []);
    setOfficials(off || []);
    setReports(rep || []);
  }

  async function getDocUrl(app) {
    if (docUrls[app.id] || !app.credential_url) return;
    const path = app.credential_url.split("expert-credentials/")[1];
    if (!path) return;
    const { data } = await supabase.storage
      .from("expert-credentials")
      .createSignedUrl(path, 3600);
    if (data?.signedUrl) setDocUrls(p => ({ ...p, [app.id]: data.signedUrl }));
  }

  async function approveExpert(app) {
    setProcessing(p => ({ ...p, [app.id]:"approving" }));
    const { error } = await supabase.rpc("approve_expert_application",
      { application_id:app.id, note:notes[app.id] || null });
    if (error) showToast("Error: " + error.message, T.red);
    else {
      setExperts(p => p.map(a => a.id === app.id ? { ...a, status:"approved" } : a));
      showToast(`${app.full_name} approved as expert`, T.tealHi);
    }
    setProcessing(p => ({ ...p, [app.id]:null }));
  }

  async function rejectExpert(app) {
    setProcessing(p => ({ ...p, [app.id]:"rejecting" }));
    const { error } = await supabase.rpc("reject_expert_application",
      { application_id:app.id, note:notes[app.id] || null });
    if (error) showToast("Error: " + error.message, T.red);
    else {
      setExperts(p => p.map(a => a.id === app.id ? { ...a, status:"rejected" } : a));
      showToast("Application rejected", T.redHi);
    }
    setProcessing(p => ({ ...p, [app.id]:null }));
  }

  async function approveOfficial(app) {
    setProcessing(p => ({ ...p, [app.id]:"approving" }));
    const { error } = await supabase.rpc("approve_official_application",
      { application_id:app.id, note:notes[app.id] || null });
    if (error) showToast("Error: " + error.message, T.red);
    else {
      setOfficials(p => p.map(a => a.id === app.id ? { ...a, status:"approved" } : a));
      showToast(`${app.full_name} approved as official`, T.tealHi);
    }
    setProcessing(p => ({ ...p, [app.id]:null }));
  }

  async function rejectOfficial(app) {
    setProcessing(p => ({ ...p, [app.id]:"rejecting" }));
    const { error } = await supabase.rpc("reject_official_application",
      { application_id:app.id, note:notes[app.id] || null });
    if (error) showToast("Error: " + error.message, T.red);
    else {
      setOfficials(p => p.map(a => a.id === app.id ? { ...a, status:"rejected" } : a));
      showToast("Application rejected", T.redHi);
    }
    setProcessing(p => ({ ...p, [app.id]:null }));
  }

  function showToast(msg, color = T.amberHi) {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 3000);
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight:"100vh", background:T.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div className="spinner"/><style>{css}</style>
    </div>
  );

  // ── Not admin ─────────────────────────────────────────────────────────────
  if (!user || !profile?.is_admin) return (
    <div style={{ minHeight:"100vh", background:T.bg, display:"flex", alignItems:"center",
      justifyContent:"center", flexDirection:"column", gap:12 }}>
      <style>{css}</style>
      <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:22, color:T.cream }}>Access denied</div>
      <div style={{ fontSize:13, color:T.creamDim }}>
        {!user ? "Please sign in." : "This page is for Townhall admins only."}
      </div>
      {!user && (
        <a href="/" style={{ fontSize:13, color:T.amberHi, textDecoration:"none",
          background:T.amberLo, border:`1px solid ${T.amberMid}`, borderRadius:8, padding:"8px 20px" }}>
          Go to app →
        </a>
      )}
    </div>
  );

  // ── Data ──────────────────────────────────────────────────────────────────
  const apps     = tab === "experts" ? experts : tab === "officials" ? officials : [];
  const filtered = tab === "reports"
    ? reports.filter(r => filter === "all" || r.status === filter)
    : apps.filter(a => filter === "all" || a.status === filter);

  const pendingExperts   = experts.filter(a => a.status === "pending").length;
  const pendingOfficials = officials.filter(a => a.status === "pending").length;
  const pendingReports   = reports.filter(r => r.status === "pending").length;

  const pending  = apps.filter(a => a.status === "pending").length;
  const approved = apps.filter(a => a.status === "approved").length;
  const rejected = apps.filter(a => a.status === "rejected").length;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{css}</style>

      {/* Topbar */}
      <div style={{ background:T.surface, borderBottom:`1px solid ${T.border}`, padding:"0 32px",
        height:52, display:"flex", alignItems:"center", gap:16 }}>
        <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:18, color:T.cream }}>
          Townhall <span style={{ color:T.amberHi }}>Admin</span>
        </div>
        <div style={{ marginLeft:"auto", fontSize:12, color:T.creamDim }}>{user.email}</div>
        <a href="/" style={{ fontSize:12, color:T.creamDim, textDecoration:"none",
          border:`1px solid ${T.border}`, borderRadius:7, padding:"4px 12px" }}>
          ← App
        </a>
      </div>

      <div style={{ maxWidth:900, margin:"0 auto", padding:"32px 24px" }}>

        {/* Tab nav */}
        <div style={{ display:"flex", gap:0, marginBottom:24, borderBottom:`1px solid ${T.border}` }}>
          {[
            { key:"experts",   label:"Expert applications",   count:pendingExperts,   color:T.purpleHi },
            { key:"officials", label:"Official applications", count:pendingOfficials, color:T.tealHi },
            { key:"reports",   label:"Reported posts",        count:pendingReports,   color:T.redHi },
          ].map(t => (
            <div key={t.key} onClick={() => { setTab(t.key); setFilter("pending"); }} style={{
              padding:"10px 20px", fontSize:13, cursor:"pointer",
              color:tab === t.key ? t.color : T.creamDim,
              borderBottom:tab === t.key ? `2px solid ${t.color}` : "2px solid transparent",
              display:"flex", alignItems:"center", gap:8, transition:"all 0.15s",
            }}>
              {t.label}
              {t.count > 0 && (
                <span style={{ background:T.surface, color:t.color, border:`1px solid ${t.color}44`,
                  borderRadius:99, padding:"0 7px", fontSize:10 }}>
                  {t.count}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Stats row — only for application tabs */}
        {tab !== "reports" && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:24 }}>
            {[
              { label:"Pending",  count:pending,  color:T.amberHi, bg:T.amberLo, border:T.amberMid },
              { label:"Approved", count:approved, color:T.tealHi,  bg:T.tealLo,  border:T.teal },
              { label:"Rejected", count:rejected, color:T.redHi,   bg:T.redLo,   border:T.red },
            ].map(s => (
              <div key={s.label} style={{ background:s.bg, border:`1px solid ${s.border}`, borderRadius:10, padding:"14px 18px" }}>
                <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:28, color:s.color }}>{s.count}</div>
                <div style={{ fontSize:12, color:s.color, opacity:0.7, marginTop:2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filter tabs */}
        <div style={{ display:"flex", gap:0, borderBottom:`1px solid ${T.border}`, marginBottom:20 }}>
          {(tab === "reports" ? ["pending","reviewed","dismissed","all"] : ["pending","approved","rejected","all"]).map(f => (
            <div key={f} onClick={() => setFilter(f)} style={{
              padding:"9px 18px", fontSize:13, cursor:"pointer",
              color:filter === f ? T.amberHi : T.creamDim,
              borderBottom:filter === f ? `2px solid ${T.amber}` : "2px solid transparent",
              transition:"all 0.15s", textTransform:"capitalize",
            }}>
              {f}
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign:"center", padding:"60px 0", color:T.creamFaint, fontSize:13 }}>
            No {filter} {tab === "reports" ? "reports" : tab.replace("s","")} applications.
          </div>
        )}

        {/* ── Expert applications ── */}
        {tab === "experts" && filtered.map((app, i) => (
          <div key={app.id} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12,
            marginBottom:16, overflow:"hidden", animation:"fadeUp 0.3s ease both",
            animationDelay:`${i * 0.05}s` }}>
            <div style={{ padding:"16px 20px", borderBottom:`1px solid ${T.border}`,
              display:"flex", alignItems:"flex-start", gap:16 }}>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                  <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:17, color:T.cream }}>
                    {app.full_name}
                  </div>
                  <StatusBadge status={app.status}/>
                </div>
                <div style={{ fontSize:13, color:T.creamDim }}>{app.organisation}</div>
                {app.license_number && (
                  <div style={{ fontSize:12, color:T.creamFaint, marginTop:2 }}>
                    License: {app.license_number}
                  </div>
                )}
                <div style={{ fontSize:11, color:T.creamFaint, marginTop:4 }}>
                  {new Date(app.created_at).toLocaleDateString("en-US",
                    { month:"short", day:"numeric", year:"numeric" })}
                </div>
              </div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap", maxWidth:260 }}>
                {(app.domains || []).map(d => (
                  <span key={d} style={{ padding:"2px 8px", borderRadius:99, fontSize:10, fontWeight:500,
                    background:T.purpleLo, color:T.purpleHi, border:`1px solid ${T.purpleMid}` }}>
                    {d}
                  </span>
                ))}
              </div>
            </div>

            {app.credential_url && (
              <div style={{ padding:"12px 20px", borderBottom:`1px solid ${T.border}`,
                background:T.bg, display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ fontSize:12, color:T.creamDim, flex:1 }}>
                  📄 {app.credential_name || "Credential document"}
                </div>
                <button onClick={async () => {
                  await getDocUrl(app);
                  if (docUrls[app.id]) window.open(docUrls[app.id], "_blank");
                }} style={{ background:T.blueLo, border:`1px solid ${T.blue}44`, borderRadius:7,
                  padding:"5px 14px", fontSize:12, color:T.blueHi, cursor:"pointer",
                  fontFamily:"'DM Sans',sans-serif" }}>
                  View document →
                </button>
              </div>
            )}

            <ActionRow app={app}
              onApprove={() => approveExpert(app)}
              onReject={() => rejectExpert(app)}
              processing={processing[app.id]}
              note={notes[app.id]}
              setNote={v => setNotes(p => ({ ...p, [app.id]:v }))}
            />
          </div>
        ))}

        {/* ── Official applications ── */}
        {tab === "officials" && filtered.map((app, i) => (
          <div key={app.id} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12,
            marginBottom:16, overflow:"hidden", animation:"fadeUp 0.3s ease both",
            animationDelay:`${i * 0.05}s` }}>
            <div style={{ padding:"16px 20px", borderBottom:`1px solid ${T.border}` }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:17, color:T.cream }}>
                  {app.full_name}
                </div>
                <StatusBadge status={app.status}/>
                {app.civic_verified && (
                  <span style={{ padding:"2px 9px", borderRadius:99, fontSize:10, fontWeight:500,
                    background:T.tealLo, color:T.tealHi, border:`1px solid ${T.teal}44` }}>
                    ✓ Civic API match
                  </span>
                )}
              </div>
              <div style={{ fontSize:13, color:T.creamDim }}>
                {app.title}{app.department && ` · ${app.department}`}
              </div>
              <div style={{ fontSize:12, color:T.creamFaint, marginTop:2 }}>
                {app.jurisdiction}, {app.jurisdiction_state}
              </div>
              <div style={{ fontSize:12, color:T.creamFaint, marginTop:2 }}>
                {app.official_email}{app.phone && ` · ${app.phone}`}
              </div>
              <div style={{ fontSize:11, color:T.creamFaint, marginTop:4 }}>
                {new Date(app.created_at).toLocaleDateString("en-US",
                  { month:"short", day:"numeric", year:"numeric" })}
              </div>

              {app.civic_match && (
                <div style={{ marginTop:12, background:T.tealLo, border:`1px solid ${T.teal}44`,
                  borderRadius:8, padding:"10px 12px", fontSize:12, color:T.tealHi, lineHeight:1.6 }}>
                  <div style={{ fontWeight:500, marginBottom:4 }}>Google Civic API match</div>
                  <div>Name: {app.civic_match.name}</div>
                  <div>Office: {app.civic_match.office}</div>
                  {app.civic_match.party && <div>Party: {app.civic_match.party}</div>}
                  {(app.civic_match.emails || []).length > 0 && (
                    <div>Official email: {app.civic_match.emails[0]}</div>
                  )}
                </div>
              )}
            </div>

            <ActionRow app={app}
              onApprove={() => approveOfficial(app)}
              onReject={() => rejectOfficial(app)}
              processing={processing[app.id]}
              note={notes[app.id]}
              setNote={v => setNotes(p => ({ ...p, [app.id]:v }))}
            />
          </div>
        ))}

        {/* ── Reported posts ── */}
        {tab === "reports" && filtered.map((r, i) => (
          <div key={r.id} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12,
            marginBottom:16, overflow:"hidden", animation:"fadeUp 0.3s ease both",
            animationDelay:`${i * 0.05}s` }}>
            <div style={{ padding:"14px 20px", borderBottom:`1px solid ${T.border}` }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                <span style={{
                  padding:"2px 9px", borderRadius:99, fontSize:11, fontWeight:500,
                  background:r.status === "pending" ? T.amberLo : r.status === "dismissed" ? T.border : T.tealLo,
                  color:r.status === "pending" ? T.amberHi : r.status === "dismissed" ? T.creamDim : T.tealHi,
                  border:`1px solid ${r.status === "pending" ? T.amberMid : T.border}`,
                }}>
                  {r.status}
                </span>
                <span style={{ fontSize:12, color:T.creamDim, background:T.bg,
                  border:`1px solid ${T.border}`, borderRadius:99, padding:"2px 9px" }}>
                  {r.reason}
                </span>
                <span style={{ fontSize:11, color:T.creamFaint, marginLeft:"auto" }}>
                  {new Date(r.created_at).toLocaleDateString()}
                </span>
              </div>
              <div style={{ fontSize:13, color:T.cream, lineHeight:1.6, padding:"10px 12px",
                background:T.bg, borderRadius:8, marginBottom:8 }}>
                {r.posts?.body || "Post deleted"}
              </div>
              <div style={{ fontSize:11, color:T.creamFaint }}>
                Reported by {r.reporter?.email || "unknown"}
              </div>
            </div>

            {r.status === "pending" && (
              <div style={{ padding:"12px 20px", display:"flex", gap:10 }}>
                <button onClick={async () => {
                  await supabase.from("reported_posts").update({ status:"dismissed" }).eq("id", r.id);
                  setReports(prev => prev.map(x => x.id === r.id ? { ...x, status:"dismissed" } : x));
                  showToast("Report dismissed", T.tealHi);
                }} style={{ background:T.border, border:"none", borderRadius:7, padding:"7px 16px",
                  fontSize:12, color:T.cream, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                  Dismiss
                </button>
                <button onClick={async () => {
                  await supabase.from("posts").delete().eq("id", r.post_id);
                  await supabase.from("reported_posts").update({ status:"reviewed" }).eq("id", r.id);
                  setReports(prev => prev.map(x => x.id === r.id ? { ...x, status:"reviewed" } : x));
                  showToast("Post removed", T.redHi);
                }} style={{ background:T.redLo, border:`1px solid ${T.red}44`, borderRadius:7,
                  padding:"7px 16px", fontSize:12, color:T.redHi, cursor:"pointer",
                  fontFamily:"'DM Sans',sans-serif", fontWeight:500 }}>
                  Remove post
                </button>
              </div>
            )}
          </div>
        ))}

      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)",
          background:T.surface, border:`1px solid ${T.border}`, borderRadius:10,
          padding:"9px 18px", fontSize:13, color:T.cream, display:"flex", alignItems:"center",
          gap:8, zIndex:200, whiteSpace:"nowrap" }}>
          <div style={{ width:7, height:7, borderRadius:"50%", background:toast.color }}/>
          {toast.msg}
        </div>
      )}
    </>
  );
}
