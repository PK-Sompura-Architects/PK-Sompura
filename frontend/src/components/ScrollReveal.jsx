import { useEffect, useRef, useState } from "react";

/**
 * ScrollReveal — animates children into view as they enter the viewport.
 * Props:
 *   baseOpacity   {number} 0–1  Starting opacity (default 0)
 *   blurStrength  {number}      Starting blur in px (default 0)
 *   baseRotation  {number}      Starting rotation in deg (default 0)
 *   translateY    {number}      Starting Y offset in px (default 24)
 *   duration      {number}      Transition duration in ms (default 700)
 *   delay         {number}      Transition delay in ms (default 0)
 *   threshold     {number}      IntersectionObserver threshold (default 0.15)
 */
function ScrollReveal({
    children,
    baseOpacity = 0,
    blurStrength = 0,
    baseRotation = 0,
    translateY = 24,
    duration = 700,
    delay = 0,
    threshold = 0.15,
}) {
    const ref = useRef(null);
    // Start visible when motion is reduced: the reveal is decoration, and
    // hiding content behind an animation nobody wants is worse than no reveal.
    const [visible, setVisible] = useState(
        () => typeof window !== "undefined" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    observer.disconnect();
                }
            },
            { threshold }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [threshold]);

    const hiddenStyle = {
        opacity: baseOpacity,
        filter: blurStrength ? `blur(${blurStrength}px)` : "none",
        transform: `translateY(${translateY}px) rotate(${baseRotation}deg)`,
        transition: `opacity ${duration}ms ease ${delay}ms, filter ${duration}ms ease ${delay}ms, transform ${duration}ms ease ${delay}ms`,
    };

    const visibleStyle = {
        opacity: 1,
        filter: "none",
        transform: "translateY(0px) rotate(0deg)",
        transition: `opacity ${duration}ms ease ${delay}ms, filter ${duration}ms ease ${delay}ms, transform ${duration}ms ease ${delay}ms`,
    };

    return (
        <div ref={ref} style={visible ? visibleStyle : hiddenStyle}>
            {children}
        </div>
    );
}

export default ScrollReveal;
