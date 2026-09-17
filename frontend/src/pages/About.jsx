import { useState, useEffect } from "react";
import ProfileCard from "../components/ProfileCard";
import ScrollReveal from "../components/ScrollReveal";
import "./About.css";

function About() {
    const [lineage, setLineage] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLineage = async () => {
            try {
                const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
                const response = await fetch(`${API_URL}/lineage`);
                const data = await response.json();
                setLineage(data);
            } catch (error) {
                console.error("Failed to load lineage members:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchLineage();
    }, []);

    return (
        <div className="about-wrapper">
            <div className="about-header">
                <ScrollReveal baseOpacity={0} blurStrength={10} baseRotation={3}>
                    <h1 className="sompura-title" style={{ fontSize: "clamp(30px, 5vw, 60px)" }}>
                        The Lineage
                    </h1>
                </ScrollReveal>
                <ScrollReveal baseOpacity={0} blurStrength={5}>
                    <p className="sompura-subtitle" style={{ color: "var(--color-text-muted)" }}>
                        Generations of Sacred Mastery
                    </p>
                </ScrollReveal>
            </div>

            {loading ? (
                <div style={{ color: "var(--color-gold)" }}>Loading Legacy...</div>
            ) : (
                <div className="about-lineage-grid">
                    {lineage.map((member) => (
                        <ProfileCard 
                            key={member.id}
                            name={member.name}
                            title={member.role} /* Mapped to role from DB */
                            description={member.description}
                            avatarUrl={member.image_url} /* Pulled straight from DB */
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default About;