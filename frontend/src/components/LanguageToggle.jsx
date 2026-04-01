import { useLanguage } from "../context/LanguageContext";
import "./LanguageToggle.css";

function LanguageToggle() {
    const { language, changeLanguage } = useLanguage();

    return (
        <div className="language-toggle-container">
            <select
                value={language}
                onChange={(e) => changeLanguage(e.target.value)}
                className="language-select"
                aria-label="Select Language"
            >
                <option value="en">EN</option>
                <option value="gu">GU</option>
                <option value="hi">HI</option>
            </select>
        </div>
    );
}

export default LanguageToggle;