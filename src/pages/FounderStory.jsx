/**
 * FounderStory.jsx — TerrellOS
 * Terrell Mills — real testimony. Redemption. Purpose. Tech.
 */
import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Heart, Zap, Code, Shield, BookOpen } from "lucide-react";
import IMG from "@/lib/sectionImages";

export default function FounderStory() {
  return (
    <div style={{ minHeight:"100vh", background:"#030007", color:"#f9fafb", fontFamily:"Inter,system-ui,sans-serif" }}>

      {/* Hero Banner */}
      <div style={{ position:"relative", width:"100%", height:300, overflow:"hidden" }}>
        <img src={IMG.founder} alt="Terrell Mills — Founder"
          style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"center 30%", filter:"brightness(0.45)" }} />
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom, rgba(3,0,7,0.3) 0%, rgba(3,0,7,0.85) 100%)" }} />
        <div style={{ position:"absolute", bottom:32, left:0, right:0, textAlign:"center", padding:"0 20px" }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(124,58,237,0.15)", border:"1px solid rgba(124,58,237,0.4)", borderRadius:99, padding:"5px 14px", marginBottom:12 }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:"#a78bfa", display:"inline-block" }} />
            <span style={{ fontSize:11, fontWeight:700, letterSpacing:"0.15em", color:"#a78bfa", textTransform:"uppercase" }}>The Founder's Story</span>
          </div>
          <h1 style={{ fontSize:32, fontWeight:900, margin:0, lineHeight:1.2 }}>
            From Prison to <span style={{ background:"linear-gradient(135deg,#8b5cf6,#3b82f6)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Purpose</span>
          </h1>
          <p style={{ color:"#c4b5fd", fontSize:14, marginTop:8 }}>Testimony of Terrell Mills — Founder of TerrellOS</p>
        </div>
      </div>

      <div style={{ maxWidth:760, margin:"0 auto", padding:"40px 20px 100px" }}>

        {/* Intro */}
        <div style={{ background:"rgba(124,58,237,0.08)", border:"1px solid rgba(124,58,237,0.25)", borderRadius:14, padding:"20px 24px", marginBottom:28 }}>
          <p style={{ color:"#e2e8f0", fontSize:15, lineHeight:1.8, margin:0, fontStyle:"italic" }}>
            "My name is Terrell Mills, and my story is one of God's grace, mercy, and redemption."
          </p>
        </div>

        {/* Story sections */}
        {[
          {
            icon: Heart,
            color: "#f87171",
            bg: "rgba(248,113,113,0.08)",
            border: "rgba(248,113,113,0.25)",
            title: "The Beginning",
            text: "I grew up in a difficult environment marked by trauma, abuse, confusion, and pain. As a young man, I searched for acceptance, identity, and purpose in all the wrong places. That search eventually led me into drugs, crime, and a lifestyle that took me far away from God. The choices I made resulted in serious consequences — I found myself incarcerated in the Texas Department of Criminal Justice, serving years behind prison walls."
          },
          {
            icon: BookOpen,
            color: "#60a5fa",
            bg: "rgba(96,165,250,0.08)",
            border: "rgba(96,165,250,0.25)",
            title: "Where God Met Me",
            text: "Prison became the place where God began to transform my life. While incarcerated, I became involved in the Interchange Freedom Initiative and other faith-based programs. What began as curiosity turned into a genuine encounter with Jesus Christ. I studied the Bible intensely, attended classes, served in ministry roles, learned music, and worked in chapel programs. I learned that my past did not disqualify me from God's love."
          },
          {
            icon: Shield,
            color: "#4ade80",
            bg: "rgba(74,222,128,0.08)",
            border: "rgba(74,222,128,0.25)",
            title: "After Release",
            text: "After my release, life was not easy. I experienced loss, heartbreak, grief, and setbacks. I endured the pain of losing loved ones and faced battles with addiction and mental health challenges. Yet through every struggle, God remained faithful. On May 30, 2023, I began a new chapter of sobriety and recovery. God continued to restore my life piece by piece."
          },
          {
            icon: Code,
            color: "#a78bfa",
            bg: "rgba(167,139,250,0.08)",
            border: "rgba(167,139,250,0.25)",
            title: "Technology as Ministry",
            text: "God gave me a renewed passion for ministry, technology, education, and helping people who feel forgotten or hopeless. Today I am pursuing a degree in Computer Science while building technology designed to serve others. Through TerrellOS, Pro-Se AI, PastorAIConnect, and every platform I build — the goal is to use the gifts God gave me to serve churches, families, self-represented individuals, and people who need hope."
          },
          {
            icon: Zap,
            color: "#fbbf24",
            bg: "rgba(251,191,36,0.08)",
            border: "rgba(251,191,36,0.25)",
            title: "The Mission",
            text: "My testimony is not about how strong I am. It is about how faithful God is. The same God who met me in prison, who carried me through addiction, grief, and brokenness, is still working today. He took a man who felt lost and gave him purpose. If God can transform my life, He can transform yours too. I stand before you today not as a perfect man, but as a living testimony that Jesus Christ still saves, still heals, still restores, and still changes lives."
          },
        ].map((s, i) => (
          <div key={i} style={{
            background: s.bg, border:`1px solid ${s.border}`,
            borderRadius:14, padding:"22px 24px", marginBottom:16,
            display:"flex", gap:16, alignItems:"flex-start"
          }}>
            <div style={{ width:42, height:42, borderRadius:12, background:s.bg, border:`1px solid ${s.border}`,
              display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <s.icon size={20} style={{ color:s.color }} />
            </div>
            <div>
              <div style={{ fontWeight:700, fontSize:16, color:"#f9fafb", marginBottom:8 }}>{s.title}</div>
              <p style={{ color:"#cbd5e1", fontSize:14, lineHeight:1.8, margin:0 }}>{s.text}</p>
            </div>
          </div>
        ))}

        {/* Closing scripture */}
        <div style={{ background:"rgba(124,58,237,0.08)", border:"1px solid rgba(124,58,237,0.3)", borderRadius:14, padding:"22px 24px", marginTop:8, textAlign:"center" }}>
          <div style={{ fontSize:22, marginBottom:10 }}>✝️</div>
          <p style={{ color:"#c4b5fd", fontSize:14, fontStyle:"italic", lineHeight:1.8, margin:"0 0 8px" }}>
            "To God be all the glory."
          </p>
          <div style={{ color:"#6b7280", fontSize:12 }}>— Terrell Mills, Founder · TerrellOS</div>
        </div>

        {/* CTA */}
        <div style={{ display:"flex", gap:12, justifyContent:"center", marginTop:32, flexWrap:"wrap" }}>
          <Link to="/terrellos/welcome" style={{
            display:"inline-flex", alignItems:"center", gap:8,
            background:"linear-gradient(135deg,#7c3aed,#4f46e5)", color:"#fff",
            borderRadius:10, padding:"12px 24px", fontWeight:700, fontSize:14,
            textDecoration:"none", border:"none"
          }}>
            Enter TerrellOS <ArrowRight size={16} />
          </Link>
          <Link to="/pricing" style={{
            display:"inline-flex", alignItems:"center", gap:8,
            background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.15)",
            color:"#e2e8f0", borderRadius:10, padding:"12px 24px",
            fontWeight:600, fontSize:14, textDecoration:"none"
          }}>
            See Plans
          </Link>
        </div>

      </div>
    </div>
  );
}
