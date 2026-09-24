import { lazy, Suspense } from "react";
import ScrollReveal from "../components/ScrollReveal";
import WorkingSitesSection from '../components/WorkingSitesSection';
import DashboardGalleries from '../components/DashboardGalleries';
import "./Dashboard.css";

// Split out so the 27 kB boundary path data is not part of the dashboard's own
// chunk. It lands in a chunk shared with the full map on /projects, so a
// visitor who sees both downloads the outline once.
const MapPreview = lazy(() => import('../components/MapPreview'));

function Dashboard() {
    const scrollToNext = () => {
        document.getElementById('working-sites-section')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="dashboard-container">
            {/* The mark, fixed and centred, travelling the length of the page
                as you scroll: large and central behind the name, then smaller
                and off to the side as the sections go by.

                A direct child of the container, not of the hero, because the
                hero has `overflow: clip` and that clips a fixed descendant.

                Driven by a CSS scroll timeline rather than a JS scroll
                listener or a spring on a scroll value. It costs no JavaScript
                and no bytes, and because Lenis scrolls the real document the
                animation inherits its smoothing for free -- there is no second
                easing layer to tune against the first. */}
            <img
                className="dashboard-watermark"
                src="/logo-mark.webp"
                alt=""
                aria-hidden="true"
                width="553"
                height="451"
                decoding="async"
            />

            {/* 1. Landing Hero — the mark centred behind the name.
                The three page-redirector cards that used to sit on the right
                were removed: the Dock already navigates the whole site, so
                they were a second navigation competing with the first. */}
            <section className="dashboard-hero-wrapper">

                <div className="dashboard-bg" aria-hidden="true" />

                <div className="dashboard-text-overlay">
                    <ScrollReveal>
                        <h1 className="sompura-title">P.K. SOMPURA</h1>
                    </ScrollReveal>
                    <ScrollReveal delay={120}>
                        <p className="sompura-subtitle">TEMPLE ARCHITECT &amp; CONTRACTOR</p>
                    </ScrollReveal>
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
