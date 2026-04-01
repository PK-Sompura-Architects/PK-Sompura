import { useRef, useEffect } from "react";
import {
    gsap,
    createParallaxLayer,
    ScrollTrigger,
    createScrollReveal,
} from "../animations/scrollAnimations";
import { useLanguage } from "../context/LanguageContext";
import { TRANSLATIONS } from "../translations";
import "./CraftSection.css";

function CraftSection() {
    const { language } = useLanguage();
    const t = TRANSLATIONS[language];
    const sectionRef = useRef(null);
    const textRef = useRef(null);
    const visualRef = useRef(null);
    const listRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Text Reveal
            createScrollReveal(textRef.current, {
                y: 60,
                start: "top 75%",
            });

            // Visual Parallax/Scale
            gsap.fromTo(
                visualRef.current,
                { scale: 1.1, opacity: 0.8 },
                {
                    scale: 1,
                    opacity: 1,
                    ease: "none",
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: "top bottom",
                        end: "bottom top",
                        scrub: true,
                    },
                }
            );

            // Staggered list items
            const items = listRef.current.children;
            gsap.fromTo(
                items,
                { opacity: 0, x: -20 },
                {
                    opacity: 1,
                    x: 0,
                    stagger: 0.1,
                    duration: 0.8,
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: listRef.current,
                        start: "top 80%",
                        toggleActions: "play none none reverse",
                    },
                }
            );
        }, sectionRef);

        return () => ctx.revert();
    }, [language]);

    return (
        <section className="craft-section" ref={sectionRef}>
            <div className="craft-grid">
                {/* Text Column */}
                <div className="craft-content" ref={textRef}>
                    <span className="craft-label">{t.craft.label}</span>
                    <h2 className="craft-title">
                        {t.craft.title} <span className="gold">{t.craft.titleGold}</span>
                        <br />
                        {t.craft.titleBr}
                    </h2>
                    <div className="craft-line"></div>
                    <p className="craft-desc">{t.craft.desc}</p>

                    <ul className="craft-values" ref={listRef}>
                        {t.craft.values.map((val, i) => (
                            <li key={i}>
                                <span className="bullet">❖</span> {val}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Visual Column */}
                <div className="craft-visual">
                    <div className="visual-inner" ref={visualRef}>
                        <div className="visual-overlay"></div>
                        {/* Placeholder for craft image */}
                        <div className="visual-placeholder-text">
                            {t.craft.imagePlaceholder}
                        </div>
                    </div>
                </div>
            </div>
            {/* Decorative corner accents */}
            <div className="corner-accent top-left"></div>
            <div className="corner-accent bottom-right"></div>
        </section>
    );
}

export default CraftSection;
