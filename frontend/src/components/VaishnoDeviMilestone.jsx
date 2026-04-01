import { useRef, useEffect } from "react";
import { gsap, ScrollTrigger } from "../animations/scrollAnimations";
import { useLanguage } from "../context/LanguageContext";
import { TRANSLATIONS } from "../translations";
import "./VaishnoDeviMilestone.css";

function VaishnoDeviMilestone() {
    const { language } = useLanguage();
    const t = TRANSLATIONS[language];
    const sectionRef = useRef(null);
    const trackRef = useRef(null);
    const progressBarRef = useRef(null);

    // Milestone data from translations
    const milestones = [
        {
            id: 1,
            year: "1998",
            label: t.milestone.label1,
            title: (
                <>
                    {t.milestone.title1} <br />{" "}
                    <span className="gold">{t.milestone.title1Gold}</span>
                </>
            ),
            description: t.milestone.desc1,
            image: null, // Placeholder
        },
        {
            id: 2,
            year: "Vision",
            label: t.milestone.label2,
            title: (
                <>
                    {t.milestone.title2} <br />{" "}
                    <span className="gold">{t.milestone.title2Gold}</span>
                </>
            ),
            description: t.milestone.desc2,
            image: null,
        },
        {
            id: 3,
            year: "Legacy",
            label: t.milestone.label3,
            title: (
                <>
                    {t.milestone.title3} <br />{" "}
                    <span className="gold">{t.milestone.title3Gold}</span>
                </>
            ),
            description: t.milestone.desc3,
            image: null,
        },
    ];

    useEffect(() => {
        const ctx = gsap.context(() => {
            const track = trackRef.current;
            const panels = gsap.utils.toArray(".milestone-panel");

            // Horizontal Scroll
            const scrollTween = gsap.to(track, {
                x: () => -(track.scrollWidth - window.innerWidth),
                ease: "none",
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: "top top",
                    end: () => `+=${track.scrollWidth - window.innerWidth}`,
                    pin: true,
                    scrub: 1,
                    invalidateOnRefresh: true,
                    onUpdate: (self) => {
                        // Update progress bar
                        if (progressBarRef.current) {
                            progressBarRef.current.style.transform = `scaleX(${self.progress})`;
                        }
                    },
                },
            });

            // Panel Animations (Parallax/Fade-in)
            panels.forEach((panel, i) => {
                const content = panel.querySelector(".panel-content");
                const image = panel.querySelector(".panel-visual");

                gsap.from(content, {
                    y: 50,
                    opacity: 0,
                    duration: 1,
                    ease: "power2.out",
                    scrollTrigger: {
                        containerAnimation: scrollTween,
                        trigger: panel,
                        start: "left 80%",
                        toggleActions: "play none none reverse",
                    },
                });

                gsap.from(image, {
                    scale: 1.1,
                    duration: 1.5,
                    ease: "power2.out",
                    scrollTrigger: {
                        containerAnimation: scrollTween,
                        trigger: panel,
                        start: "left 80%",
                        toggleActions: "play none none reverse",
                    },
                });
            });
        }, sectionRef);

        return () => ctx.revert();
    }, [language]); // Re-run when language changes

    return (
        <section className="milestone-section" ref={sectionRef}>
            <div className="milestone-track" ref={trackRef}>
                {milestones.map((m) => (
                    <div className="milestone-panel" key={m.id}>
                        <div className="panel-bg-watermark">{m.year}</div>
                        <div className="panel-content">
                            <span className="panel-label">{m.label}</span>
                            <h2 className="panel-title">{m.title}</h2>
                            <div className="panel-line"></div>
                            <p className="panel-desc">{m.description}</p>
                        </div>
                        <div className="panel-visual">
                            <div className="visual-placeholder">
                                <div className="visual-motif"></div>
                                <span>{t.milestone.imagePlaceholder}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="milestone-progress">
                <div className="progress-bar" ref={progressBarRef}></div>
            </div>
        </section>
    );
}

export default VaishnoDeviMilestone;
