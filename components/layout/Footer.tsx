"use client";
import { useLang } from "@/lib/hooks/useLang";
import { translations } from "@/lib/data/translations";
import { ascBrand } from "@/lib/data/branding";

export default function Footer() {
  const { lang } = useLang();
  const f = translations[lang].footer;
  const n = translations[lang].nav;

  return (
    <footer style={{ background: "var(--bg2)", borderTop: "1px solid var(--border)", padding: "clamp(48px,7vw,80px) 0 clamp(24px,4vw,32px)" }}>
      <div className="container">
        <div className="footer-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "clamp(24px,4vw,48px)", marginBottom: "clamp(40px,6vw,56px)" }}>
          <div>
            <img src={ascBrand.icon} alt="ASC Axiom Tech" className="brand-logo brand-logo--footer" />
            <p style={{ fontSize: "var(--t-xs)", color: "var(--muted)", lineHeight: 1.7, maxWidth: 260, marginBottom: 20 }}>{f.tagline}</p>
            <div style={{ display: "flex", gap: 10 }}>
              {[
                { icon: "fa-instagram", href: "#", label: "Instagram" },
                { icon: "fa-linkedin", href: "#", label: "LinkedIn" },
                { icon: "fa-x-twitter", href: "#", label: "X" },
                { icon: "fa-whatsapp", href: "https://wa.me/244951702823", label: "WhatsApp" },
              ].map(s => (
                <a
                  key={s.icon}
                  href={s.href}
                  aria-label={s.label}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: "var(--bg3)",
                    border: "1px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 15,
                    color: "var(--muted)",
                    transition: "border-color .2s, color .2s",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--blue-l)";
                    (e.currentTarget as HTMLAnchorElement).style.color = "var(--blue-l)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border)";
                    (e.currentTarget as HTMLAnchorElement).style.color = "var(--muted)";
                  }}
                >
                  <i className={`fa-brands ${s.icon}`} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontFamily: "var(--font-m)", fontSize: 10, color: "var(--muted)", letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 16 }}>{f.products}</div>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
              {[["Hubscuvala", "https://hubscuvala.com"], ["AutomateAO", "#"], ["NzonChain", "#"]].map(([name, href]) => (
                <li key={name}>
                  <a href={href} style={{ fontSize: "var(--t-xs)", color: "var(--muted)", transition: "color .2s" }}
                    onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = "var(--text)"}
                    onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = "var(--muted)"}>{name}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div style={{ fontFamily: "var(--font-m)", fontSize: 10, color: "var(--muted)", letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 16 }}>{f.company}</div>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
              {[["#visao", n.vision], ["#servicos", n.services], ["#investidores", n.investors], ["#contacto", n.contact]].map(([href, label]) => (
                <li key={href}>
                  <a
                    href={href}
                    style={{ fontSize: "var(--t-xs)", color: "var(--muted)", transition: "color .2s" }}
                    onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = "var(--text)"}
                    onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = "var(--muted)"}
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div style={{ fontFamily: "var(--font-m)", fontSize: 10, color: "var(--muted)", letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 16 }}>{f.legal}</div>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
              {[["/privacidade", f.privacy], ["/termos", f.terms], ["/cookies", f.cookies]].map(([href, label]) => (
                <li key={href}>
                  <a
                    href={href}
                    style={{ fontSize: "var(--t-xs)", color: "var(--muted)", transition: "color .2s" }}
                    onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = "var(--text)"}
                    onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = "var(--muted)"}
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "clamp(20px,3vw,28px)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <span style={{ fontSize: "var(--t-xs)", color: "var(--muted)" }}>{f.copy}</span>
          <span style={{ fontSize: "var(--t-xs)", color: "var(--muted)", fontStyle: "italic" }}>{f.madeIn}</span>
        </div>
      </div>
      <style>{`
        @media(max-width:768px){.footer-grid{grid-template-columns:1fr 1fr!important}}
        @media(max-width:580px){.footer-grid{grid-template-columns:1fr!important}}
      `}</style>
    </footer>
  );
}
