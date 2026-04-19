"use client";
// ApplyExpert.jsx
// Drop-in replacement for the ApplyPanel component inside ExpertScreen.jsx
// Handles credential document upload + application submission

import { useState } from "react";
import { supabase } from "../lib/supabase";

const T = {
  bg:"#0F0E0C", surface:"#1A1916", border:"#2C2A26", borderHi:"#4A4640",
  cream:"#F2EDE4", creamDim:"#9A9188", creamFaint:"#4A4640",
  amber:"#D4922A", amberLo:"#2A1E08", amberMid:"#8C5E14", amberHi:"#F0B84A",
  teal:"#1D9E75", tealLo:"#0A2A1E", tealHi:"#4CAF80",
  purple:"#7F77DD", purpleLo:"#1A1835", purpleHi:"#AFA9EC", purpleMid:"#534AB7",
  red:"#C0392B", redLo:"#2A0E0A", redHi:"#E57373",
  green:"#2D6A4F", greenHi:"#4CAF80",
};

const DOMAINS = [
  { key:"traffic",  label:"Traffic & transport"  },
  { key:"arch",     label:"Architecture & zoning" },
  { key:"fiscal",   label:"Budget & fiscal"       },
  { key:"env",      label:"Environment"           },
  { key:"legal",    label:"Local law & policy"    },
  { key:"housing",  label:"Housing"               },
];

function CheckIcon({ color, size=16 }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path d="M3 8l3.5 3.5L13 4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>;
}

export default function ApplyExpert({ onClose, onSuccess }) {
  const [form,        setForm]        = useState({ name:"", org:"", license:"" });
  const [selDomains,  setSelDomains]  = useState([]);
  const [file,        setFile]        = useState(null);
  const [uploading,   setUploading]   = useState(false);
  const [uploadPct,   setUploadPct]   = useState(0);
  const [error,       setError]       = useState("");
  const [done,        setDone]        = useState(false);
  const [existingApp, setExistingApp] = useState(null); // if already applied

  const valid = form.name && form.org && selDomains.length > 0 && file;

  function toggleDomain(k) {
    setSelDomains(ds => ds.includes(k) ? ds.filter(d => d!==k) : [...ds, k]);
  }

  function handleFileChange(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    // Accept PDF, images, Word docs
    const allowed = ["application/pdf","image/jpeg","image/png","image/heic","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowed.includes(f.type) && !f.name.match(/\.(pdf|jpg|jpeg|png|heic|doc|docx)$/i)) {
      setError("Please upload a PDF, image, or Word document.");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError("File must be under 10MB.");
      return;
    }
    setError("");
    setFile(f);
  }

  async function handleSubmit() {
    if (!valid || uploading) return;
    setError("");
    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in first");

      // Check for existing application
      const { data: existing } = await supabase
        .from("expert_applications")
        .select("id, status")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        if (existing.status === "pending") {
          setExistingApp(existing);
          setUploading(false);
          return;
        }
        if (existing.status === "approved") {
          setDone(true);
          onSuccess();
          setUploading(false);
          return;
        }
        // If rejected, allow reapplication — delete old one
        await supabase.from("expert_applications").delete().eq("id", existing.id);
      }

      // Upload credential document
      setUploadPct(20);
      const ext = file.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("expert-credentials")
        .upload(filePath, file, { cacheControl:"3600", upsert:false });

      if (uploadError) throw new Error("Upload failed: " + uploadError.message);
      setUploadPct(70);

      // Get the storage path (not a public URL — admin will generate signed URL)
      const credentialUrl = `expert-credentials/${filePath}`;

      // Create application record
      const { error: insertError } = await supabase
        .from("expert_applications")
        .insert({
          user_id:         user.id,
          full_name:       form.name,
          organisation:    form.org,
          license_number:  form.license || null,
          domains:         selDomains,
          credential_url:  credentialUrl,
          credential_name: file.name,
          status:          "pending",
        });

      if (insertError) throw new Error(insertError.message);
      setUploadPct(100);

      setTimeout(() => {
        setDone(true);
        // Don't call onSuccess yet — user isn't an expert until admin approves
      }, 400);

    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
      setUploadPct(0);
    } finally {
      setUploading(false);
    }
  }

  // ── Already applied and pending ───────────────────────────────────────
  if (existingApp) return (
    <div style={{ padding:24, textAlign:"center" }}>
      <div style={{ width:52,height:52,borderRadius:"50%",border:`2px solid ${T.amberHi}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px" }}>
        <span style={{ fontSize:20 }}>⏳</span>
      </div>
      <div style={{ fontFamily:"'DM Serif Display',serif",fontSize:17,color:T.cream,marginBottom:8 }}>Application under review</div>
      <div style={{ fontSize:13,color:T.creamDim,lineHeight:1.7,marginBottom:16 }}>
        Your expert application is being reviewed. You&apos;ll gain expert access once approved — usually within 48 hours.
      </div>
      <button onClick={onClose} style={{ background:"transparent",border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 20px",fontFamily:"'DM Sans',sans-serif",fontSize:13,color:T.creamDim,cursor:"pointer",width:"100%" }}>
        Close
      </button>
    </div>
  );

  // ── Success ───────────────────────────────────────────────────────────
  if (done) return (
    <div style={{ padding:24, textAlign:"center" }}>
      <div style={{ width:52,height:52,borderRadius:"50%",border:`2px solid ${T.tealHi}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px" }}>
        <CheckIcon color={T.tealHi} size={24}/>
      </div>
      <div style={{ fontFamily:"'DM Serif Display',serif",fontSize:17,color:T.cream,marginBottom:8 }}>Application submitted</div>
      <div style={{ fontSize:13,color:T.creamDim,lineHeight:1.7,marginBottom:6 }}>
        Your credentials are under review. Expert access will be granted once approved.
      </div>
      <div style={{ fontSize:12,color:T.creamFaint,marginBottom:20 }}>
        You&apos;ll be notified when your application is reviewed.
      </div>
      <button onClick={onClose} style={{ background:"transparent",border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 20px",fontFamily:"'DM Sans',sans-serif",fontSize:13,color:T.creamDim,cursor:"pointer",width:"100%" }}>
        Close
      </button>
    </div>
  );

  // ── Application form ──────────────────────────────────────────────────
  return (
    <div>
      <div style={{ background:T.purpleLo,padding:"14px 18px",borderBottom:`1px solid ${T.purpleMid}44`,fontFamily:"'DM Serif Display',serif",fontSize:16,color:T.cream }}>
        Apply as an <em style={{ fontStyle:"italic",color:T.purpleHi }}>expert</em>
      </div>
      <div style={{ padding:"16px 18px",display:"flex",flexDirection:"column",gap:14 }}>

        {/* Name */}
        <div>
          <label style={{ display:"block",fontSize:11,fontWeight:500,color:T.creamDim,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6 }}>
            Full name + credentials
          </label>
          <input style={{ width:"100%",background:T.bg,border:`1px solid ${T.border}`,borderRadius:7,padding:"9px 12px",fontFamily:"'DM Sans',sans-serif",fontSize:13,color:T.cream,outline:"none" }}
            placeholder="Dr. Jane Smith, AICP" value={form.name}
            onChange={e => setForm(f => ({...f,name:e.target.value}))}/>
        </div>

        {/* Organisation */}
        <div>
          <label style={{ display:"block",fontSize:11,fontWeight:500,color:T.creamDim,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6 }}>
            Organisation or affiliation
          </label>
          <input style={{ width:"100%",background:T.bg,border:`1px solid ${T.border}`,borderRadius:7,padding:"9px 12px",fontFamily:"'DM Sans',sans-serif",fontSize:13,color:T.cream,outline:"none" }}
            placeholder="City Planning Dept / AICP member" value={form.org}
            onChange={e => setForm(f => ({...f,org:e.target.value}))}/>
        </div>

        {/* License number */}
        <div>
          <label style={{ display:"block",fontSize:11,fontWeight:500,color:T.creamDim,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6 }}>
            License or credential number <span style={{ color:T.creamFaint,fontWeight:300,textTransform:"none" }}>— optional</span>
          </label>
          <input style={{ width:"100%",background:T.bg,border:`1px solid ${T.border}`,borderRadius:7,padding:"9px 12px",fontFamily:"'DM Sans',sans-serif",fontSize:13,color:T.cream,outline:"none" }}
            placeholder="e.g. PE-12345 or AICP #67890" value={form.license}
            onChange={e => setForm(f => ({...f,license:e.target.value}))}/>
        </div>

        {/* Domains */}
        <div>
          <label style={{ display:"block",fontSize:11,fontWeight:500,color:T.creamDim,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8 }}>
            Areas of expertise
          </label>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:7 }}>
            {DOMAINS.map(d => (
              <div key={d.key}
                onClick={() => toggleDomain(d.key)}
                style={{
                  padding:"7px 10px",borderRadius:8,fontSize:12,cursor:"pointer",textAlign:"center",
                  border:`1px solid ${selDomains.includes(d.key) ? T.purpleMid : T.border}`,
                  background:selDomains.includes(d.key) ? T.purpleLo : "transparent",
                  color:selDomains.includes(d.key) ? T.purpleHi : T.creamDim,
                  transition:"all 0.15s",
                }}>
                {d.label}
              </div>
            ))}
          </div>
        </div>

        {/* Credential upload */}
        <div>
          <label style={{ display:"block",fontSize:11,fontWeight:500,color:T.creamDim,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8 }}>
            Upload credential <span style={{ color:T.redHi,fontWeight:500 }}>*</span>
          </label>
          <div style={{ fontSize:11,color:T.creamFaint,marginBottom:8,lineHeight:1.6 }}>
            Upload a license, certificate, or official document confirming your credentials. PDF, image, or Word doc. Max 10MB.
          </div>

          {!file ? (
            <label style={{
              display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
              gap:8,padding:"20px",border:`1.5px dashed ${T.border}`,borderRadius:10,
              cursor:"pointer",background:T.bg,transition:"border-color 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor=T.borderHi}
            onMouseLeave={e => e.currentTarget.style.borderColor=T.border}>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png,.heic,.doc,.docx" style={{ display:"none" }} onChange={handleFileChange}/>
              <div style={{ fontSize:24, opacity:0.5 }}>📄</div>
              <div style={{ fontSize:13,color:T.creamDim }}>Click to upload your credential</div>
              <div style={{ fontSize:11,color:T.creamFaint }}>PDF · JPG · PNG · HEIC · Word</div>
            </label>
          ) : (
            <div style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:T.tealLo,border:`1px solid ${T.teal}44`,borderRadius:9 }}>
              <span style={{ fontSize:18 }}>📄</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13,color:T.tealHi,fontWeight:500 }}>{file.name}</div>
                <div style={{ fontSize:11,color:T.tealHi,opacity:0.7 }}>{(file.size/1024/1024).toFixed(2)} MB</div>
              </div>
              <button onClick={() => setFile(null)} style={{ background:"transparent",border:"none",color:T.creamDim,cursor:"pointer",fontSize:16,padding:4 }}>×</button>
            </div>
          )}
        </div>

        {/* Upload progress */}
        {uploading && uploadPct > 0 && (
          <div>
            <div style={{ display:"flex",justifyContent:"space-between",fontSize:11,color:T.creamDim,marginBottom:6 }}>
              <span>{uploadPct < 70 ? "Uploading credential…" : uploadPct < 100 ? "Submitting application…" : "Done!"}</span>
              <span>{uploadPct}%</span>
            </div>
            <div style={{ height:4,borderRadius:99,background:T.border,overflow:"hidden" }}>
              <div style={{ height:"100%",borderRadius:99,background:T.purple,width:`${uploadPct}%`,transition:"width 0.4s ease" }}/>
            </div>
          </div>
        )}

        {error && (
          <div style={{ background:T.redLo,border:`1px solid ${T.red}44`,borderRadius:6,padding:"9px 12px",fontSize:12,color:T.redHi }}>
            {error}
          </div>
        )}

        <button
          disabled={!valid || uploading}
          onClick={handleSubmit}
          style={{ background:T.purple,color:"#fff",border:"none",borderRadius:8,padding:12,fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:500,cursor:"pointer",transition:"all 0.2s",opacity:(!valid||uploading)?0.4:1 }}>
          {uploading ? "Submitting…" : "Submit application →"}
        </button>

        <div style={{ fontSize:11,color:T.creamFaint,lineHeight:1.6,textAlign:"center" }}>
          Your document is stored securely and only visible to Townhall admins for verification purposes.
        </div>
      </div>
    </div>
  );
}
