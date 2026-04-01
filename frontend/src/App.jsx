import { useState, useEffect, useRef } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { gsap } from "gsap";
import Lenis from "lenis";

// Components
import Preloader from "./components/Preloader";
import Gate from "./components/Gate";
import Dock from "./components/Dock";
import { LanguageProvider } from "./context/LanguageContext";

// Pages
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import About from "./pages/About";
import Inquiry from "./pages/Inquiry";

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
    // 🔴 TEMPORARILY DISABLED: Forced to false so you see the intro every time you refresh
    const hasSeenIntro = false; 
    
    const [isAppReady, setIsAppReady] = useState(!!hasSeenIntro);
    const [isGateTriggered, setIsGateTriggered] = useState(false);
    const [showGate, setShowGate] = useState(!hasSeenIntro);
    const mainRef = useRef(null);

    const handlePreloaderComplete = () => {
        setIsGateTriggered(true);
        setIsAppReady(true);

        gsap.fromTo(mainRef.current,
            { opacity: 0, scale: 0.95 },
            { opacity: 1, scale: 1, duration: 2.5, ease: "power3.out", delay: 0.5 }
        );

        setTimeout(() => {
            setShowGate(false);
            // 🔴 TEMPORARILY DISABLED:
            // sessionStorage.setItem("introPlayed", "true"); 
        }, 4000); 
    };

    return (
        <>
            <SmoothScroll />
            
            {!isAppReady && !hasSeenIntro && (
                <Preloader onComplete={handlePreloaderComplete} />
            )}

            {showGate && <Gate isTriggered={isGateTriggered} />}

            {/* ✅ FIX: Dock is now OUTSIDE the <main> tag so it won't disappear! */}
            {!showGate && <Dock />}

            <main 
                className="app-container"
                ref={mainRef}
                style={{
                    minHeight: '100vh',
                    position: 'relative',
                    opacity: hasSeenIntro ? 1 : 0 
                }}
            >
                {isAppReady && (
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/projects" element={<Projects />} />
                        <Route path="/about" element={<About />} />
                        <Route path="/inquiry" element={<Inquiry />} />
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