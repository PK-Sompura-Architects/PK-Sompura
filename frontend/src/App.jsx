import { useState, useEffect, useRef } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { gsap } from "gsap";
import Lenis from "lenis";

// Components
import Preloader from "./components/Preloader";
import Dock from "./components/Dock";
import { LanguageProvider } from "./context/LanguageContext";

// Pages
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import About from "./pages/About";
import Inquiry from "./pages/Inquiry";
import AdminPage from "./pages/AdminPage";

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

    const handlePreloaderComplete = () => {
        setIsAppReady(true);
        sessionStorage.setItem("introPlayed", "true");

        // Fade out the preloader smoothly
        setTimeout(() => {
            setShowPreloader(false);
        }, 300);

        // Fade in the main content + dock
        gsap.fromTo(mainRef.current,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 1.8, ease: "power3.out", delay: 0.3 }
        );
    };

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
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/projects" element={<Projects />} />
                        <Route path="/about" element={<About />} />
                        <Route path="/inquiry" element={<Inquiry />} />
                        <Route path="/admin" element={<AdminPage />} />
                    </Routes>
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