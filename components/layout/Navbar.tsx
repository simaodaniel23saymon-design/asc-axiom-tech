"use client";
import { useState, useEffect, useRef } from "react";
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
  const [langOpen, setLangOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement | null>(null);
  const n = translations[lang].nav;
  const languageOptions: Array<{ code: Lang; label: string }> = [
    { code: "pt", label: "Português" },
    { code: "en", label: "English" },
    { code: "es", label: "Español" },
  ];

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!langOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setLangOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLangOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [langOpen]);

  const links = [
    { href: "#produtos", label: n.products },
    { href: "#visao", label: n.vision },
    { href: "#servicos", label: n.services },
    { href: "#investidores", label: n.investors },
    { href: "#contacto", label: n.contact },
  ];

  function handleLangChange(nextLang: Lang) {
    changeLang(nextLang);
    setLangOpen(false);
  }

  return (
    <>
      <nav
        className="site-nav"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          height: "clamp(60px,7vw,72px)",
          padding: "0 clamp(16px,4vw,32px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          background: scrolled ? "rgba(7,9,15,.96)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? "1px solid #1E293B" : "1px solid transparent",
          transition: "all .4s",
        }}
      >
        <a href="#" aria-label="ASC Axiom Tech" style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
          <img src={ascBrand.logo} alt="ASC Axiom Tech" className="brand-logo brand-logo--nav" />
        </a>

        <ul style={{ display: "flex", gap: "clamp(18px,2.5vw,32px)", listStyle: "none", alignItems: "center" }} className="desktop-nav">
          {links.map(link => (
            <li key={link.href}>
              <a
                href={link.href}
                onClick={event => {
                  if (link.href === "#investidores") {
                    event.preventDefault();
                    onSectionNavigate?.(link.href);
                  }
                  setOpen(false);
                }}
                style={{
                  color: "var(--muted)",
                  fontSize: "var(--t-sm)",
                  fontWeight: 500,
                  transition: "color .2s",
                }}
                onMouseEnter={event => (event.currentTarget as HTMLAnchorElement).style.color = "var(--text)"}
                onMouseLeave={event => (event.currentTarget as HTMLAnchorElement).style.color = "var(--muted)"}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }} className="nav-actions">
          <div ref={langMenuRef} style={{ position: "relative" }}>
            <button
              type="button"
              aria-label="Mudar idioma"
              aria-haspopup="menu"
              aria-expanded={langOpen}
              className="lang-trigger"
              onClick={() => setLangOpen(current => !current)}
              style={{
                background: langOpen ? "rgba(37,99,235,.16)" : "rgba(12,15,26,.82)",
                border: `1px solid ${langOpen ? "rgba(96,165,250,.45)" : "var(--border)"}`,
                borderRadius: 999,
                color: langOpen ? "var(--text)" : "var(--muted)",
                minHeight: 38,
                padding: "0 12px",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                transition: "border-color .2s, color .2s, background .2s",
              }}
            >
              <i className="fa-solid fa-globe" />
              <span className="lang-current" style={{ fontFamily: "var(--font-m)", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>
                {lang}
              </span>
              <i className={`fa-solid ${langOpen ? "fa-chevron-up" : "fa-chevron-down"}`} style={{ fontSize: 11 }} />
            </button>

            {langOpen && (
              <div
                role="menu"
                aria-label="Selecionar idioma"
                className="lang-menu"
                style={{
                  position: "absolute",
                  top: "calc(100% + 10px)",
                  right: 0,
                  minWidth: 176,
                  background: "rgba(12,15,26,.98)",
                  border: "1px solid var(--border)",
                  borderRadius: 14,
                  padding: 8,
                  boxShadow: "0 18px 40px rgba(7, 9, 15, .35)",
                  backdropFilter: "blur(16px)",
                }}
              >
                {languageOptions.map(option => {
                  const active = lang === option.code;

                  return (
                    <button
                      key={option.code}
                      type="button"
                      role="menuitemradio"
                      aria-checked={active}
                      onClick={() => handleLangChange(option.code)}
                      style={{
                        width: "100%",
                        background: active ? "rgba(37,99,235,.14)" : "transparent",
                        border: "none",
                        borderRadius: 10,
                        color: active ? "var(--text)" : "var(--muted)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        padding: "10px 12px",
                        textAlign: "left",
                      }}
                    >
                      <span style={{ fontSize: "var(--t-sm)", fontWeight: 600 }}>{option.label}</span>
                      <span style={{ fontFamily: "var(--font-m)", fontSize: 11, textTransform: "uppercase", color: active ? "var(--blue-l)" : "var(--muted)" }}>
                        {option.code}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <a href="#contacto" className="btn-primary nav-cta" style={{ padding: "9px 20px", fontSize: 13 }}>
            {n.cta}
          </a>

          <button
            onClick={() => setOpen(current => !current)}
            aria-label="Menu"
            style={{
              background: "none",
              border: "1px solid var(--border)",
              borderRadius: 8,
              color: "var(--text)",
              width: 38,
              height: 38,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 17,
            }}
            className="hamburger"
          >
            <i className={`fa-solid ${open ? "fa-xmark" : "fa-bars"}`} />
          </button>
        </div>
      </nav>

      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999,
            background: "var(--bg2)",
            display: "flex",
            flexDirection: "column",
            padding: "80px 24px 32px",
            gap: 8,
          }}
        >
          {links.map(link => (
            <a
              key={link.href}
              href={link.href}
              onClick={event => {
                if (link.href === "#investidores") {
                  event.preventDefault();
                  onSectionNavigate?.(link.href);
                }
                setOpen(false);
                setLangOpen(false);
              }}
              style={{
                display: "block",
                padding: "14px 16px",
                border: "1px solid var(--border)",
                borderRadius: 10,
                color: "var(--text)",
                fontSize: "var(--t-lg)",
                fontWeight: 600,
              }}
            >
              {link.label}
            </a>
          ))}

          <div
            style={{
              marginTop: 8,
              background: "var(--bg3)",
              border: "1px solid var(--border)",
              borderRadius: 14,
              padding: 14,
            }}
          >
            <div style={{ fontFamily: "var(--font-m)", fontSize: 11, color: "var(--muted)", letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 12 }}>
              Idioma
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
              {languageOptions.map(option => {
                const active = lang === option.code;
                return (
                  <button
                    key={option.code}
                    type="button"
                    onClick={() => handleLangChange(option.code)}
                    style={{
                      minHeight: 42,
                      background: active ? "rgba(37,99,235,.16)" : "transparent",
                      border: `1px solid ${active ? "rgba(96,165,250,.45)" : "var(--border)"}`,
                      borderRadius: 10,
                      color: active ? "var(--blue-l)" : "var(--muted)",
                      fontFamily: "var(--font-m)",
                      fontSize: 12,
                      fontWeight: 700,
                      textTransform: "uppercase",
                    }}
                  >
                    {option.code}
                  </button>
                );
              })}
            </div>
          </div>

          <a href="#contacto" className="btn-primary" onClick={() => setOpen(false)} style={{ marginTop: 12, justifyContent: "center" }}>
            {n.cta}
          </a>
        </div>
      )}

      <style>{`
        @media(min-width:961px){.hamburger{display:none!important}}
        @media(max-width:960px){.desktop-nav{display:none!important}}
        @media(max-width:640px){.nav-cta{display:none!important}}
        @media(max-width:580px){
          .site-nav{padding:0 14px!important;height:60px!important}
          .nav-actions{gap:8px!important}
          .lang-trigger{padding:0 10px!important}
          .lang-current{display:none!important}
          .lang-menu{min-width:148px!important}
        }
      `}</style>
    </>
  );
}
