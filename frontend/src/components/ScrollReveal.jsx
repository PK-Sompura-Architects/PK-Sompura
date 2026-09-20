import { useEffect, useRef, useState } from "react";

/**
 * ScrollReveal — fades children in as they enter the viewport.
 *
 * Deliberately a fade and a short lift, nothing more. It used to also animate
 * `filter: blur()` and a rotation, which forced a full repaint every frame and
 * was a measured cause of the scroll jank on the dashboard. A reveal is
 * decoration; it does not get to cost the page its frame budget.
 *
 * Props:
 *   baseOpacity  {number} 0–1  Starting opacity (default 0)
 *   translateY   {number}      Starting Y offset in px (default 12)
 *   duration     {number}      Transition duration in ms (default 500)
 *   delay        {number}      Transition delay in ms (default 0)
 *   threshold    {number}      IntersectionObserver threshold (default 0.15)
 */
function ScrollReveal({
    children,
    baseOpacity = 0,
    translateY = 12,
    duration = 500,
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

    // Only transform and opacity, so the compositor handles the whole thing.
    const style = {
        opacity: visible ? 1 : baseOpacity,
        transform: `translateY(${visible ? 0 : translateY}px)`,
        transition: `opacity ${duration}ms var(--ease-out-expo) ${delay}ms, transform ${duration}ms var(--ease-out-expo) ${delay}ms`,
    };

    return <div ref={ref} style={style}>{children}</div>;
}

export default ScrollReveal;
