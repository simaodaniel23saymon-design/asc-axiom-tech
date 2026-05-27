"use client";
import { useState, useEffect } from "react";
import { useLang } from "@/lib/hooks/useLang";
import { translations, type Lang } from "@/lib/data/translations";
import { ascBrand } from "@/lib/data/branding";

type NavbarProps = {
  onSectionNavigate?: (hash: "#investidores") => void;
};

export default function Navbar({ onSectionNavigate }: NavbarProps) {
  const { lang, changeLang } = useLang();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const n = translations[lang].nav;

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const links = [
    { href: "#produtos",    label: n.products },
    { href: "#visao",       label: n.vision   },
    { href: "#servicos",    label: n.services  },
    { href: "#investidores",label: n.investors },
    { href: "#contacto",    label: n.contact   },
  ];

  return (
    <>
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
        height: "clamp(60px,7vw,72px)",
        padding: "0 clamp(16px,4vw,32px)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 16,
        background: scrolled ? "rgba(7,9,15,.96)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid #1E293B" : "1px solid transparent",
        transition: "all .4s",
      }}>
        <a href="#" aria-label="ASC Axiom Tech" style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
          {/* [LOGO] Substitua pela imagem do seu logo real */}
          <img src={ascBrand.logo} alt="ASC Axiom Tech" className="brand-logo brand-logo--nav" />
        </a>

        {/* DESKTOP NAV */}
        <ul style={{ display: "flex", gap: "clamp(18px,2.5vw,32px)", listStyle: "none", alignItems: "center" }} className="desktop-nav">
          {links.map(l => (
            <li key={l.href}>
              <a href={l.href} onClick={e => {
                if (l.href === "#investidores") {
                  e.preventDefault();
                  onSectionNavigate?.(l.href);
                }
                setOpen(false);
              }} style={{
                color: "var(--muted)", fontSize: "var(--t-sm)", fontWeight: 500,
                transition: "color .2s",
              }}
                onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = "var(--text)"}
                onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = "var(--muted)"}
              >{l.label}</a>
            </li>
          ))}
        </ul>

        {/* LANG + CTA + HAMBURGER */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          {(["pt","en","es"] as Lang[]).map(lg => (
            <button key={lg} onClick={() => changeLang(lg)} style={{
              background: lang === lg ? "rgba(37,99,235,.2)" : "none",
              border: `1px solid ${lang === lg ? "var(--blue)" : "var(--border)"}`,
              borderRadius: 6, color: lang === lg ? "var(--blue-l)" : "var(--muted)",
              padding: "3px 9px", fontSize: 11, fontWeight: 700,
              fontFamily: "var(--font-m)", textTransform: "uppercase",
            }}>{lg}</button>
          ))}
          <a href="#contacto" className="btn-primary" style={{ padding: "9px 20px", fontSize: 13 }}>{n.cta}</a>
          <button onClick={() => setOpen(!open)} aria-label="Menu"
            style={{ background: "none", border: `1px solid var(--border)`, borderRadius: 8, color: "var(--text)", width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}
            className="hamburger">
            <i className={`fa-solid ${open ? "fa-xmark" : "fa-bars"}`} />
          </button>
        </div>
      </nav>

      {/* MOBILE MENU */}
      {open && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 999,
          background: "var(--bg2)",
          display: "flex", flexDirection: "column",
          padding: "80px 24px 32px",
          gap: 8,
        }}>
          {links.map(l => (
            <a key={l.href} href={l.href} onClick={e => {
              if (l.href === "#investidores") {
                e.preventDefault();
                onSectionNavigate?.(l.href);
              }
              setOpen(false);
            }} style={{
              display: "block", padding: "14px 16px",
              border: "1px solid var(--border)", borderRadius: 10,
              color: "var(--text)", fontSize: "var(--t-lg)", fontWeight: 600,
            }}>{l.label}</a>
          ))}
          <a href="#contacto" className="btn-primary" onClick={() => setOpen(false)}
            style={{ marginTop: 12, justifyContent: "center" }}>{n.cta}</a>
        </div>
      )}

      <style>{`
        @media(min-width:900px){.hamburger{display:none!important}}
        @media(max-width:900px){.desktop-nav{display:none!important}}
      `}</style>
    </>
  );
}
