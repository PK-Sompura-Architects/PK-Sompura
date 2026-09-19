import { useState, useEffect } from "react";
import LanguageContext, { LANGUAGES } from "./LanguageContext";

// Only the component, so editing it hot-updates rather than full-reloading.
export function LanguageProvider({ children }) {
    const [language, setLanguage] = useState(() => {
        try {
            return localStorage.getItem("pk_lang") || "en";
        } catch {
            return "en";
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem("pk_lang", language);
        } catch {
            // localStorage unavailable
        }
    }, [language]);

    return (
        <LanguageContext.Provider value={{ language, setLanguage, LANGUAGES }}>
            {children}
        </LanguageContext.Provider>
    );
}

export default LanguageProvider;
