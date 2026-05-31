"use client";

import { useEffect } from "react";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import {
  Contact,
  CookieBar,
  Hero,
  Investors,
  Products,
  Services,
  Vision,
} from "@/components/sections/Sections";

export default function HomePage() {
  const revealAndScroll = (hash: "#investidores") => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.querySelector(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  };

  useEffect(() => {
    const applyHash = () => {
      if (window.location.hash === "#investidores") revealAndScroll("#investidores");
    };

    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => {
      window.removeEventListener("hashchange", applyHash);
    };
  }, []);

  return (
    <>
      <Navbar
        onSectionNavigate={(hash) => {
          if (window.location.hash !== hash) {
            window.location.hash = hash;
          }
          revealAndScroll(hash);
        }}
      />
      <main>
        <Hero />
        <Products />
        <Vision />
        <Services />
        <Investors />
        <Contact />
      </main>
      <Footer />
      <CookieBar />
    </>
  );
}
