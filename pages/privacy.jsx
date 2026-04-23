export default function Privacy() {
  return (
    <div style={{ background:"#0F0E0C", minHeight:"100vh", padding:"60px 24px", fontFamily:"'DM Sans',sans-serif", color:"#F2EDE4" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap');`}</style>
      <div style={{ maxWidth:680, margin:"0 auto" }}>

        <a href="/" style={{ fontSize:13, color:"#9A9188", textDecoration:"none", display:"inline-flex", alignItems:"center", gap:6, marginBottom:40 }}>
          ← Back to Townhall Café
        </a>

        <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:36, color:"#F2EDE4", marginBottom:8 }}>Privacy Policy</div>
        <div style={{ fontSize:13, color:"#9A9188", marginBottom:16 }}>Last updated: April 2026</div>

        {/* Summary box */}
        <div style={{ background:"#0A2A1E", border:"1px solid #1D9E75", borderRadius:10, padding:"16px 20px", marginBottom:48 }}>
          <div style={{ fontSize:13, fontWeight:500, color:"#4CAF80", marginBottom:8 }}>The short version</div>
          <div style={{ fontSize:13, color:"#9A9188", lineHeight:1.8 }}>
            Your address is <strong style={{ color:"#F2EDE4" }}>never stored</strong>. We use a zero-knowledge proof to verify you live in your neighborhood without recording your coordinates. We don&apos;t sell your data. We don&apos;t run ads. We collect only what&apos;s needed to run the platform.
          </div>
        </div>

        {[
          {
            title: "1. Information we collect",
            body: `We collect the following information when you use Townhall Café:

• Email address — used for authentication and account communication
• Display name — chosen by you during signup
• Neighborhood selection — the neighborhood you choose during onboarding
• Location signal — used once during onboarding to detect nearby neighborhoods, then discarded. Your exact coordinates are never stored.
• Zero-knowledge residency proof — a cryptographic hash that proves neighborhood membership without revealing your address
• Posts, questions, and votes you submit to the platform
• Device type and browser for technical support purposes`,
          },
          {
            title: "2. Information we do not collect",
            body: `We do not collect or store:

• Your home address or street location
• Your GPS coordinates after the initial neighborhood detection
• Payment information (the Service is currently free)
• Information from third-party social networks
• Precise location tracking after onboarding`,
          },
          {
            title: "3. How we use your information",
            body: `We use the information we collect to:

• Provide and operate the Service
• Verify neighborhood residency using zero-knowledge proofs
• Send account-related emails (confirmation, password reset)
• Display your posts and activity to other residents in your neighborhood
• Detect and prevent abuse and spam
• Improve the platform based on usage patterns`,
          },
          {
            title: "4. Zero-knowledge residency proofs",
            body: "Our residency verification uses zero-knowledge cryptography. When you select your neighborhood, a proof is generated on your device that confirms you are within the neighborhood boundary. Only the proof hash — not your coordinates — is stored on our servers. This means we can verify you are a resident without ever knowing your address.",
          },
          {
            title: "5. Information sharing",
            body: `We do not sell, rent, or share your personal information with third parties for marketing purposes.

We may share information in the following limited circumstances:

• With Supabase (our database provider) who processes data on our behalf under a data processing agreement
• With Vercel (our hosting provider) for technical operation of the Service
• If required by law, court order, or government request
• To protect the rights, property, or safety of Townhall Café, our users, or the public`,
          },
          {
            title: "6. Data retention",
            body: "We retain your account information for as long as your account is active. Posts and civic contributions are retained to maintain the integrity of neighborhood history. You may request deletion of your account and personal data at any time by emailing hello@townhallcafe.org. We will process deletion requests within 30 days.",
          },
          {
            title: "7. Security",
            body: "We use industry-standard security measures including encrypted connections (HTTPS), row-level security on all database tables, and zero-knowledge proofs for residency verification. No system is completely secure — if you believe your account has been compromised, contact us immediately at hello@townhallcafe.org.",
          },
          {
            title: "8. Children's privacy",
            body: "The Service is not directed to children under 18 years of age. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, contact us at hello@townhallcafe.org and we will delete it.",
          },
          {
            title: "9. Your rights",
            body: `You have the right to:

• Access the personal information we hold about you
• Correct inaccurate information
• Request deletion of your account and data
• Export your data in a portable format
• Opt out of non-essential communications

To exercise any of these rights, email hello@townhallcafe.org.`,
          },
          {
            title: "10. Cookies",
            body: "We use only essential cookies required for authentication and session management. We do not use tracking cookies or third-party advertising cookies.",
          },
          {
            title: "11. Changes to this policy",
            body: "We may update this Privacy Policy from time to time. We will notify registered users by email of any material changes. Continued use of the Service after changes constitutes acceptance of the updated policy.",
          },
          {
            title: "12. Contact",
            body: "For privacy questions or data requests, contact us at hello@townhallcafe.org. We aim to respond within 5 business days.",
          },
        ].map(({ title, body }) => (
          <div key={title} style={{ marginBottom:36 }}>
            <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:18, color:"#F2EDE4", marginBottom:10 }}>{title}</div>
            <div style={{ fontSize:14, color:"#9A9188", lineHeight:1.8, whiteSpace:"pre-line" }}>{body}</div>
          </div>
        ))}

        <div style={{ borderTop:"1px solid #2C2A26", paddingTop:32, marginTop:20, fontSize:13, color:"#4A4640" }}>
          Townhall Café · <a href="/terms" style={{ color:"#9A9188" }}>Terms of Service</a> · hello@townhallcafe.org
        </div>
      </div>
    </div>
  );
}
