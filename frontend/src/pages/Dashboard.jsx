import HeroNav from "../components/HeroNav";
import ScrollReveal from "../components/ScrollReveal";
import LineageSection from '../components/LineageSection';
import WorkingSitesSection from '../components/WorkingSitesSection';
import DashboardGalleries from '../components/DashboardGalleries';
import "./Dashboard.css";

function Dashboard() {
    const scrollToLineage = () => {
        document.getElementById('lineage-section')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="dashboard-container">
            {/* 1. Landing Hero Section */}
            <section className="dashboard-hero-wrapper">
                
                {/* Left Side Text */}
                <div className="dashboard-text-overlay">
                    <ScrollReveal baseOpacity={0} enableBlur={true} blurStrength={10} baseRotation={5}>
                        <h1 className="sompura-title">P.K. SOMPURA</h1>
                    </ScrollReveal>
                    <ScrollReveal baseOpacity={0} enableBlur={true} blurStrength={5}>
                        <p className="sompura-subtitle">TEMPLE ARCHITECT & CONTRACTOR</p>
                    </ScrollReveal>
                </div>

                <div className="dashboard-bg" aria-hidden="true" />

                <img
                    className="dashboard-watermark"
                    src="/logo-mark.webp"
                    alt=""
                    aria-hidden="true"
                    width="553"
                    height="451"
                    decoding="async"
                />

                <HeroNav />

                {/* Animated Scroll Down Indicator */}
                <div className="dashboard-scroll-indicator" onClick={scrollToLineage} role="button">
                    <span className="scroll-text">Discover Legacy</span>
                    <div className="scroll-chevron-wrapper">
                        <div className="scroll-chevron"></div>
                        <div className="scroll-chevron"></div>
                    </div>
                </div>
            </section>

            {/* 2. Embedded Lineage Section */}
            <div id="lineage-section" className="dashboard-about-wrapper">
                <LineageSection />
            </div>

            {/* 3. Tools, Machines & Working Sites */}
            <div id="working-sites-section">
                <WorkingSitesSection />
            </div>

            {/* 4. Operations & Galleries Section */}
            <div id="operations-section">
                <DashboardGalleries />
            </div>
        </div>
    );
}

export default Dashboard;
