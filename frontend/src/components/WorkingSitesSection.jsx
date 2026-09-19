import { useRef, useEffect, useState } from 'react';
import { Cpu } from 'lucide-react';
import ScrollReveal from './ScrollReveal';
import './WorkingSitesSection.css';

// The company's own photographs. These replaced eight stock library images
// that carried invented locations ("Jaipur Operations", "Mumbai Site")
// for sites that do not exist.
const SITE_IMAGES = [
    { url: "/media/work-sites/stone-yard.webp", label: "Stone yard, cutting in progress", size: "large" },
    { url: "/media/work-sites/cutting-dressing.webp", label: "Cutting and dressing", size: "medium" },
    { url: "/media/work-sites/cnc-carved-panel.webp", label: "CNC carved panel", size: "medium" },
    { url: "/media/work-sites/cnc-relief.webp", label: "CNC relief work", size: "small" },
    { url: "/media/work-sites/stone-yard-crew.webp", label: "Stone yard crew", size: "medium" },
    { url: "/media/work-sites/temple-under-build.webp", label: "Temple under construction", size: "large" },
    { url: "/media/work-sites/workshop-floor.webp", label: "Workshop floor", size: "small" },
    { url: "/media/work-sites/carved-torana.webp", label: "Carved torana", size: "medium" },
];

// Only what the business actually confirmed. This replaced four invented
// figures (12+ active sites, 500T of stone a year, 40+ machines, 3 states);
// anything added here has to come from them the same way.
const STATS = [
    { icon: <Cpu size={22} strokeWidth={1.5} />, value: "5", label: "CNC Machines" },
];

// Simple counter animation hook
function useCounter(target, duration = 1500, active = false) {
    const [count, setCount] = useState("0");

    useEffect(() => {
        if (!active) return;
        const numericPart = parseFloat(target.replace(/[^\d.]/g, ''));
        const suffix = target.replace(/[\d.]/g, '');
        if (isNaN(numericPart)) { setCount(target); return; }

        const step = numericPart / (duration / 16);
        let current = 0;
        const timer = setInterval(() => {
            current = Math.min(current + step, numericPart);
            setCount(`${Math.floor(current)}${suffix}`);
            if (current >= numericPart) clearInterval(timer);
        }, 16);
        return () => clearInterval(timer);
    }, [active, target, duration]);

    return count;
}

function StatCard({ stat, active }) {
    const count = useCounter(stat.value, 1200, active);
    return (
        <div className="wss-stat-card">
            <span className="wss-stat-icon">{stat.icon}</span>
            <span className="wss-stat-value">{count}</span>
            <span className="wss-stat-label">{stat.label}</span>
        </div>
    );
}

export default function WorkingSitesSection() {
    const sectionRef = useRef(null);
    const [statsActive, setStatsActive] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setStatsActive(true); },
            { threshold: 0.2 }
        );
        if (sectionRef.current) observer.observe(sectionRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <section className="wss-section" ref={sectionRef}>
            {/* Section Header */}
            <div className="wss-header">
                <ScrollReveal baseOpacity={0} blurStrength={10} baseRotation={2}>
                    <h2 className="wss-title">Tools, Machines &amp; Working Sites</h2>
                </ScrollReveal>
                <ScrollReveal baseOpacity={0} blurStrength={5}>
                    <p className="wss-subtitle">
                        Stone cut and dressed in-house on our own CNC machines, at a
                        working site adjoining the family's PVC pipe manufacturing
                        factory and office.
                    </p>
                </ScrollReveal>
                <div className="accent-line" style={{ margin: "24px auto" }} />
            </div>

            {/* Stats Bar */}
            {STATS.length > 0 && (
                <div className="wss-stats-bar">
                    {STATS.map((stat, i) => (
                        <StatCard key={i} stat={stat} active={statsActive} />
                    ))}
                </div>
            )}

            {/* Masonry Gallery Grid */}
            <div className="wss-gallery-grid">
                {SITE_IMAGES.map((img, i) => (
                    <div
                        key={i}
                        className={`wss-gallery-item wss-gallery-item--${img.size}`}
                    >
                        <img
                            src={img.url}
                            alt={img.label}
                            loading="lazy"
                        />
                        <div className="wss-gallery-overlay">
                            <div className="wss-gallery-info">
                                <span className="wss-gallery-label">{img.label}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Bottom CTA */}
            <div className="wss-cta">
                <ScrollReveal baseOpacity={0} blurStrength={5}>
                    <p className="wss-cta-text">
                        Every site is a testament to our commitment — from the first stone laid to the final consecration.
                    </p>
                </ScrollReveal>
            </div>
        </section>
    );
}
