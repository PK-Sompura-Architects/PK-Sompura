import { useRef, useEffect } from "react";
import {
    gsap,
    ScrollTrigger,
    createParallaxLayer,
} from "../animations/scrollAnimations";
import { useLanguage } from "../context/LanguageContext";
import { TRANSLATIONS } from "../translations";
import "./TempleChapter.css";

/**
 * TempleChapter — Reusable cinematic temple showcase component
 *
 * Props:
 * @param {string} name - Temple name
 * @param {string} description - Temple description
 * @param {string} city - City location
 * @param {string} state - State location
 * @param {string} year - Year of construction
 * @param {string} bgImage - Background image URL (optional)
 * @param {string} cutoutImage - Cutout PNG/WebP URL (optional)
 * @param {number} index - Chapter index (0-based)
 */
function TempleChapter({
    name = "Temple Name",
    description = "",
    city = "",
    state = "",
    year = "",
    bgImage = "",
    cutoutImage = "",
    index = 0,
}) {
    const { language } = useLanguage();
    const t = TRANSLATIONS[language];
    const sectionRef = useRef(null);
    const bgLayerRef = useRef(null);
    const cutoutLayerRef = useRef(null);
    const textLayerRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Background layer — 0.3x parallax speed
            createParallaxLayer(bgLayerRef.current, 0.3, sectionRef.current);

            // Cutout layer — 0.6x parallax speed
            createParallaxLayer(cutoutLayerRef.current, 0.6, sectionRef.current);

            // Text reveal animation
            const textContent = textLayerRef.current.querySelector(
                ".temple-text-content"
            );
            if (textContent) {
                gsap.fromTo(
                    textContent.children,
                    { opacity: 0, y: 30 },
                    {
                        opacity: 1,
                        y: 0,
                        stagger: 0.1,
                        duration: 0.8,
                        ease: "power2.out",
                        scrollTrigger: {
                            trigger: sectionRef.current,
                            start: "top 60%",
                            end: "top 20%",
                            toggleActions: "play none none reverse",
                        },
                    }
                );
            }

            // Chapter number fade-in
            const chapterNum = sectionRef.current.querySelector(
                ".temple-chapter-number"
            );
            if (chapterNum) {
                gsap.fromTo(
                    chapterNum,
                    { opacity: 0 },
                    {
                        opacity: 1,
                        duration: 1.2,
                        ease: "power2.out",
                        scrollTrigger: {
                            trigger: sectionRef.current,
                            start: "top 70%",
                            toggleActions: "play none none reverse",
                        },
                    }
                );
            }
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    const bgVariant = `variant-${index % 3}`;

    // Localized number helper
    const toLocalizedNumber = (num) => {
        const str = String(num).padStart(2, "0");
        if (language === "gu") {
            const guDigits = ["૦", "૧", "૨", "૩", "૪", "૫", "૬", "૭", "૮", "૯"];
            return str.split("").map((d) => guDigits[parseInt(d)] || d).join("");
        }
        if (language === "hi") {
            const hiDigits = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
            return str.split("").map((d) => hiDigits[parseInt(d)] || d).join("");
        }
        return str;
    };

    const localizedChapterNum = toLocalizedNumber(index + 1);

    return (
        <section className="temple-chapter" ref={sectionRef}>
            {/* Layer 1: Background (0.3x parallax) */}
            <div className="temple-bg-layer" ref={bgLayerRef}>
                {bgImage ? (
                    <img
                        className="temple-bg-image"
                        src={bgImage}
                        alt={`${name} background`}
                        loading="lazy"
                    />
                ) : (
                    <div className={`temple-bg-gradient ${bgVariant}`}></div>
                )}
            </div>

            {/* Layer 2: Cutout mid-layer (0.6x parallax) */}
            <div className="temple-cutout-layer" ref={cutoutLayerRef}>
                {cutoutImage ? (
                    <img
                        className="temple-cutout-image"
                        src={cutoutImage}
                        alt={`${name} architecture`}
                        loading="lazy"
                    />
                ) : (
                    <div className="temple-cutout-placeholder">
                        <div className="temple-silhouette">
                            <div className="temple-spire"></div>
                        </div>
                    </div>
                )}
            </div>

            {/* Atmospheric layers */}
            <div className="temple-top-fade"></div>
            <div className="temple-mist"></div>

            {/* Chapter number watermark */}
            <div className="temple-chapter-number">{localizedChapterNum}</div>

            {/* Layer 3: Foreground text (1.0x speed) */}
            <div className="temple-text-layer" ref={textLayerRef}>
                <div className="temple-text-content">
                    <span className="temple-chapter-label">
                        {t?.chapter || "Chapter"} {localizedChapterNum}
                    </span>
                    <h2 className="temple-chapter-title">
                        <span className="gold">{name}</span>
                    </h2>
                    <div className="temple-text-line"></div>
                    {description && (
                        <p className="temple-chapter-desc">{description}</p>
                    )}
                    {(city || year) && (
                        <div className="temple-chapter-meta">
                            {city && (
                                <span className="temple-meta-item">
                                    <span>⊹</span> {city}
                                    {state && `, ${state}`}
                                </span>
                            )}
                            {year && (
                                <span className="temple-meta-item">
                                    <span>⊹</span> {year}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

export default TempleChapter;
