import { useEffect, useRef } from "react";
import "./Preloader.css";

/**
 * Intro logo sequence. Driven by CSS keyframes rather than GSAP: this runs on
 * every first paint, and importing GSAP here pulled 27kB gzip into the initial
 * bundle for two fades. GSAP still ships, but only on the routes that use it.
 */
function Preloader({ onComplete }) {
    const containerRef = useRef(null);

    useEffect(() => {
        document.body.style.overflow = "hidden";

        const el = containerRef.current;
        const finish = () => {
            document.body.style.overflow = "auto";
            onComplete?.();
        };

        // The container's fade-out is the last animation in the sequence.
        el?.addEventListener("animationend", finish, { once: true });

        return () => {
            el?.removeEventListener("animationend", finish);
            document.body.style.overflow = "auto";
        };
    }, [onComplete]);

    return (
        <div className="preloader-container" ref={containerRef}>
            <div className="preloader-logo-wrapper">
                <img src="/LOGO-3.png" alt="P.K. Sompura" className="preloader-logo" />
            </div>
        </div>
    );
}

export default Preloader;
