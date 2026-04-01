import { createContext, useContext, useState, useEffect } from "react";

const LanguageContext = createContext();

const LANGUAGES = {
    en: { label: "EN", name: "English" },
    gu: { label: "ગુ", name: "ગુજરાતી" },
    hi: { label: "हि", name: "हिन्दी" },
};

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

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
}

export { LANGUAGES };
export default LanguageContext;
