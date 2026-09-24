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

// Five machines, shown as five pieces of their work rather than as the
// numeral 5.
//
// These are the OUTPUT of the machines, not the machines. The company has no
// photographs of the five CNC machines themselves, and sourcing stock ones
// would repeat the mistake this section already had to undo -- it once carried
// eight stock library images labelled with cities where there is no site.
// Swap these for photographs of the machines as soon as they exist; the strip
// takes five either way.
const CNC_WORK = [
    { url: "/media/cnc-works/01.webp", label: "Carved ceiling medallion" },
    { url: "/media/cnc-works/03.webp", label: "Inscribed panel" },
    { url: "/media/cnc-works/05.webp", label: "Figured bracket panel" },
    { url: "/media/cnc-works/06.webp", label: "Coffered ceiling" },
    { url: "/media/cnc-works/07.webp", label: "Pilaster ornament" },
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
            <ScrollReveal delay={80}>
                <div className="wss-cnc">
                    <p className="wss-cnc-label">Five CNC machines, cutting in-house</p>
                    <ul className="wss-cnc-strip">
                        {CNC_WORK.map((w) => (
                            <li key={w.url}>
                                <img src={w.url} alt={w.label} loading="lazy" decoding="async" />
                                <span>{w.label}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </ScrollReveal>

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
