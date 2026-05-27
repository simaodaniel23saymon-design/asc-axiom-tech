"use client";
import { useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Hero, Products, Vision, Services, Investors, Contact, CookieBar } from "@/components/sections/Sections";

export default function Home() {
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
      <Navbar onSectionNavigate={(hash) => {
        if (window.location.hash !== hash) {
          window.location.hash = hash;
        }
        revealAndScroll(hash);
      }} />
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
