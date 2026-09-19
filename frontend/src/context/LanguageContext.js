import { createContext, useContext } from "react";

// No component is exported from this file on purpose. A module that exports
// both a component and plain values loses Fast Refresh for everything in it,
// so the provider lives next door in LanguageProvider.jsx.

const LanguageContext = createContext();

export const LANGUAGES = {
    en: { label: "EN", name: "English" },
    gu: { label: "ગુ", name: "ગુજરાતી" },
    hi: { label: "हि", name: "हिन्दी" },
};

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
}

export default LanguageContext;
