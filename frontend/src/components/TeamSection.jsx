import { useRef, useEffect } from "react";
import { gsap } from "../animations/scrollAnimations";
import { useLanguage } from "../context/LanguageContext";
import "./TeamSection.css";

// Placeholder data - you can update names and roles later!
const teamMembers = [
    {
        id: 1,
        name: "P. K. Sompura",
        role: "Founder & Master Architect",
        description: "The visionary behind generations of sacred architecture."
    },
    {
        id: 2,
        name: "Second Generation",
        role: "Principal Architect",
        description: "Carrying the legacy forward with modern precision."
    },
    {
        id: 3,
        name: "Third Generation",
        role: "Lead Sculptor",
        description: "Master of traditional Shilpa Shastra stone carving."
    }
];

function TeamSection() {
    const { language } = useLanguage();
    const sectionRef = useRef(null);
    const gridRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Staggered fade-in for team cards
            gsap.fromTo(
                gridRef.current.children,
                { opacity: 0, y: 40 },
                {
                    opacity: 1,
                    y: 0,
                    stagger: 0.2,
                    duration: 1,
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: "top 75%",
                        toggleActions: "play none none reverse",
                    },
                }
            );
        }, sectionRef);

        return () => ctx.revert();
    }, [language]);

    return (
        <section className="team-section" ref={sectionRef}>
            <div className="team-header">
                <span className="team-label">The Lineage</span>
                <h2>Master <span className="gold">Builders</span></h2>
                <div className="team-line"></div>
            </div>

            <div className="team-grid" ref={gridRef}>
                {teamMembers.map((member) => (
                    <div className="team-card" key={member.id}>
                        <div className="team-card-inner">
                            <div className="team-card-top">
                                <h3>{member.name}</h3>
                                <span className="team-role">{member.role}</span>
                            </div>
                            <p className="team-desc">{member.description}</p>
                        </div>
                        {/* Decorative corners */}
                        <div className="corner top-left"></div>
                        <div className="corner bottom-right"></div>
                    </div>
                ))}
            </div>
        </section>
    );
}

export default TeamSection;