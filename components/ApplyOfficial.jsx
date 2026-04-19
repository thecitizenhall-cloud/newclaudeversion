"use client";
import { useState } from "react";
import { supabase } from "../lib/supabase";

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

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC",
];

function CheckIcon({ color, size=14 }) {
  return <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
    <path d="M2 7l3 3 7-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>;
}

function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:"block", fontSize:11, fontWeight:500, color:T.creamDim, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:hint?4:6 }}>
        {label}
      </label>
      {hint && <div style={{ fontSize:11, color:T.creamFaint, marginBottom:6 }}>{hint}</div>}
      {children}
    </div>
  );
}

const inputStyle = {
  width:"100%", background:T.bg, border:`1px solid ${T.border}`,
  borderRadius:7, padding:"9px 12px",
  fontFamily:"'DM Sans',sans-serif", fontSize:13, color:T.cream,
  outline:"none", WebkitAppearance:"none",
};

export default function ApplyOfficial({ onClose }) {
  const [step,        setStep]        = useState(1); // 1=form, 2=verifying, 3=result, 4=done
  const [form,        setForm]        = useState({
    name:"", title:"", department:"", jurisdiction:"",
    state:"", officialEmail:"", phone:"",
  });
  const [civicResult, setCivicResult] = useState(null);
  const [error,       setError]       = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [existingApp, setExistingApp] = useState(null);

  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const valid = form.name && form.title && form.jurisdiction && form.state && form.officialEmail.includes("@");

  // ── Step 1: Submit form + run civic lookup ─────────────────────────────
  async function handleVerify() {
    if (!valid || submitting) return;
    setError("");
    setSubmitting(true);
    setStep(2);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in first");

      // Check for existing application
      const { data: existing } = await supabase
        .from("official_applications")
        .select("id, status")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        setExistingApp(existing);
        setStep(3);
        setSubmitting(false);
        return;
      }

      // Run Google Civic API lookup
      const address = `${form.jurisdiction}, ${form.state}`;
      const civicRes = await fetch(
        `/api/civic-lookup?name=${encodeURIComponent(form.name)}&address=${encodeURIComponent(address)}`
      );
      const civic = await civicRes.json();
      setCivicResult(civic);

      // Save application to Supabase
      const { error: insertError } = await supabase
        .from("official_applications")
        .insert({
          user_id:            user.id,
          full_name:          form.name,
          title:              form.title,
          department:         form.department || null,
          jurisdiction:       form.jurisdiction,
          jurisdiction_state: form.state,
          official_email:     form.officialEmail,
          phone:              form.phone || null,
          civic_match:        civic.match || null,
          civic_verified:     !!civic.match,
          status:             "pending",
        });

      if (insertError) throw new Error(insertError.message);

      setStep(3);
    } catch (err) {
      setError(err.message || "Something went wrong.");
      setStep(1);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Step 2: Verifying spinner ──────────────────────────────────────────
  if (step === 2) return (
    <div style={{ padding:40, textAlign:"center" }}>
      <div style={{ width:48, height:48, border:`2px solid ${T.border}`, borderTopColor:T.purple, borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 20px" }}/>
      <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:16, color:T.cream, marginBottom:8 }}>Verifying your credentials</div>
      <div style={{ fontSize:13, color:T.creamDim }}>Checking government records…</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // ── Step 3: Result ─────────────────────────────────────────────────────
  if (step === 3) {
    // Already applied
    if (existingApp) return (
      <div style={{ padding:24, textAlign:"center" }}>
        <div style={{ fontSize:28, marginBottom:14 }}>⏳</div>
        <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:16, color:T.cream, marginBottom:8 }}>
          Application {existingApp.status === "pending" ? "under review" : existingApp.status}
        </div>
        <div style={{ fontSize:13, color:T.creamDim, lineHeight:1.7, marginBottom:16 }}>
          {existingApp.status === "pending"
            ? "Your application is being reviewed. You'll receive official access once approved."
            : existingApp.status === "approved"
            ? "Your official account has been approved."
            : "Your application was not approved. Contact support if you believe this is an error."}
        </div>
        <button onClick={onClose} style={{ background:"transparent", border:`1px solid ${T.border}`, borderRadius:8, padding:"9px 20px", fontFamily:"'DM Sans',sans-serif", fontSize:13, color:T.creamDim, cursor:"pointer", width:"100%" }}>Close</button>
      </div>
    );

    return (
      <div style={{ padding:24 }}>
        {/* Civic match result */}
        {civicResult?.match ? (
          <div style={{ background:T.tealLo, border:`1px solid ${T.teal}44`, borderRadius:10, padding:16, marginBottom:20 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
              <CheckIcon color={T.tealHi} size={16}/>
              <span style={{ fontSize:13, fontWeight:500, color:T.tealHi }}>Record found in government database</span>
            </div>
            <div style={{ fontSize:12, color:T.tealHi, opacity:0.85, lineHeight:1.6 }}>
              <div><strong>Name:</strong> {civicResult.match.name}</div>
              <div><strong>Office:</strong> {civicResult.match.office}</div>
              {civicResult.match.party && <div><strong>Party:</strong> {civicResult.match.party}</div>}
            </div>
          </div>
        ) : (
          <div style={{ background:T.amberLo, border:`1px solid ${T.amberMid}`, borderRadius:10, padding:16, marginBottom:20 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
              <span style={{ fontSize:16 }}>📋</span>
              <span style={{ fontSize:13, fontWeight:500, color:T.amberHi }}>Manual review required</span>
            </div>
            <div style={{ fontSize:12, color:T.amberHi, opacity:0.85, lineHeight:1.6 }}>
              We couldn&apos;t automatically match your record in the Google Civic database. This is common for appointed officials and department staff. A Townhall admin will verify your credentials manually — usually within 48 hours.
            </div>
          </div>
        )}

        <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:17, color:T.cream, marginBottom:8 }}>Application submitted</div>
        <div style={{ fontSize:13, color:T.creamDim, lineHeight:1.7, marginBottom:20 }}>
          Your application is under review. Once approved you&apos;ll have a verified official badge on all your responses, and your replies to civic issues will be highlighted to residents.
        </div>

        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:"12px 14px", marginBottom:20, fontSize:12, color:T.creamDim, lineHeight:1.7 }}>
          <div style={{ fontWeight:500, color:T.cream, marginBottom:4 }}>What happens next</div>
          {civicResult?.match
            ? "Your record was auto-matched. An admin will confirm and approve your account, usually within a few hours."
            : "An admin will reach out to verify your role. They may contact your department directly or request additional documentation."}
        </div>

        <button onClick={onClose} style={{ background:"transparent", border:`1px solid ${T.border}`, borderRadius:8, padding:"9px 20px", fontFamily:"'DM Sans',sans-serif", fontSize:13, color:T.creamDim, cursor:"pointer", width:"100%" }}>
          Close
        </button>
      </div>
    );
  }

  // ── Step 1: Application form ───────────────────────────────────────────
  return (
    <div>
      <div style={{ background:T.tealLo, padding:"14px 18px", borderBottom:`1px solid ${T.teal}22`, fontFamily:"'DM Serif Display',serif", fontSize:16, color:T.cream }}>
        Join as a <em style={{ fontStyle:"italic", color:T.tealHi }}>verified official</em>
      </div>

      <div style={{ padding:"16px 18px" }}>
        <div style={{ fontSize:12, color:T.creamDim, lineHeight:1.7, marginBottom:18, padding:"10px 12px", background:T.bg, border:`1px solid ${T.border}`, borderRadius:8 }}>
          Townhall verifies officials against the Google Civic Information database. Elected officials are usually auto-verified. Appointed staff and department employees go through a brief manual review.
        </div>

        <Field label="Full legal name" hint="As it appears in official government records">
          <input style={inputStyle} placeholder="Jane Smith" value={form.name} onChange={e=>f("name",e.target.value)}/>
        </Field>

        <Field label="Official title" hint="Your exact government title">
          <input style={inputStyle} placeholder="City Councillor / Director of Planning / etc." value={form.title} onChange={e=>f("title",e.target.value)}/>
        </Field>

        <Field label="Department or body" hint="Optional — e.g. Department of Transportation">
          <input style={inputStyle} placeholder="e.g. Dept. of Public Works" value={form.department} onChange={e=>f("department",e.target.value)}/>
        </Field>

        <div style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:10, marginBottom:14 }}>
          <Field label="City or jurisdiction">
            <input style={inputStyle} placeholder="e.g. Springfield" value={form.jurisdiction} onChange={e=>f("jurisdiction",e.target.value)}/>
          </Field>
          <Field label="State">
            <select style={{ ...inputStyle, width:80 }} value={form.state} onChange={e=>f("state",e.target.value)}>
              <option value="">--</option>
              {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Official government email" hint="Must be a .gov, .us, or official government domain">
          <input style={inputStyle} type="email" placeholder="jsmith@springfield.gov" value={form.officialEmail} onChange={e=>f("officialEmail",e.target.value)}/>
        </Field>

        <Field label="Office phone" hint="Optional — helps with manual verification">
          <input style={inputStyle} type="tel" placeholder="(555) 555-0100" value={form.phone} onChange={e=>f("phone",e.target.value)}/>
        </Field>

        {error && (
          <div style={{ background:T.redLo, border:`1px solid ${T.red}44`, borderRadius:6, padding:"9px 12px", fontSize:12, color:T.redHi, marginBottom:14 }}>
            {error}
          </div>
        )}

        <button
          disabled={!valid || submitting}
          onClick={handleVerify}
          style={{ background:T.teal, color:"#fff", border:"none", borderRadius:8, padding:12, width:"100%", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:500, cursor:"pointer", opacity:(!valid||submitting)?0.4:1, transition:"opacity 0.2s" }}>
          Verify my credentials →
        </button>

        <div style={{ fontSize:11, color:T.creamFaint, lineHeight:1.6, textAlign:"center", marginTop:12 }}>
          We check your name against the Google Civic Information API and US government records. Your information is never shared publicly beyond your verified official badge.
        </div>
      </div>
    </div>
  );
}
