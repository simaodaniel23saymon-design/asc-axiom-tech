"use client";
import Image from "next/image";
import { useEffect, useState, type FormEvent } from "react";
import { useLang } from "@/lib/hooks/useLang";
import { translations } from "@/lib/data/translations";

// ── SCROLL REVEAL HOOK ────────────────────────────────────────────────────────
function useReveal() {
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("on"); }),
      { threshold: 0.1 }
    );
    document.querySelectorAll(".reveal").forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

type FormStatus = "idle" | "sending" | "success" | "error";

function useApiForm(endpoint: string, successMessage: string, errorMessage: string) {
  const [status, setStatus] = useState<FormStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    setStatus("sending");
    setMessage(null);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof data?.error === "string" ? data.error : errorMessage);
      }

      form.reset();
      setStatus("success");
      setMessage(typeof data?.message === "string" ? data.message : successMessage);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error && error.message ? error.message : errorMessage);
    }
  }

  return {
    status,
    message,
    isSubmitting: status === "sending",
    handleSubmit,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// HERO
// ══════════════════════════════════════════════════════════════════════════════
export function Hero() {
  const { lang } = useLang();
  const h = translations[lang].hero;
  useReveal();

  return (
    <section style={{ minHeight: "100svh", display: "flex", alignItems: "center", padding: "clamp(100px,14vw,140px) 0 clamp(60px,8vw,80px)", position: "relative", overflow: "hidden" }}>
      <div className="glow-blue" style={{ width: "min(700px,60vw)", height: "min(700px,60vw)", top: "-15%", right: "-10%", opacity: .7 }} />
      <div className="glow-purple" style={{ width: "min(500px,45vw)", height: "min(500px,45vw)", bottom: "-10%", left: "-5%", opacity: .6 }} />

      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        {/* Badge */}
        <div className="reveal" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(37,99,235,.1)", border: "1px solid rgba(96,165,250,.22)", borderRadius: 24, padding: "6px 16px", marginBottom: "clamp(20px,3vw,28px)" }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--green-b)", boxShadow: "0 0 8px var(--green-b)", animation: "pulse 2s infinite", flexShrink: 0 }} />
          <span style={{ fontFamily: "var(--font-m)", fontSize: "var(--t-xs)", color: "var(--blue-l)", letterSpacing: ".08em" }}>{h.badge}</span>
        </div>

        {/* Headline */}
        <h1 className="reveal d1" style={{ fontFamily: "var(--font-d)", fontSize: "var(--t-hero)", fontWeight: 800, lineHeight: 1.06, letterSpacing: "-.03em", marginBottom: "clamp(16px,2vw,22px)", maxWidth: 820 }}>
          {h.headline1}{" "}
          <span className="grad">{h.headline2}</span>
        </h1>

        <p className="reveal d2" style={{ fontSize: "var(--t-md)", color: "var(--muted)", lineHeight: 1.75, maxWidth: 580, marginBottom: "clamp(28px,4vw,40px)" }}>{h.sub}</p>

        {/* CTAs */}
        <div className="reveal d3 hero-actions" style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: "clamp(40px,6vw,64px)" }}>
          <a href="#produtos" className="btn-primary"><i className="fa-solid fa-rocket" />{h.cta1}</a>
          <a href="#contacto" className="btn-ghost"><i className="fa-solid fa-comment" />{h.cta2}</a>
        </div>

        {/* Stats */}
        <div className="reveal d4 hero-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "clamp(10px,1.5vw,16px)", maxWidth: 680 }}>
          {[
            { n: h.stat1n, l: h.stat1l, c: "var(--cyan)" },
            { n: h.stat2n, l: h.stat2l, c: "var(--purple-l)" },
            { n: h.stat3n, l: h.stat3l, c: "var(--green-b)" },
            { n: h.stat4n, l: h.stat4l, c: "var(--blue-l)" },
          ].map(s => (
            <div key={s.l} style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ fontFamily: "var(--font-m)", fontSize: "clamp(22px,3vw,30px)", fontWeight: 800, color: s.c, lineHeight: 1 }}>{s.n}</div>
              <div style={{ fontSize: "var(--t-xs)", color: "var(--muted)", marginTop: 6, lineHeight: 1.4 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
        @media(max-width:680px){.hero-stats{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
        @media(max-width:580px){
          h1{font-size:clamp(32px,8vw,48px)!important}
          .hero-actions{flex-direction:column!important}
          .hero-actions>a{width:100%;justify-content:center}
        }
      `}</style>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PRODUCTS
// ══════════════════════════════════════════════════════════════════════════════
export function Products() {
  const { lang } = useLang();
  const p = translations[lang].products;

  const productColors: Record<string,string> = {
    Hubscuvala: "var(--cyan)",
    AutomateAO: "var(--purple-l)",
    NzoChain:  "var(--blue-l)",
  };
  const productIcons: Record<string,string> = {
    Hubscuvala: "fa-brain",
    AutomateAO: "fa-robot",
    NzoChain:  "fa-link",
  };
  const productLogos: Record<string, string> = {
    Hubscuvala: "/hubscuvala-logo.png",
    AutomateAO: "/automateao-logo.png",
    NzoChain: "/nzochain-logo.png",
  };
  const productLinks: Record<string, { href?: string; display: string }> = {
    Hubscuvala: { href: "https://hubscuvala.com", display: "hubscuvala.com" },
    AutomateAO: { display: lang === "pt" ? "Link disponível brevemente" : lang === "es" ? "Enlace disponible pronto" : "Link available soon" },
    NzoChain: { href: "https://nzochain.com", display: "nzochain.com" },
  };
  const productCtas: Record<string, string | undefined> = {
    NzoChain: p.exploreInfra,
  };
  const logoStyles: Record<string, { width: string; sizes: string; aspectRatio: string; translateY?: string }> = {
    Hubscuvala: { width: "min(620px, 99%)", sizes: "(max-width: 700px) 96vw, 620px", aspectRatio: "1 / 1" },
    AutomateAO: { width: "min(620px, 99%)", sizes: "(max-width: 700px) 96vw, 620px", aspectRatio: "3 / 2" },
    NzoChain: { width: "min(660px, 100%)", sizes: "(max-width: 700px) 98vw, 660px", aspectRatio: "1600 / 896", translateY: "34px" },
  };
  return (
    <section id="produtos" className="section" style={{ background: "linear-gradient(180deg,transparent,rgba(37,99,235,.025),transparent)" }}>
      <div className="container">
        <div className="reveal" style={{ textAlign: "center", marginBottom: "clamp(40px,6vw,60px)" }}>
          <span className="eyebrow">{p.eyebrow}</span>
          <h2 style={{ fontFamily: "var(--font-d)", fontSize: "var(--t-2xl)", fontWeight: 800, letterSpacing: "-.03em", marginBottom: 16 }}>
            <span className="grad">{p.headline}</span>
          </h2>
          <p style={{ fontSize: "var(--t-md)", color: "var(--muted)", maxWidth: 560, margin: "0 auto" }}>{p.sub}</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "clamp(20px,3vw,28px)" }}>
          {p.items.map((item, i) => {
            const color = productColors[item.name] || "var(--blue-l)";
            const icon  = productIcons[item.name]  || "fa-cube";
            const logo  = productLogos[item.name];
            const link  = productLinks[item.name] || { href: `https://${item.url}`, display: item.url };
            const ctaLabel = productCtas[item.name] || p.learnMore;
            const hideVisualName = item.name === "NzoChain";
            const logoStyle = logoStyles[item.name] || { width: "min(620px, 99%)", sizes: "(max-width: 700px) 96vw, 620px", aspectRatio: "1 / 1" };
            const isEven = i % 2 === 0;
            return (
              <div key={item.name} className={`reveal d${i+1}`} style={{
                background: "var(--bg2)", border: "1px solid var(--border)",
                borderRadius: 20, overflow: "hidden",
                display: "grid", gridTemplateColumns: "1fr 1fr",
                transition: "border-color .3s, transform .3s",
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = color.replace("var(","").replace(")","") === "var(--cyan)" ? "#06B6D4" : "#A78BFA"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; }}>

                {/* Content */}
                <div style={{ padding: "clamp(28px,4vw,48px)", order: isEven ? 1 : 2 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: `${color.includes("cyan") ? "rgba(6,182,212,.15)" : color.includes("purple") ? "rgba(167,139,250,.15)" : "rgba(96,165,250,.15)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color }}>
                      <i className={`fa-solid ${icon}`} />
                    </div>
                    <div>
                      <h3 style={{ fontFamily: "var(--font-d)", fontSize: "var(--t-xl)", fontWeight: 800, color, marginBottom: 2 }}>{item.name}</h3>
                      <span style={{ fontSize: 10, color: "var(--muted)", fontFamily: "var(--font-m)" }}>{item.tag}</span>
                    </div>
                    <span className={item.status === "live" ? "badge-live" : item.status === "beta" ? "badge-beta" : "badge-dev"} style={{ marginLeft: "auto" }}>
                      {item.status === "live" ? p.live : item.status === "beta" ? p.beta : p.dev}
                    </span>
                  </div>
                  <p style={{ fontSize: "var(--t-sm)", color: "var(--muted)", lineHeight: 1.75, marginBottom: 24 }}>{item.desc}</p>
                  <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 8, marginBottom: 28 }}>
                    {item.features.map(f => (
                      <li key={f} style={{ display: "flex", gap: 9, alignItems: "flex-start", fontSize: "var(--t-xs)" }}>
                        <i className="fa-solid fa-check" style={{ color: "var(--green-b)", marginTop: 2, flexShrink: 0 }} />
                        <span style={{ color: "var(--muted)" }}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  {link.href ? (
                    <a href={link.href} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: "var(--t-sm)", color, fontWeight: 700 }}>
                      {ctaLabel} <i className="fa-solid fa-arrow-right" style={{ fontSize: 12 }} />
                    </a>
                  ) : (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: "var(--t-sm)", color: "var(--muted)", fontWeight: 700 }}>
                      {link.display}
                    </span>
                  )}
                </div>

                {/* Visual */}
                <div style={{
                  background: `linear-gradient(135deg,${color.includes("cyan") ? "rgba(6,182,212,.08)" : color.includes("purple") ? "rgba(124,58,237,.08)" : "rgba(37,99,235,.08)"},var(--bg3))`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  minHeight: 360, order: isEven ? 2 : 1, position: "relative", overflow: "hidden",
                }}>
                  {/* Decorative circuit pattern */}
                  <div style={{ position: "absolute", inset: 0, opacity: .06, backgroundImage: "radial-gradient(circle,#fff 1px,transparent 1px)", backgroundSize: "24px 24px" }} />
                  <div style={{ textAlign: "center", position: "relative", zIndex: 1, width: "100%", padding: "10px 8px 16px" }}>
                    {logo ? (
                      <div style={{ position: "relative", width: logoStyle.width, aspectRatio: logoStyle.aspectRatio, margin: "0 auto 10px", transform: `translateY(${logoStyle.translateY || "0px"})` }}>
                        <Image
                          src={logo}
                          alt={`${item.name} logo`}
                          fill
                          sizes={logoStyle.sizes}
                          style={{ objectFit: "contain", filter: "drop-shadow(0 18px 40px rgba(15, 23, 42, .35))" }}
                        />
                      </div>
                    ) : (
                      <div style={{ width: 80, height: 80, borderRadius: "50%", background: `${color.includes("cyan") ? "rgba(6,182,212,.15)" : "rgba(124,58,237,.15)"}`, border: `2px solid ${color.includes("cyan") ? "rgba(6,182,212,.3)" : "rgba(167,139,250,.3)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, color, margin: "0 auto 18px", position: "relative" }}>
                        <i className={`fa-solid ${icon}`} />
                      </div>
                    )}
                    {!hideVisualName && (
                      <div style={{ fontFamily: "var(--font-d)", fontSize: "clamp(28px,3.2vw,40px)", fontWeight: 800, color, letterSpacing: "-.03em" }}>
                        {item.name}
                      </div>
                    )}
                    <div style={{ marginTop: 12, fontFamily: "var(--font-m)", fontSize: "var(--t-xs)", color, letterSpacing: ".1em", opacity: .7 }}>
                      {link.display}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <style>{`@media(max-width:700px){#produtos .container>div>div{grid-template-columns:1fr!important} #produtos .container>div>div>div:last-child{min-height:160px!important;order:1!important} #produtos .container>div>div>div:first-child{order:2!important}}`}</style>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// VISION
// ══════════════════════════════════════════════════════════════════════════════
export function Vision() {
  const { lang } = useLang();
  const v = translations[lang].vision;

  return (
    <section id="visao" className="section">
      <div className="container">
        <div className="reveal" style={{ textAlign: "center", marginBottom: "clamp(40px,6vw,60px)" }}>
          <span className="eyebrow">{v.eyebrow}</span>
        </div>

        <div className="grid-2" style={{ marginBottom: "clamp(48px,7vw,72px)", gap: "clamp(20px,3vw,32px)" }}>
          {[
            { label: v.visionLabel, text: v.visionText, icon: "fa-eye", color: "var(--cyan)", bg: "rgba(6,182,212,.08)", border: "rgba(6,182,212,.2)" },
            { label: v.missionLabel, text: v.missionText, icon: "fa-bullseye", color: "var(--purple-l)", bg: "rgba(167,139,250,.08)", border: "rgba(167,139,250,.2)" },
          ].map((item, i) => (
            <div key={item.label} className={`reveal d${i+1}`} style={{ background: item.bg, border: `1px solid ${item.border}`, borderRadius: 18, padding: "clamp(28px,4vw,40px)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: item.bg, border: `1px solid ${item.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: item.color }}>
                  <i className={`fa-solid ${item.icon}`} />
                </div>
                <span style={{ fontFamily: "var(--font-m)", fontSize: "var(--t-xs)", color: item.color, letterSpacing: ".1em", textTransform: "uppercase" }}>{item.label}</span>
              </div>
              <p style={{ fontSize: "var(--t-md)", color: "var(--muted)", lineHeight: 1.8 }}>{item.text}</p>
            </div>
          ))}
        </div>

        {/* Values */}
        <div className="grid-4">
          {v.values.map((val, i) => (
            <div key={val.title} className={`reveal d${i+1}`} style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 14, padding: "clamp(18px,2.5vw,24px)", textAlign: "center", transition: "border-color .2s, transform .2s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#2a3855"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(37,99,235,.1)", border: "1px solid rgba(37,99,235,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: "var(--blue-l)", margin: "0 auto 16px" }}>
                <i className={`fa-solid ${val.icon}`} />
              </div>
              <h4 style={{ fontWeight: 700, fontSize: "var(--t-sm)", marginBottom: 8 }}>{val.title}</h4>
              <p style={{ fontSize: "var(--t-xs)", color: "var(--muted)", lineHeight: 1.65 }}>{val.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SERVICES
// ══════════════════════════════════════════════════════════════════════════════
export function Services() {
  const { lang } = useLang();
  const s = translations[lang].services;
  const iconColors = ["var(--cyan)","var(--purple-l)","var(--blue-l)","var(--gold)","var(--green-b)","var(--blue-l)"];
  const iconBg = ["rgba(6,182,212,.1)","rgba(167,139,250,.1)","rgba(96,165,250,.1)","rgba(245,158,11,.1)","rgba(52,211,153,.1)","rgba(96,165,250,.1)"];

  return (
    <section id="servicos" className="section" style={{ background: "var(--bg2)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
      <div className="container">
        <div className="reveal" style={{ textAlign: "center", marginBottom: "clamp(40px,6vw,60px)" }}>
          <span className="eyebrow">{s.eyebrow}</span>
          <h2 style={{ fontFamily: "var(--font-d)", fontSize: "var(--t-2xl)", fontWeight: 800, letterSpacing: "-.03em", marginBottom: 14 }}>{s.headline}</h2>
          <p style={{ fontSize: "var(--t-md)", color: "var(--muted)", maxWidth: 560, margin: "0 auto" }}>{s.sub}</p>
        </div>

        <div className="grid-3" style={{ marginBottom: "clamp(32px,5vw,48px)" }}>
          {s.items.map((item, i) => (
            <div key={item.title} className={`reveal d${i > 2 ? i - 2 : i + 1}`} style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 14, padding: "clamp(20px,2.5vw,28px)", transition: "border-color .2s, transform .2s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#2a3855"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; }}>
              <div style={{ width: 46, height: 46, borderRadius: 10, background: iconBg[i], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: iconColors[i], marginBottom: 16 }}>
                <i className={`fa-solid ${item.icon}`} />
              </div>
              <h3 style={{ fontWeight: 700, fontSize: "var(--t-sm)", marginBottom: 10 }}>{item.title}</h3>
              <p style={{ fontSize: "var(--t-xs)", color: "var(--muted)", lineHeight: 1.65 }}>{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="reveal" style={{ textAlign: "center" }}>
          <a href="#contacto" className="btn-primary"><i className="fa-solid fa-paper-plane" />{s.cta}</a>
        </div>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// INVESTORS
// ══════════════════════════════════════════════════════════════════════════════
export function Investors() {
  const { lang } = useLang();
  const inv = translations[lang].investors;
  const investorForm = useApiForm("/api/investors", inv.formSuccess, inv.formError);

  return (
    <section id="investidores" className="section">
      <div className="container">
        <div className="reveal" style={{ textAlign: "center", marginBottom: "clamp(40px,6vw,60px)" }}>
          <span className="eyebrow">{inv.eyebrow}</span>
          <h2 style={{ fontFamily: "var(--font-d)", fontSize: "var(--t-2xl)", fontWeight: 800, letterSpacing: "-.03em", marginBottom: 14 }}>
            {inv.headline}
          </h2>
          <p style={{ fontSize: "var(--t-md)", color: "var(--muted)", maxWidth: 560, margin: "0 auto", lineHeight: 1.75 }}>
            {inv.sub}
          </p>
        </div>

        <div className="reveal investor-stats" style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "clamp(10px,1.5vw,16px)",
          marginBottom: "clamp(40px,6vw,56px)",
        }}>
          {inv.stats.map((s: { value: string; label: string }) => (
            <div key={s.label} style={{
              background: "var(--bg2)",
              border: "1px solid var(--border)",
              borderRadius: 14,
              padding: "clamp(16px,2vw,22px)",
              textAlign: "center",
            }}>
              <div style={{ fontFamily: "var(--font-d)", fontSize: "clamp(24px,3vw,32px)", fontWeight: 800, color: "var(--cyan)", lineHeight: 1 }}>
                {s.value}
              </div>
              <div style={{ fontSize: "var(--t-xs)", color: "var(--muted)", marginTop: 6 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        <div className="investor-grid" style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "clamp(20px,3vw,36px)",
          alignItems: "start",
        }}>
          <div className="reveal">
            <div style={{
              background: "linear-gradient(135deg, rgba(6,182,212,.06), var(--bg2))",
              border: "1px solid rgba(6,182,212,.25)",
              borderRadius: 20,
              padding: "clamp(24px,3vw,36px)",
              marginBottom: 20,
            }}>
              <div style={{ fontFamily: "var(--font-m)", fontSize: "var(--t-xs)", color: "var(--cyan)", letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 12 }}>
                {inv.tiers[0].name}
              </div>
              <div style={{ fontFamily: "var(--font-d)", fontSize: "clamp(28px,4vw,42px)", fontWeight: 800, color: "var(--cyan)", marginBottom: 6 }}>
                {inv.tiers[0].amount}
              </div>
              <div style={{ fontSize: "var(--t-xs)", color: "var(--muted)", marginBottom: 24 }}>
                {inv.tiers[0].equity}
              </div>

              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                {inv.tiers[0].perks.map((perk: string) => (
                  <li key={perk} style={{ display: "flex", gap: 9, alignItems: "flex-start", fontSize: "var(--t-xs)" }}>
                    <span style={{ color: "var(--green)", flexShrink: 0, marginTop: 2 }}>✓</span>
                    <span style={{ color: "var(--muted)" }}>{perk}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div style={{
              background: "var(--bg2)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: "clamp(18px,2.5vw,26px)",
            }}>
              <h3 style={{ fontWeight: 700, fontSize: "var(--t-sm)", marginBottom: 10 }}>
                {inv.safeTitle}
              </h3>
              <p style={{ fontSize: "var(--t-xs)", color: "var(--muted)", lineHeight: 1.75 }}>
                {inv.safeDesc}
              </p>
            </div>
          </div>

          <div className="reveal d2">
            <div style={{
              background: "var(--bg2)",
              border: "1px solid var(--border)",
              borderRadius: 20,
              padding: "clamp(24px,3vw,36px)",
            }}>
              <h3 style={{ fontFamily: "var(--font-d)", fontWeight: 800, fontSize: "var(--t-xl)", marginBottom: 24 }}>
                {inv.formTitle}
              </h3>

              <form
                onSubmit={investorForm.handleSubmit}
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
                <input type="hidden" name="lang" value={lang} />

                {[
                  { name: "name", placeholder: inv.formName, type: "text" },
                  { name: "email", placeholder: inv.formEmail, type: "email" },
                  { name: "amount", placeholder: inv.formAmount, type: "text" },
                ].map(f => (
                  <input
                    key={f.name}
                    name={f.name}
                    type={f.type}
                    placeholder={f.placeholder}
                    required
                    disabled={investorForm.isSubmitting}
                    style={{
                      width: "100%",
                      background: "var(--bg3)",
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                      color: "var(--text)",
                      fontSize: "var(--t-sm)",
                      padding: "13px 16px",
                      fontFamily: "inherit",
                    }}
                  />
                ))}

                <textarea
                  name="message"
                  placeholder={inv.formMessage}
                  rows={4}
                  disabled={investorForm.isSubmitting}
                  style={{
                    width: "100%",
                    background: "var(--bg3)",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    color: "var(--text)",
                    fontSize: "var(--t-sm)",
                    padding: "13px 16px",
                    fontFamily: "inherit",
                    resize: "none",
                  }}
                />

                <button
                  type="submit"
                  disabled={investorForm.isSubmitting}
                  style={{
                    width: "100%",
                    padding: 14,
                    borderRadius: 10,
                    background: "var(--blue)",
                    color: "#fff",
                    fontSize: "var(--t-sm)",
                    fontWeight: 800,
                    border: "none",
                    cursor: investorForm.isSubmitting ? "wait" : "pointer",
                    opacity: investorForm.isSubmitting ? .8 : 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  ✉ {investorForm.isSubmitting ? inv.formSending : inv.formCta}
                </button>
              </form>

              {investorForm.message && (
                <p style={{ fontSize: "var(--t-xs)", color: investorForm.status === "success" ? "var(--green-b)" : "#fca5a5", marginTop: 16, lineHeight: 1.6 }}>
                  {investorForm.message}
                </p>
              )}

              <p style={{ fontSize: "var(--t-xs)", color: "var(--muted)", marginTop: 16, lineHeight: 1.6 }}>
                {inv.disclaimer}
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media(max-width: 720px) {
          .investor-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media(max-width: 580px) {
          .investor-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
          .contact-form-row {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CONTACT
// ══════════════════════════════════════════════════════════════════════════════
export function Contact() {
  const { lang } = useLang();
  const c = translations[lang].contact;
  const contactForm = useApiForm("/api/contact", c.formSuccess, c.formError);

  return (
    <section id="contacto" className="section" style={{ background: "var(--bg2)", borderTop: "1px solid var(--border)" }}>
      <div className="container">
        <div className="reveal" style={{ textAlign: "center", marginBottom: "clamp(40px,6vw,60px)" }}>
          <span className="eyebrow">{c.eyebrow}</span>
          <h2 style={{ fontFamily: "var(--font-d)", fontSize: "var(--t-2xl)", fontWeight: 800, letterSpacing: "-.03em", marginBottom: 14 }}>{c.headline}</h2>
          <p style={{ fontSize: "var(--t-md)", color: "var(--muted)", maxWidth: 480, margin: "0 auto" }}>{c.sub}</p>
        </div>

        <div className="grid-2" style={{ gap: "clamp(24px,4vw,56px)", alignItems: "start" }}>
          {/* Info */}
          <div className="reveal">
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 40 }}>
              {[
                { icon: "fa-envelope", label: c.email, href: `mailto:${c.email}`, color: "var(--cyan)" },
                { icon: "fa-whatsapp fab", label: c.whatsapp, href: `https://wa.me/244951702823`, color: "var(--green-b)" },
                { icon: "fa-location-dot", label: c.location, href: "#", color: "var(--purple-l)" },
              ].map(item => (
                <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 14, background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 12, padding: "16px 20px", transition: "border-color .2s" }}
                  onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.borderColor = "#2a3855"}
                  onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border)"}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--bg2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, color: item.color, flexShrink: 0 }}>
                    <i className={`fa-solid ${item.icon}`} />
                  </div>
                  <span style={{ fontSize: "var(--t-sm)", color: "var(--text)" }}>{item.label}</span>
                </a>
              ))}
            </div>

            {/* Social */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {[
                { icon: "fa-instagram", href: "#", label: "Instagram" },
                { icon: "fa-linkedin", href: "#", label: "LinkedIn" },
                { icon: "fa-x-twitter", href: "#", label: "X" },
              ].map(s => (
                <a key={s.icon} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}
                  className="btn-ghost" style={{ padding: "10px 16px" }}>
                  <i className={`fa-brands ${s.icon}`} />{s.label}
                </a>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="reveal d2">
            <form onSubmit={contactForm.handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <input type="hidden" name="lang" value={lang} />
              <div className="contact-form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <input name="name"  type="text"  placeholder={c.formName}  required disabled={contactForm.isSubmitting} style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)", fontSize: "var(--t-sm)", padding: "12px 16px", fontFamily: "inherit", width: "100%" }} />
                <input name="email" type="email" placeholder={c.formEmail} required disabled={contactForm.isSubmitting} style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)", fontSize: "var(--t-sm)", padding: "12px 16px", fontFamily: "inherit", width: "100%" }} />
              </div>
              <select name="subject" disabled={contactForm.isSubmitting} style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--muted)", fontSize: "var(--t-sm)", padding: "12px 16px", fontFamily: "inherit", width: "100%" }}>
                {c.subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <textarea name="message" placeholder={c.formMessage} rows={5} required disabled={contactForm.isSubmitting} style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)", fontSize: "var(--t-sm)", padding: "12px 16px", fontFamily: "inherit", resize: "none", width: "100%" }} />
              <button type="submit" className="btn-primary" style={{ justifyContent: "center", cursor: contactForm.isSubmitting ? "wait" : "pointer", opacity: contactForm.isSubmitting ? .8 : 1 }} disabled={contactForm.isSubmitting}>
                <i className="fa-solid fa-paper-plane" />{contactForm.isSubmitting ? c.formSending : c.formCta}
              </button>
            </form>
            {contactForm.message && (
              <p style={{ fontSize: "var(--t-xs)", color: contactForm.status === "success" ? "var(--green-b)" : "#fca5a5", marginTop: 16, lineHeight: 1.6 }}>
                {contactForm.message}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// COOKIE BAR
// ══════════════════════════════════════════════════════════════════════════════
export function CookieBar() {
  const { lang } = useLang();
  const ck = translations[lang].cookie;
  const [show, setShow] = useStateHelper();

  function accept() { localStorage.setItem("asc_cookies", "accepted"); setShow(false); }
  function reject() { localStorage.setItem("asc_cookies", "rejected"); setShow(false); }

  if (!show) return null;

  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 900, background: "var(--bg2)", borderTop: "1px solid var(--border)", padding: "14px clamp(16px,4vw,32px)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
      <span style={{ fontSize: "var(--t-xs)", color: "var(--muted)" }}>
        {ck.text}{" "}
        <a href="/cookies" style={{ color: "var(--blue-l)" }}>{ck.link}</a>.
      </span>
      <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
        <button onClick={accept} className="btn-primary" style={{ padding: "8px 20px", fontSize: 13 }}>{ck.accept}</button>
        <button onClick={reject} className="btn-ghost"   style={{ padding: "7px 18px", fontSize: 13 }}>{ck.reject}</button>
      </div>
    </div>
  );
}

// Helper for cookie bar state
function useStateHelper(): [boolean, (v: boolean) => void] {
  const [show, setShow] = useState(() => {
    if (typeof window === "undefined") return true;
    return !localStorage.getItem("asc_cookies");
  });
  return [show, setShow];
}
