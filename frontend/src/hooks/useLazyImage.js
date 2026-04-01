import { useRef, useState, useEffect } from "react";

/**
 * useLazyImage — Intersection Observer-based lazy loading hook
 * Returns [ref, isVisible] to conditionally load images/content
 *
 * @param {Object} options - IntersectionObserver options
 * @param {string} options.rootMargin - Preload margin (default: "200px")
 * @param {number} options.threshold - Visibility threshold (default: 0)
 * @returns {[React.RefObject, boolean]}
 */
export function useLazyImage({ rootMargin = "200px", threshold = 0 } = {}) {
    const ref = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        // If IntersectionObserver isn't supported, show immediately
        if (!("IntersectionObserver" in window)) {
            setIsVisible(true);
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(element);
                }
            },
            { rootMargin, threshold }
        );

        observer.observe(element);

        return () => {
            observer.unobserve(element);
        };
    }, [rootMargin, threshold]);

    return [ref, isVisible];
}

export default useLazyImage;
