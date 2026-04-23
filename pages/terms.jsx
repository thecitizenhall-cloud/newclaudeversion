export default function Terms() {
  const sections = [
    {
      title: "1. Acceptance of terms",
      body: "By accessing or using Townhall Cafe (the Service), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service. We reserve the right to update these terms at any time.",
    },
    {
      title: "2. Description of service",
      body: "Townhall Cafe is a civic engagement platform that allows verified residents to discuss neighborhood issues, track civic matters, and engage with credentialed experts and elected officials. The Service is for residents of participating neighborhoods in the United States.",
    },
    {
      title: "3. Eligibility",
      body: "You must be at least 18 years old to use the Service. By creating an account you represent that you are 18 or older and that the information you provide is accurate. You may only create one account per person.",
    },
    {
      title: "4. User accounts",
      body: "You are responsible for maintaining the security of your account credentials and for all activity that occurs under your account. Notify us immediately at hello@townhallcafe.org if you suspect unauthorized access.",
    },
    {
      title: "5. Acceptable use",
      body: "You agree not to post content that is unlawful, threatening, abusive, harassing, defamatory, or invasive of privacy. You agree not to impersonate any person, post spam, or use automated tools to access the Service. We reserve the right to remove content and suspend accounts that violate these rules.",
    },
    {
      title: "6. Content ownership",
      body: "You retain ownership of content you post. By posting you grant Townhall Cafe a non-exclusive royalty-free license to display and distribute that content on the platform.",
    },
    {
      title: "7. Expert and official verification",
      body: "Expert and official status is granted at our sole discretion following credential review and may be revoked at any time. Townhall Cafe does not guarantee the accuracy of any expert or official statements made on the platform.",
    },
    {
      title: "8. Limitation of liability",
      body: "Townhall Cafe is provided as-is without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the Service.",
    },
    {
      title: "9. Termination",
      body: "We reserve the right to suspend or terminate your account at any time for violation of these terms. You may delete your account at any time by contacting hello@townhallcafe.org.",
    },
    {
      title: "10. Governing law",
      body: "These terms are governed by the laws of the State of New York, United States.",
    },
    {
      title: "11. Contact",
      body: "For questions about these Terms of Service contact us at hello@townhallcafe.org.",
    },
  ];
 
  return (
    <div style={{ background:"#0F0E0C", minHeight:"100vh", padding:"60px 24px", fontFamily:"sans-serif", color:"#F2EDE4" }}>
      <div style={{ maxWidth:680, margin:"0 auto" }}>
        <a href="/" style={{ fontSize:13, color:"#9A9188", textDecoration:"none", display:"inline-block", marginBottom:40 }}>
          Back to Townhall Cafe
        </a>
        <h1 style={{ fontFamily:"Georgia,serif", fontSize:36, color:"#F2EDE4", marginBottom:8 }}>Terms of Service</h1>
        <p style={{ fontSize:13, color:"#9A9188", marginBottom:48 }}>Last updated: April 2026</p>
        {sections.map(function(sec) {
          return (
            <div key={sec.title} style={{ marginBottom:36 }}>
              <h2 style={{ fontFamily:"Georgia,serif", fontSize:18, color:"#F2EDE4", marginBottom:10 }}>{sec.title}</h2>
              <p style={{ fontSize:14, color:"#9A9188", lineHeight:1.8 }}>{sec.body}</p>
            </div>
          );
        })}
        <div style={{ borderTop:"1px solid #2C2A26", paddingTop:32, marginTop:20, fontSize:13, color:"#4A4640" }}>
          Townhall Cafe | <a href="/privacy" style={{ color:"#9A9188" }}>Privacy Policy</a> | hello@townhallcafe.org
        </div>
      </div>
    </div>
  );
}
