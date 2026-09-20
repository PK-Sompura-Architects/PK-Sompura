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

export default function WorkingSitesSection() {
    return (
        <section className="wss-section">
            {/* Section Header */}
            <div className="wss-header">
                <ScrollReveal>
                    <h2 className="wss-title">Tools, Machines &amp; Working Sites</h2>
                </ScrollReveal>
                <ScrollReveal>
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
                    {STATS.map((stat) => (
                        <div className="wss-stat-card" key={stat.label}>
                            <span className="wss-stat-icon">{stat.icon}</span>
                            <span className="wss-stat-value">{stat.value}</span>
                            <span className="wss-stat-label">{stat.label}</span>
                        </div>
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
                <ScrollReveal>
                    <p className="wss-cta-text">
                        Every site is a testament to our commitment — from the first stone laid to the final consecration.
                    </p>
                </ScrollReveal>
            </div>
        </section>
    );
}
