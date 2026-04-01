import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import "./Preloader.css";

const deities = [
    { id: "ganesha", text: "શ્રી ગણેશાય નમઃ" },
    { id: "saraswati", text: "ૐ સરસ્વતીયે નમઃ" },
    { id: "lakshmi", text: "ૐ મહાલક્ષ્મીયે નમઃ" },
    { id: "vishwakarma", text: "ૐ વિશ્વકર્મણે નમઃ" },
    { id: "mahakali", text: "શ્રી મહાકાળી નમઃ" }
];

function Preloader({ onComplete }) {
    const containerRef = useRef(null);
    const textRefs = useRef([]);
    const logoRef = useRef(null);
    const [isFinished, setIsFinished] = useState(false);

    useEffect(() => {
        // Prevent scrolling during sequence
        document.body.style.overflow = "hidden";

        const tl = gsap.timeline({
            onComplete: () => {
                setIsFinished(true);
                // Allow scrolling after finish
                document.body.style.overflow = "auto";
                if (onComplete) onComplete();
            }
        });

        // 1. Sequence Deities (Fade In -> Fade Out -> Next)
        deities.forEach((deity, index) => {
            tl.fromTo(textRefs.current[index], 
                { opacity: 0, y: 15, filter: "blur(8px)" },
                { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.9, ease: "power2.out" }
            )
            // Hold and move slightly up before fade out
            .to(textRefs.current[index], {
                opacity: 0, y: -15, filter: "blur(8px)", duration: 0.7, ease: "power2.in"
            }, "+=0.3"); // Hold for 0.3s
        });

        // 2. Reveal the massive centralized Sompura Logo
        tl.fromTo(logoRef.current,
            { opacity: 0, scale: 0.9, filter: "blur(15px)" },
            { opacity: 1, scale: 1, filter: "blur(0px)", duration: 1.6, ease: "power3.out" },
            "+=0.2" // Slight delay after deities finish
        )
        // Hold the logo on screen (The main moment)
        .to({}, { duration: 1.5 }) 
        
        // 3. Cinematic Fade Out to reveal the Marble Gate
        .to(containerRef.current, {
            opacity: 0,
            duration: 1.3,
            ease: "power2.inOut"
        });

        return () => tl.kill(); // Cleanup GSAP
    }, [onComplete]);

    if (isFinished) return null;

    return (
        <div className="preloader-container" ref={containerRef}>
            {/* Blessings */}
            <div className="preloader-deities">
                {deities.map((deity, i) => (
                    <h2 key={deity.id} ref={el => textRefs.current[i] = el} className="deity-text">
                        {deity.text}
                    </h2>
                ))}
            </div>

            {/* The finalized, centralized logo (Make sure it's transparent!) */}
            <div className="preloader-logo-wrapper" ref={logoRef}>
                <img src="/LOGO-3.png" alt="P.K. Sompura Logo" className="preloader-logo" />
            </div>

            {/* Removed Progress Bar HTML */}
        </div>
    );
}

export default Preloader;