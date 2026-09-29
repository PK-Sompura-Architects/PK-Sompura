// Runs `fn` once the page has finished loading and the main thread is idle, so optional JS (motion, 3D) never
// competes with the fonts, CSS and hero image for bandwidth or CPU before LCP.
export function afterLoad(fn: () => void) {
  const idle = () => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 2000 }) : setTimeout(fn, 200));
  document.readyState === 'complete' ? idle() : addEventListener('load', idle, { once: true });
}
