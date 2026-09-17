import { useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Landmark, Users, Send, ArrowUpRight } from "lucide-react";
import "./HeroNav.css";

const PAGES = [
    {
        to: "/projects",
        icon: Landmark,
        title: "Projects",
        desc: "Temples raised across three generations",
    },
    {
        to: "/about",
        icon: Users,
        title: "The Lineage",
        desc: "The family behind the craft",
    },
    {
        to: "/inquiry",
        icon: Send,
        title: "Inquiry",
        desc: "Commission a temple",
    },
];

function NavCard({ page }) {
    const ref = useRef(null);
    const raf = useRef(0);
    const Icon = page.icon;

    const handleMove = useCallback((e) => {
        const el = ref.current;
        if (!el) return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

        // Coalesce to one update per frame; pointermove fires far faster.
        cancelAnimationFrame(raf.current);
        const { clientX, clientY } = e;
        raf.current = requestAnimationFrame(() => {
            const r = el.getBoundingClientRect();
            const px = (clientX - r.left) / r.width - 0.5;
            const py = (clientY - r.top) / r.height - 0.5;
            el.style.setProperty("--rx", `${(-py * 9).toFixed(2)}deg`);
            el.style.setProperty("--ry", `${(px * 12).toFixed(2)}deg`);
            el.style.setProperty("--gx", `${((px + 0.5) * 100).toFixed(1)}%`);
            el.style.setProperty("--gy", `${((py + 0.5) * 100).toFixed(1)}%`);
        });
    }, []);

    const reset = useCallback(() => {
        cancelAnimationFrame(raf.current);
        const el = ref.current;
        if (!el) return;
        el.style.setProperty("--rx", "0deg");
        el.style.setProperty("--ry", "0deg");
    }, []);

    return (
        <Link
            to={page.to}
            className="hero-nav__card"
            ref={ref}
            onPointerMove={handleMove}
            onPointerLeave={reset}
            onBlur={reset}
        >
            <span className="hero-nav__sheen" aria-hidden="true" />
            <span className="hero-nav__icon" aria-hidden="true">
                <Icon size={22} strokeWidth={1.6} />
            </span>
            <span className="hero-nav__body">
                <span className="hero-nav__title">{page.title}</span>
                <span className="hero-nav__desc">{page.desc}</span>
            </span>
            <ArrowUpRight className="hero-nav__arrow" size={18} strokeWidth={1.6} aria-hidden="true" />
        </Link>
    );
}

export default function HeroNav() {
    return (
        <nav className="hero-nav" aria-label="Explore the site">
            {PAGES.map((p) => (
                <NavCard key={p.to} page={p} />
            ))}
        </nav>
    );
}
