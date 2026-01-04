"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { t as i18nT } from "@/lib/i18n";
const LanguageContext = createContext(null);
export function LanguageProvider({ children }) {
    const [language, setLanguageState] = useState("en");
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
        const saved = localStorage.getItem("language");
        if (saved && (saved === "ar" || saved === "en")) {
            setLanguageState(saved);
            document.documentElement.dir = "ltr";
            document.documentElement.lang = saved;
        }
        else {
            document.documentElement.dir = "ltr";
            document.documentElement.lang = "en";
        }
    }, []);
    const setLanguage = (lang) => {
        setLanguageState(lang);
        localStorage.setItem("language", lang);
        if (typeof document !== "undefined") {
            document.documentElement.dir = "ltr";
            document.documentElement.lang = lang;
            window.dispatchEvent(new Event("resize"));
        }
    };
    const t = (key) => {
        return i18nT(key, language);
    };
    return (<LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>);
}
export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context)
        throw new Error("useLanguage must be used within LanguageProvider");
    return context;
}
