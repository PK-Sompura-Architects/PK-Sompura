import { lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { createPortal } from "react-dom";
import ScrollReveal from "../components/ScrollReveal";
import WorkingSitesSection from '../components/WorkingSitesSection';
import DashboardGalleries from '../components/DashboardGalleries';
import "./Dashboard.css";

// Split out so the 27 kB boundary path data is not part of the dashboard's own
// chunk. It lands in a chunk shared with the full map on /projects, so a
// visitor who sees both downloads the outline once.
const MapPreview = lazy(() => import('../components/MapPreview'));
const ServicesSection = lazy(() => import('../components/ServicesSection'));

function Dashboard() {
    const scrollToNext = () => {
        document.getElementById('working-sites-section')?.scrollIntoView({ behavior: 'smooth' });
    };

    // The mark is portalled to <body>, not rendered in place.
    //
    // A `position: fixed` element is positioned against the viewport only if no
    // ancestor is a containing block for it, and `main.app-container` carries a
    // transform for its entrance. That makes it the containing block, so
    // `top: 50%` resolved against the full 3002px page instead of the 768px
    // viewport and the mark sat a page and a half down, out of sight. Measured:
    // computed `top` was 1501px for a rule that reads `top: 50%`.
    //
    // A portal puts it outside <main> so no ancestor transform can ever capture
    // it again -- which matters because the entrance transform is exactly the
    // kind of thing someone adds back later without connecting the two.
    //
    // The mark is static: centred, level, and the same at every scroll
    // position. A scroll-linked journey was tried twice and neither worked
    // here. A CSS scroll timeline is inert because `body` has `overflow-x:
    // clip`, so the viewport's overflow propagates from body and `scroll(root)`
    // watches an html element with no scrollport -- measured, the timeline
    // reported currentTime null at every position. A JS fallback did not
    // attach either. Removing that clip is the change that once made the whole
    // site unscrollable, so it is not worth spending on a decorative effect.
    const mark = createPortal(
        <img
            className="dashboard-watermark"
            src="/logo-symbol.webp"
            alt=""
            aria-hidden="true"
            width="427"
            height="537"
            decoding="async"
        />,
        document.body
    );

    return (
        <div className="dashboard-container">
            {mark}
            {/* 1. Hero — photography-led.
                The temple is the product, so it leads. The wordmark used to be
                the whole hero, centred on a gradient, which said the company's
                name and nothing about the work. */}
            <section className="dashboard-hero-wrapper">

                <div className="dashboard-bg" aria-hidden="true" />

                <div className="hero-copy">
                    <ScrollReveal>
                        <span className="hero-eyebrow">
                            Tradition <span aria-hidden="true">·</span> Architecture <span aria-hidden="true">·</span> Devotion
                        </span>
                    </ScrollReveal>
                    <ScrollReveal delay={90}>
                        <h1 className="sompura-title">
                            Temples raised<br />by <span className="hero-accent">three generations</span>
                        </h1>
                    </ScrollReveal>
                    <ScrollReveal delay={180}>
                        <p className="sompura-subtitle">
                            P.K. Sompura — temple architect and contractor, Palitana.
                            Drawn, carved and built by one family.
                        </p>
                    </ScrollReveal>
                    <ScrollReveal delay={260}>
                        <Link className="hero-cta" to="/inquiry">
                            Request temple services
                            <span className="hero-cta-icon" aria-hidden="true">
                                <ArrowRight size={16} strokeWidth={1.75} />
                            </span>
                        </Link>
                    </ScrollReveal>
                </div>

                {/* The finished work, bleeding off the right edge. */}
                <div className="hero-media">
                    <img
                        src="/media/work-sites/carved-torana.webp"
                        alt="A carved stone torana gateway built by P.K. Sompura"
                        width="1200"
                        height="900"
                        fetchPriority="high"
                        decoding="async"
                    />
                </div>

                <button
                    type="button"
                    className="dashboard-scroll-indicator"
                    onClick={scrollToNext}
                    aria-label="Scroll to the workshop section"
                >
                    <span className="scroll-text">See the work</span>
                    <span className="scroll-chevron-wrapper" aria-hidden="true">
                        <span className="scroll-chevron"></span>
                        <span className="scroll-chevron"></span>
                    </span>
                </button>
            </section>

            {/* 2. What the company does. */}
            <Suspense fallback={null}>
                <ServicesSection />
            </Suspense>

            {/* 2. Tools, Machines & Working Sites.
                The lineage section used to sit above this one; it lives on
                /about now, so the dashboard does not duplicate it. */}
            <div id="working-sites-section">
                <WorkingSitesSection />
            </div>

            {/* 3. Where the work is — a glance, linking to the full map.
                Renders nothing until coordinates exist. */}
            <div id="map-preview-section">
                <Suspense fallback={null}>
                    <MapPreview />
                </Suspense>
            </div>

            {/* 4. Operations & Galleries Section */}
            <div id="operations-section">
                <DashboardGalleries />
            </div>
        </div>
    );
}

export default Dashboard;
