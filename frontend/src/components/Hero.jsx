import { useRef, useEffect } from "react";
import { gsap, createParallaxLayer } from "../animations/scrollAnimations";
import { useLanguage } from "../context/LanguageContext";
import { TRANSLATIONS } from "../translations";
import "./Hero.css";

function Hero() {
    const { language } = useLanguage();
    const t = TRANSLATIONS[language];

    const sectionRef = useRef(null);
    const bgLayerRef = useRef(null);
    const scrollWrapperRef = useRef(null);
    const contentRef = useRef(null);
    const scrollIndicatorRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // 1. ENTRANCE FADE IN
            gsap.to(contentRef.current, {
                opacity: 1,
                y: 0,
                duration: 1.5,
                delay: 0.5, // Waits a half second for the gate to open
                ease: "power3.out",
            });
            
            gsap.to(scrollIndicatorRef.current, {
                opacity: 0.6,
                duration: 1,
                delay: 1.2,
                ease: "power2.out",
            });

            // 2. PARALLAX
            if (bgLayerRef.current) {
                createParallaxLayer(bgLayerRef.current, 0.3, sectionRef.current);
            }

            // 3. SCROLL FADE OUT
            gsap.to(scrollWrapperRef.current, {
                opacity: 0,
                y: -80,
                ease: "none",
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: "10% top",
                    end: "80% top",
                    scrub: true, // Forces it to rewind when you scroll back up
                },
            });
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    return (
        <section className="hero-section" ref={sectionRef}>
            <div className="hero-bg-layer" ref={bgLayerRef}></div>

            <div className="hero-scroll-wrapper" ref={scrollWrapperRef}>
                <div className="hero-content" ref={contentRef}>
                    <img src="/LOGO_2.png" alt="P.K. Sompura" className="hero-logo" />
                    
                    <div className="hero-text-block">
                        <h1 className="hero-title">{t?.hero?.title1 || "P.K. SOMPURA"}</h1>
                        <p className="hero-subtitle">{t?.hero?.subtitle || "TEMPLE ARCHITECT & CONTRACTOR"}</p>
                    </div>
                </div>

                <div className="hero-scroll-indicator" ref={scrollIndicatorRef}>
                    <span>{t?.hero?.scroll || "SCROLL"}</span>
                    <div className="hero-scroll-line"></div>
                </div>
            </div>
        </section>
    );
}

export default Hero;