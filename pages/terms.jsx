export default function Terms() {
  return (
    <div style={{ background:"#0F0E0C", minHeight:"100vh", padding:"60px 24px", fontFamily:"'DM Sans',sans-serif", color:"#F2EDE4" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap');`}</style>
      <div style={{ maxWidth:680, margin:"0 auto" }}>

        <a href="/" style={{ fontSize:13, color:"#9A9188", textDecoration:"none", display:"inline-flex", alignItems:"center", gap:6, marginBottom:40 }}>
          ← Back to Townhall Café
        </a>

        <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:36, color:"#F2EDE4", marginBottom:8 }}>Terms of Service</div>
        <div style={{ fontSize:13, color:"#9A9188", marginBottom:48 }}>Last updated: April 2026</div>

        {[
          {
            title: "1. Acceptance of terms",
            body: "By accessing or using Townhall Café ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Service. We reserve the right to update these terms at any time &#8212; continued use of the Service constitutes acceptance of any changes.",
          },
          {
            title: "2. Description of service",
            body: "Townhall Café is a civic engagement platform that allows verified residents to discuss neighborhood issues, track civic matters, and engage with credentialed experts and elected officials. The Service is intended for residents of participating neighborhoods in the United States.",
          },
          {
            title: "3. Eligibility",
            body: "You must be at least 18 years old to use the Service. By creating an account you represent that you are 18 or older and that the information you provide is accurate. You may only create one account per person.",
          },
          {
            title: "4. User accounts",
            body: "You are responsible for maintaining the security of your account credentials. You are responsible for all activity that occurs under your account. Notify us immediately at hello@townhallcafe.org if you suspect unauthorized access to your account.",
          },
          {
            title: "5. Acceptable use",
            body: "You agree not to post content that is unlawful, threatening, abusive, harassing, defamatory, or invasive of privacy. You agree not to impersonate any person or entity, post spam, use automated tools to access the Service, or attempt to interfere with the proper working of the platform. We reserve the right to remove any content and suspend any account that violates these rules.",
          },
          {
            title: "6. Content ownership",
            body: "You retain ownership of content you post. By posting content you grant Townhall Café a non-exclusive, royalty-free license to display and distribute that content on the platform. You represent that you have the right to post any content you submit.",
          },
          {
            title: "7. Expert and official verification",
            body: "Expert and official status is granted at our sole discretion following credential review. Verified status may be revoked at any time if credentials are found to be inaccurate or if conduct violates these terms. Townhall Café does not guarantee the accuracy of any expert or official statements made on the platform.",
          },
          {
            title: "8. Limitation of liability",
            body: "Townhall Café is provided \"as is\" without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the Service. Our total liability to you for any claims shall not exceed the amount you paid us in the past 12 months, if any.",
          },
          {
            title: "9. Termination",
            body: "We reserve the right to suspend or terminate your account at any time for violation of these terms or for any other reason at our sole discretion. You may delete your account at any time by contacting us at hello@townhallcafe.org.",
          },
          {
            title: "10. Governing law",
            body: "These terms are governed by the laws of the State of New York, United States. Any disputes shall be resolved in the courts of New York County, New York.",
          },
          {
            title: "11. Contact",
            body: "For questions about these Terms of Service, contact us at hello@townhallcafe.org.",
          },
        ].map(({ title, body }) => (
          <div key={title} style={{ marginBottom:36 }}>
            <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:18, color:"#F2EDE4", marginBottom:10 }}>{title}</div>
            <div style={{ fontSize:14, color:"#9A9188", lineHeight:1.8 }}>{body}</div>
          </div>
        ))}

        <div style={{ borderTop:"1px solid #2C2A26", paddingTop:32, marginTop:20, fontSize:13, color:"#4A4640" }}>
          Townhall Café · <a href="/privacy" style={{ color:"#9A9188" }}>Privacy Policy</a> · hello@townhallcafe.org
        </div>
      </div>
    </div>
  );
}
