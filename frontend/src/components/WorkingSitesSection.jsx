import { useRef, useEffect, useState } from 'react';
import ScrollReveal from './ScrollReveal';
import './WorkingSitesSection.css';

const SITE_IMAGES = [
    {
        url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=800&auto=format&fit=crop",
        label: "Active Construction Site",
        location: "Rajasthan, India",
        size: "large"
    },
    {
        url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=600&auto=format&fit=crop",
        label: "Stone Carving Workshop",
        location: "Gujarat, India",
        size: "medium"
    },
    {
        url: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=600&auto=format&fit=crop",
        label: "Temple Foundation Work",
        location: "Maharashtra, India",
        size: "medium"
    },
    {
        url: "https://images.unsplash.com/photo-1590736969955-71cc94901144?q=80&w=800&auto=format&fit=crop",
        label: "Artisan Sculpting Tools",
        location: "Ahmedabad Workshop",
        size: "medium"
    },
    {
        url: "https://images.unsplash.com/photo-1605870445919-838d190e8e1b?q=80&w=600&auto=format&fit=crop",
        label: "Precision Stone Cutting",
        location: "Surat, Gujarat",
        size: "small"
    },
    {
        url: "https://images.unsplash.com/photo-1582719471384-894fbb16e074?q=80&w=600&auto=format&fit=crop",
        label: "Overhead Crane Operation",
        location: "Mumbai Site",
        size: "small"
    },
    {
        url: "https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?q=80&w=800&auto=format&fit=crop",
        label: "Master Craftsman at Work",
        location: "Delhi, India",
        size: "large"
    },
    {
        url: "https://images.unsplash.com/photo-1572021335469-31706a17aaef?q=80&w=600&auto=format&fit=crop",
        label: "Heavy Machinery Fleet",
        location: "Jaipur Operations",
        size: "medium"
    },
];

const STATS = [
    { value: "12+", label: "Active Sites", icon: "🏗️" },
    { value: "500T", label: "Stone Processed/Year", icon: "⛏️" },
    { value: "40+", label: "Machines & Tools", icon: "🔩" },
    { value: "3", label: "States Operating", icon: "📍" },
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
                        Precision craftsmanship powered by modern machinery and centuries of tradition
                    </p>
                </ScrollReveal>
                <div className="accent-line" style={{ margin: "24px auto" }} />
            </div>

            {/* Stats Bar */}
            <div className="wss-stats-bar">
                {STATS.map((stat, i) => (
                    <StatCard key={i} stat={stat} active={statsActive} />
                ))}
            </div>

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
                                <span className="wss-gallery-location">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                        <circle cx="12" cy="10" r="3"/>
                                    </svg>
                                    {img.location}
                                </span>
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
