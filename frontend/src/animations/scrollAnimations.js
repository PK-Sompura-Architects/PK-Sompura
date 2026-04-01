/**
 * PK Sompura — Scroll Animation Utilities
 * Centralized GSAP ScrollTrigger helpers
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

/**
 * Create a pinned scroll section
 * @param {HTMLElement} trigger - The element to pin
 * @param {Object} options - ScrollTrigger options override
 * @returns {ScrollTrigger}
 */
export function createPinnedScroll(trigger, options = {}) {
    return ScrollTrigger.create({
        trigger,
        start: "top top",
        end: "+=200%",
        pin: true,
        scrub: 1,
        ...options,
    });
}

/**
 * Create a parallax effect on an element
 * @param {HTMLElement} element - The element to parallax
 * @param {number} speed - Parallax speed multiplier (0.3 = slow, 1.0 = normal)
 * @param {HTMLElement} trigger - ScrollTrigger trigger element
 * @returns {gsap.core.Tween}
 */
export function createParallaxLayer(element, speed, trigger) {
    const distance = (1 - speed) * 100; // Higher speed = less movement
    return gsap.fromTo(
        element,
        { y: -distance },
        {
            y: distance,
            ease: "none",
            scrollTrigger: {
                trigger,
                start: "top bottom",
                end: "bottom top",
                scrub: true,
            },
        }
    );
}

/**
 * Fade-in reveal animation triggered on scroll
 * @param {HTMLElement} element - Element to reveal
 * @param {Object} options - Override options
 * @returns {gsap.core.Tween}
 */
export function createScrollReveal(element, options = {}) {
    return gsap.fromTo(
        element,
        {
            opacity: 0,
            y: 40,
        },
        {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: "power2.out",
            scrollTrigger: {
                trigger: element,
                start: "top 85%",
                end: "top 50%",
                toggleActions: "play none none reverse",
                ...options.scrollTrigger,
            },
            ...options,
        }
    );
}

/**
 * Batch kill all ScrollTrigger instances (for cleanup)
 */
export function killAllScrollTriggers() {
    ScrollTrigger.getAll().forEach((st) => st.kill());
}

export { gsap, ScrollTrigger };
