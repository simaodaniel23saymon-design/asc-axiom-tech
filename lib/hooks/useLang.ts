"use client";
import { useState, useEffect } from "react";
import type { Lang } from "@/lib/data/translations";

export function useLang() {
  const [lang, setLang] = useState<Lang>("pt");

  useEffect(() => {
    const saved = localStorage.getItem("asc_lang") as Lang | null;
    const nextLang = saved && ["pt", "en", "es", "fr"].includes(saved) ? saved : "pt";
    setLang(nextLang);
    document.documentElement.lang = nextLang;
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  function changeLang(l: Lang) {
    setLang(l);
    localStorage.setItem("asc_lang", l);
    document.documentElement.lang = l;
  }

  return { lang, changeLang };
}
