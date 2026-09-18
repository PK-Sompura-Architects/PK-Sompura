import { useState, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

// Components
import Preloader from "./components/Preloader";
import Dock from "./components/Dock";
import Footer from "./components/Footer";
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
        // Hijacking the scroll is exactly what reduced-motion asks us not to do,
        // and the native scroller is perfectly good on its own.
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

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
    const dockRef = useRef(null);

    // Stable identity: Preloader registers a listener keyed on this callback,
    // so a new function each render would tear it down mid-sequence.
    const handlePreloaderComplete = useCallback(() => {
        setIsAppReady(true);
        setTimeout(() => setShowPreloader(false), 300);
    }, []);

    // The intro can stall — a backgrounded tab, a failed image, a dropped
    // animationend. Without this the site would stay blank for good.
    useEffect(() => {
        const failsafe = setTimeout(() => {
            setIsAppReady(true);
            setShowPreloader(false);
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

            <main className={`app-container${isAppReady ? " is-ready" : ""}`}>
                {isAppReady && (
                    <Suspense fallback={null}>
                        <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/projects" element={<Projects />} />
                            <Route path="/about" element={<About />} />
                            <Route path="/inquiry" element={<Inquiry />} />
                        </Routes>
                        <Footer />
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