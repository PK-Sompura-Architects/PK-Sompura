import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import "./Preloader.css";

function Preloader({ onComplete }) {
    const containerRef = useRef(null);
    const logoRef = useRef(null);
    const [isFinished, setIsFinished] = useState(false);

    useEffect(() => {
        // Prevent scrolling during the intro
        document.body.style.overflow = "hidden";

        const tl = gsap.timeline({
            onComplete: () => {
                setIsFinished(true);
                document.body.style.overflow = "auto";
                if (onComplete) onComplete();
            }
        });

        // Fast, 2-second cinematic logo sequence
        tl.fromTo(logoRef.current,
            { opacity: 0, scale: 0.95, filter: "blur(5px)" },
            { opacity: 1, scale: 1, filter: "blur(0px)", duration: 1.0, ease: "power2.out" }
        ).to(logoRef.current, {
            opacity: 0,
            scale: 1.05,
            filter: "blur(5px)",
            duration: 0.7,
            delay: 0.3, // Hold visibility for a split second
            ease: "power2.inOut"
        }).to(containerRef.current, {
            opacity: 0,
            duration: 0.3,
            ease: "power2.inOut"
        }, "-=0.2");

        return () => tl.kill(); 
    }, [onComplete]);

    if (isFinished) return null;

    return (
        <div className="preloader-container" ref={containerRef}>
            <div className="preloader-logo-wrapper" ref={logoRef} style={{ opacity: 0 }}>
                <img src="/LOGO-3.png" alt="P.K. Sompura Logo" className="preloader-logo" />
            </div>
        </div>
    );
}

export default Preloader;
