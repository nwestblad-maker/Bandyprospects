"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Language } from "@/types";
import { TRANSLATIONS, Translations } from "@/data/translations";

interface LanguageContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "en",
  setLang: () => {},
  t: TRANSLATIONS.en,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Platform is unified to 100% English
  const [lang, setLangState] = useState<Language>("en");

  useEffect(() => {
    try {
      localStorage.setItem("bandyprospects_lang", "en");
    } catch {
      // ignore
    }
  }, []);

  const setLang = (_newLang: Language) => {
    // English is the sole language
    setLangState("en");
  };

  const t = TRANSLATIONS.en;

  return (
    <LanguageContext.Provider value={{ lang: "en", setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
