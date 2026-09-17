import { useState, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { gsap } from "gsap";
import Lenis from "lenis";

// Components
import Preloader from "./components/Preloader";
import Dock from "./components/Dock";
import { LanguageProvider } from "./context/LanguageContext";

// Pages — split per route so a visitor only downloads the one they open.
// /admin is intentionally absent: it is served by the FastAPI admin panel,
// and a client route of the same name would shadow it in production.
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Projects = lazy(() => import("./pages/Projects"));
const About = lazy(() => import("./pages/About"));
const Inquiry = lazy(() => import("./pages/Inquiry"));

import "./global.css";

function SmoothScroll() {
    useEffect(() => {
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
        });
        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);
        return () => lenis.destroy();
    }, []);
    return null;
}

function AppContent() {
    // Always show preloader once per page-load (clear on mount so it always fires)
    const [showPreloader, setShowPreloader] = useState(true);
    const [isAppReady, setIsAppReady] = useState(false);
    const mainRef = useRef(null);
    const dockRef = useRef(null);

    // Stable identity: Preloader keys its GSAP effect on this callback, so a new
    // function each render would kill and restart the intro timeline mid-flight.
    const handlePreloaderComplete = useCallback(() => {
        setIsAppReady(true);
        sessionStorage.setItem("introPlayed", "true");

        setTimeout(() => setShowPreloader(false), 300);

        gsap.fromTo(mainRef.current,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 1.8, ease: "power3.out", delay: 0.3 }
        );
    }, []);

    // The intro is rAF-driven, so a suspended tab or a stalled timeline would
    // otherwise leave the site permanently blank. Reveal regardless after 4s.
    useEffect(() => {
        const failsafe = setTimeout(() => {
            setIsAppReady(true);
            setShowPreloader(false);
            if (mainRef.current) gsap.set(mainRef.current, { opacity: 1, y: 0 });
        }, 4000);
        return () => clearTimeout(failsafe);
    }, []);

    return (
        <>
            <SmoothScroll />

            {showPreloader && (
                <Preloader onComplete={handlePreloaderComplete} />
            )}

            {isAppReady && <Dock ref={dockRef} />}

            <main
                className="app-container"
                ref={mainRef}
                style={{
                    minHeight: '100vh',
                    position: 'relative',
                    opacity: 0  // GSAP animates this to 1 after preloader completes
                }}
            >
                {isAppReady && (
                    <Suspense fallback={null}>
                        <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/projects" element={<Projects />} />
                            <Route path="/about" element={<About />} />
                            <Route path="/inquiry" element={<Inquiry />} />
                        </Routes>
                    </Suspense>
                )}
            </main>
        </>
    );
}

function App() {
    return (
        <LanguageProvider>
            <Router>
                <AppContent />
            </Router>
        </LanguageProvider>
    );
}

export default App;