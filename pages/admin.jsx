import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

// ── Change this to your email address ─────────────────────────────────────
const ADMIN_EMAIL = "your@email.com";

const T = {
  bg:"#0F0E0C", surface:"#1A1916", border:"#2C2A26", borderHi:"#4A4640",
  cream:"#F2EDE4", creamDim:"#9A9188", creamFaint:"#4A4640",
  amber:"#D4922A", amberLo:"#2A1E08", amberMid:"#8C5E14", amberHi:"#F0B84A",
  teal:"#1D9E75", tealLo:"#0A2A1E", tealHi:"#4CAF80",
  blue:"#378ADD", blueLo:"#0D1E35", blueHi:"#85B7EB",
  purple:"#7F77DD", purpleLo:"#1A1835", purpleHi:"#AFA9EC", purpleMid:"#534AB7",
  red:"#C0392B", redLo:"#2A0E0A", redHi:"#E57373",
  green:"#2D6A4F", greenHi:"#4CAF80",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${T.bg}; color: ${T.cream}; font-family: 'DM Sans', sans-serif; min-height: 100vh; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin   { to{transform:rotate(360deg)} }
  .spinner { width:20px;height:20px;border:2px solid ${T.border};border-top-color:${T.amber};border-radius:50%;animation:spin 0.8s linear infinite; }
`;

function StatusBadge({ status }) {
  const styles = {
    pending:  { bg:T.amberLo,  color:T.amberHi,  border:T.amberMid },
    approved: { bg:T.tealLo,   color:T.tealHi,   border:T.teal },
    rejected: { bg:T.redLo,    color:T.redHi,    border:T.red },
  };
  const s = styles[status] || styles.pending;
  return (
    <span style={{ padding:"2px 10px", borderRadius:99, fontSize:11, fontWeight:500,
      background:s.bg, color:s.color, border:`1px solid ${s.border}` }}>
      {status}
    </span>
  );
}

export default function AdminPage() {
  const [user,         setUser]         = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [applications, setApplications] = useState([]);
  const [filter,       setFilter]       = useState("pending");
  const [actionNote,   setActionNote]   = useState({});
  const [processing,   setProcessing]   = useState({});
  const [toast,        setToast]        = useState(null);
  const [docUrls,      setDocUrls]      = useState({});

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user?.email === ADMIN_EMAIL) {
        loadApplications();
      }
      setLoading(false);
    });
  }, []);

  async function loadApplications() {
    const { data, error } = await supabase
      .from("expert_applications")
      .select("*, auth_user:user_id(email)")
      .order("created_at", { ascending: false });
    if (!error) setApplications(data || []);
  }

  async function getDocUrl(app) {
    if (docUrls[app.id]) return;
    if (!app.credential_url) return;
    // Generate a signed URL valid for 1 hour
    const path = app.credential_url.split("expert-credentials/")[1];
    if (!path) return;
    const { data } = await supabase.storage
      .from("expert-credentials")
      .createSignedUrl(path, 3600);
    if (data?.signedUrl) {
      setDocUrls(prev => ({ ...prev, [app.id]: data.signedUrl }));
    }
  }

  async function handleApprove(app) {
    setProcessing(p => ({ ...p, [app.id]: "approving" }));
    const note = actionNote[app.id] || null;
    const { error } = await supabase.rpc("approve_expert_application", {
      application_id: app.id,
      note,
    });
    if (error) {
      showToast("Error: " + error.message, T.red);
    } else {
      setApplications(prev => prev.map(a =>
        a.id === app.id ? { ...a, status: "approved", admin_note: note } : a
      ));
      showToast(`${app.full_name} approved as expert`, T.tealHi);
    }
    setProcessing(p => ({ ...p, [app.id]: null }));
  }

  async function handleReject(app) {
    setProcessing(p => ({ ...p, [app.id]: "rejecting" }));
    const note = actionNote[app.id] || null;
    const { error } = await supabase.rpc("reject_expert_application", {
      application_id: app.id,
      note,
    });
    if (error) {
      showToast("Error: " + error.message, T.red);
    } else {
      setApplications(prev => prev.map(a =>
        a.id === app.id ? { ...a, status: "rejected", admin_note: note } : a
      ));
      showToast(`${app.full_name} application rejected`, T.redHi);
    }
    setProcessing(p => ({ ...p, [app.id]: null }));
  }

  function showToast(msg, color = T.amberHi) {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 3000);
  }

  if (loading) return (
    <div style={{ minHeight:"100vh", background:T.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div className="spinner"/>
      <style>{css}</style>
    </div>
  );

  if (!user || user.email !== ADMIN_EMAIL) return (
    <div style={{ minHeight:"100vh", background:T.bg, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:12 }}>
      <style>{css}</style>
      <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:22, color:T.cream }}>Access denied</div>
      <div style={{ fontSize:13, color:T.creamDim }}>This page is for admins only.</div>
    </div>
  );

  const filtered = applications.filter(a => filter === "all" || a.status === filter);
  const counts = {
    pending:  applications.filter(a => a.status === "pending").length,
    approved: applications.filter(a => a.status === "approved").length,
    rejected: applications.filter(a => a.status === "rejected").length,
  };

  return (
    <>
      <style>{css}</style>

      {/* Header */}
      <div style={{ background:T.surface, borderBottom:`1px solid ${T.border}`, padding:"0 32px", height:52, display:"flex", alignItems:"center", gap:16 }}>
        <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:18, color:T.cream }}>
          Townhall <span style={{ color:T.amberHi }}>Admin</span>
        </div>
        <div style={{ fontSize:12, color:T.creamDim, marginLeft:8 }}>Expert applications</div>
        <div style={{ marginLeft:"auto", fontSize:12, color:T.creamDim }}>{user.email}</div>
      </div>

      <div style={{ maxWidth:900, margin:"0 auto", padding:"32px 24px" }}>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:28 }}>
          {[
            { label:"Pending review", count:counts.pending, color:T.amberHi, bg:T.amberLo, border:T.amberMid },
            { label:"Approved",       count:counts.approved, color:T.tealHi,  bg:T.tealLo,  border:T.teal },
            { label:"Rejected",       count:counts.rejected, color:T.redHi,   bg:T.redLo,   border:T.red },
          ].map(s => (
            <div key={s.label} style={{ background:s.bg, border:`1px solid ${s.border}`, borderRadius:10, padding:"14px 18px" }}>
              <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:28, color:s.color }}>{s.count}</div>
              <div style={{ fontSize:12, color:s.color, opacity:0.7, marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div style={{ display:"flex", gap:0, borderBottom:`1px solid ${T.border}`, marginBottom:20 }}>
          {["pending","approved","rejected","all"].map(f => (
            <div key={f} onClick={() => setFilter(f)} style={{
              padding:"9px 18px", fontSize:13, cursor:"pointer",
              color: filter===f ? T.amberHi : T.creamDim,
              borderBottom: filter===f ? `2px solid ${T.amber}` : "2px solid transparent",
              transition:"all 0.15s", textTransform:"capitalize",
            }}>
              {f} {f!=="all" && <span style={{ fontSize:11, opacity:0.7 }}>({counts[f]||0})</span>}
            </div>
          ))}
        </div>

        {/* Application cards */}
        {filtered.length === 0 && (
          <div style={{ textAlign:"center", padding:"60px 0", color:T.creamFaint, fontSize:13 }}>
            No {filter} applications.
          </div>
        )}

        {filtered.map((app, i) => (
          <div key={app.id} style={{
            background:T.surface, border:`1px solid ${T.border}`, borderRadius:12,
            marginBottom:16, overflow:"hidden",
            animation:`fadeUp 0.3s ease both`, animationDelay:`${i*0.05}s`,
          }}>
            {/* App header */}
            <div style={{ padding:"16px 20px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"flex-start", gap:16 }}>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                  <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:17, color:T.cream }}>{app.full_name}</div>
                  <StatusBadge status={app.status}/>
                </div>
                <div style={{ fontSize:13, color:T.creamDim }}>{app.organisation}</div>
                {app.license_number && <div style={{ fontSize:12, color:T.creamFaint, marginTop:2 }}>License: {app.license_number}</div>}
                <div style={{ fontSize:11, color:T.creamFaint, marginTop:4 }}>
                  {new Date(app.created_at).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric", hour:"2-digit", minute:"2-digit" })}
                  {app.auth_user?.email && <span style={{ marginLeft:8 }}>· {app.auth_user.email}</span>}
                </div>
              </div>

              {/* Domains */}
              <div style={{ display:"flex", gap:6, flexWrap:"wrap", maxWidth:280 }}>
                {(app.domains||[]).map(d => (
                  <span key={d} style={{ padding:"2px 8px", borderRadius:99, fontSize:10, fontWeight:500, background:T.purpleLo, color:T.purpleHi, border:`1px solid ${T.purpleMid}` }}>
                    {d}
                  </span>
                ))}
              </div>
            </div>

            {/* Credential document */}
            {app.credential_url && (
              <div style={{ padding:"12px 20px", borderBottom:`1px solid ${T.border}`, background:T.bg, display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ fontSize:12, color:T.creamDim, flex:1 }}>
                  📄 {app.credential_name || "Credential document"}
                </div>
                <button
                  onClick={() => {
                    getDocUrl(app).then(() => {
                      if (docUrls[app.id]) window.open(docUrls[app.id], "_blank");
                    });
                  }}
                  style={{ background:T.blueLo, border:`1px solid ${T.blue}44`, borderRadius:7, padding:"5px 14px", fontSize:12, color:T.blueHi, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                  View document →
                </button>
              </div>
            )}

            {/* Admin note (if already reviewed) */}
            {app.admin_note && (
              <div style={{ padding:"10px 20px", background:T.bg, borderBottom:`1px solid ${T.border}`, fontSize:12, color:T.creamDim }}>
                <span style={{ color:T.creamFaint }}>Admin note: </span>{app.admin_note}
              </div>
            )}

            {/* Review actions — only for pending */}
            {app.status === "pending" && (
              <div style={{ padding:"14px 20px", display:"flex", alignItems:"center", gap:10 }}>
                <input
                  placeholder="Optional note to applicant…"
                  value={actionNote[app.id] || ""}
                  onChange={e => setActionNote(prev => ({ ...prev, [app.id]: e.target.value }))}
                  style={{ flex:1, background:T.bg, border:`1px solid ${T.border}`, borderRadius:7, padding:"7px 12px", fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.cream, outline:"none" }}
                />
                <button
                  disabled={!!processing[app.id]}
                  onClick={() => handleReject(app)}
                  style={{ background:T.redLo, border:`1px solid ${T.red}44`, borderRadius:7, padding:"7px 16px", fontSize:12, color:T.redHi, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", whiteSpace:"nowrap" }}>
                  {processing[app.id]==="rejecting" ? "Rejecting…" : "Reject"}
                </button>
                <button
                  disabled={!!processing[app.id]}
                  onClick={() => handleApprove(app)}
                  style={{ background:T.tealLo, border:`1px solid ${T.teal}44`, borderRadius:7, padding:"7px 16px", fontSize:12, color:T.tealHi, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", whiteSpace:"nowrap", fontWeight:500 }}>
                  {processing[app.id]==="approving" ? "Approving…" : "✓ Approve"}
                </button>
              </div>
            )}

            {/* Already reviewed */}
            {app.status !== "pending" && (
              <div style={{ padding:"10px 20px", fontSize:11, color:T.creamFaint }}>
                Reviewed {app.reviewed_at ? new Date(app.reviewed_at).toLocaleDateString() : ""}
              </div>
            )}
          </div>
        ))}
      </div>

      {toast && (
        <div style={{ position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)", background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:"9px 18px", fontSize:13, color:T.cream, display:"flex", alignItems:"center", gap:8, zIndex:200, whiteSpace:"nowrap" }}>
          <div style={{ width:7, height:7, borderRadius:"50%", background:toast.color }}/>
          {toast.msg}
        </div>
      )}
    </>
  );
}
