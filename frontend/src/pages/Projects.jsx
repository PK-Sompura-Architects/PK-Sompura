import { useState, useEffect, useRef, useCallback } from "react";
import { motion, useMotionValue, useTransform, useSpring } from "motion/react";
import { getTemples } from "../api";
import { useLanguage } from "../context/LanguageContext";
import "./Projects.css";

/* ── Height pattern for masonry rhythm ── */
const HEIGHT_CLASSES = ["height-tall", "height-medium", "height-short"];

/* ── Parallax + Tilt enabled image card ── */
function ParallaxCard({ temple, index }) {
    const cardRef = useRef(null);

    /* Raw mouse position relative to the card center (0→1) */
    const mouseX = useMotionValue(0.5);
    const mouseY = useMotionValue(0.5);

    /* Spring-smoothed parallax offsets for the IMAGE (±15px range) */
    const rawImgX = useTransform(mouseX, [0, 1], [-15, 15]);
    const rawImgY = useTransform(mouseY, [0, 1], [-15, 15]);
    const imgX = useSpring(rawImgX, { stiffness: 150, damping: 20 });
    const imgY = useSpring(rawImgY, { stiffness: 150, damping: 20 });

    /* Spring-smoothed 3D tilt for the CARD itself (±8deg range) */
    const rawRotateX = useTransform(mouseY, [0, 1], [8, -8]);  /* Y-mouse → X-rotation */
    const rawRotateY = useTransform(mouseX, [0, 1], [-8, 8]);  /* X-mouse → Y-rotation */
    const rotateX = useSpring(rawRotateX, { stiffness: 200, damping: 25 });
    const rotateY = useSpring(rawRotateY, { stiffness: 200, damping: 25 });

    const handleMouseMove = useCallback((e) => {
        const rect = cardRef.current?.getBoundingClientRect();
        if (!rect) return;
        mouseX.set((e.clientX - rect.left) / rect.width);
        mouseY.set((e.clientY - rect.top) / rect.height);
    }, [mouseX, mouseY]);

    const handleMouseLeave = useCallback(() => {
        mouseX.set(0.5);
        mouseY.set(0.5);
    }, [mouseX, mouseY]);

    /* Pick the first non-cutout image, or fallback to any image */
    const primaryImage = temple.images?.find((img) => !img.is_cutout) || temple.images?.[0];
    const heightClass = HEIGHT_CLASSES[index % 3];

    /* Location string */
    const location = [temple.city, temple.state].filter(Boolean).join(", ");

    return (
        <motion.div
            className="project-card"
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                rotateX,
                rotateY,
                transformPerspective: 800,
            }}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
            <div className={`project-card-image-wrap ${heightClass}`}>
                {primaryImage ? (
                    <motion.img
                        className="project-card-image"
                        src={primaryImage.url}
                        alt={temple.name || temple.name_en}
                        loading="lazy"
                        style={{ x: imgX, y: imgY }}
                        draggable={false}
                    />
                ) : (
                    <div className="project-card-placeholder">
                        <svg
                            className="project-card-placeholder-icon"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1"
                        >
                            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                    </div>
                )}

                {/* Info overlay */}
                <div className="project-card-info">
                    <div className="project-card-name">
                        {temple.name || temple.name_en}
                    </div>
                    <div className="project-card-meta">
                        {location && <span>{location}</span>}
                        {location && temple.year && <span className="meta-dot" />}
                        {temple.year && <span>{temple.year}</span>}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

/* ── Skeleton loader ── */
function SkeletonGrid() {
    return (
        <div className="projects-skeleton">
            {Array.from({ length: 9 }).map((_, i) => (
                <div className="skeleton-card" key={i} />
            ))}
        </div>
    );
}

/* ── Empty state ── */
function EmptyState() {
    return (
        <div className="projects-empty">
            <svg
                className="projects-empty-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
            >
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <h3>No Projects Yet</h3>
            <p>Temples will appear here once they are added through the admin panel.</p>
        </div>
    );
}

/* ── Main Projects Page ── */
function Projects() {
    const { language } = useLanguage();
    const [temples, setTemples] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        async function fetchData() {
            try {
                const data = await getTemples(language);
                if (!cancelled) {
                    setTemples(data.temples || []);
                }
            } catch (err) {
                console.error("Failed to fetch temples:", err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        setLoading(true);
        fetchData();
        return () => { cancelled = true; };
    }, [language]);

    return (
        <div className="projects-page">
            {/* Header */}
            <header className="projects-header">
                <span className="projects-header-label">Portfolio</span>
                <h1>Sacred Monuments</h1>
                <div className="projects-header-line" />
                <p>
                    A living archive of temples crafted across generations —
                    each one a dialogue between earth, stone, and the divine.
                </p>
            </header>

            {/* Content */}
            {loading ? (
                <SkeletonGrid />
            ) : temples.length === 0 ? (
                <EmptyState />
            ) : (
                <div className="projects-masonry">
                    {temples.map((temple, i) => (
                        <ParallaxCard key={temple.id} temple={temple} index={i} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default Projects;