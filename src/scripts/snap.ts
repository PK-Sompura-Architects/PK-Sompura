// One-time snap for the CNC trace and the Fero video: when the visitor scrolls down into the section, the page eases
// (400 ms) so the piece fills the screen, then the visitor is free again: scrolling is never blocked, slowed or held.
// No snap when scrolling up, after keyboard or anchor navigation, during a fast fling, or with reduced motion.
// A touch drag snaps when the finger lifts, never under it.
import type Lenis from 'lenis';

let lenis: Lenis | undefined;
export const useLenis = (l: Lenis) => { lenis = l; };

const FLING = 2.5;                    // px per ms: faster than this is a fling, left alone
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
let lastY = scrollY, lastT = 0, vel = 0, down = false, navAt = -1e9, touching = false;
let pending: HTMLElement | null = null;

addEventListener('scroll', () => {
  const now = performance.now(), dy = scrollY - lastY;
  if (dy) down = dy > 0;
  vel = now - lastT > 120 ? Math.abs(dy) / 16 : 0.6 * vel + (0.4 * Math.abs(dy)) / Math.max(1, now - lastT);
  lastY = scrollY; lastT = now;
}, { passive: true });
const NAV_KEYS = new Set(['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' ']);
addEventListener('keydown', (e) => { if (NAV_KEYS.has(e.key)) navAt = performance.now(); }, true);
addEventListener('click', (e) => { if ((e.target as Element).closest?.('a[href*="#"]')) navAt = performance.now(); }, true);
addEventListener('hashchange', () => { navAt = performance.now(); });
addEventListener('touchstart', () => { touching = true; }, { passive: true, capture: true });
addEventListener('touchend', () => {
  touching = false;
  const el = pending; pending = null;
  if (el) setTimeout(() => snap(el), 0);
}, { passive: true, capture: true });

const easeOut = (t: number) => 1 - (1 - t) ** 3;

export function snap(el: HTMLElement) {
  const now = performance.now();
  const fast = now - lastT < 120 && vel > FLING;
  if (reduce.matches || !down || now - navAt < 1500 || fast) return;
  if (touching) { pending = el; return; }
  const bar = innerWidth < 1024 ? 64 : 0; // the sticky nav bar below desktop
  const r = el.getBoundingClientRect(), room = innerHeight - bar;
  if (r.bottom <= 0 || r.top >= innerHeight) return;
  // Fits below the bar: centred there. Taller (the full-screen Fero stage): its top at the top of the screen.
  const y = Math.round(scrollY + r.top - (r.height <= room ? bar + (room - r.height) / 2 : 0));
  if (Math.abs(y - scrollY) < 2) return;
  if (lenis) return lenis.scrollTo(y, { duration: 0.4, easing: easeOut });
  // No smooth-scroll layer yet: a 400 ms tween that any wheel, touch or key input cancels.
  const y0 = scrollY, t0 = now;
  let stop = false;
  const cancel = () => { stop = true; };
  const opts = { once: true, passive: true, capture: true } as const;
  for (const ev of ['wheel', 'touchstart', 'keydown', 'mousedown']) addEventListener(ev, cancel, opts);
  const step = (t: number) => {
    const k = Math.min(1, (t - t0) / 400);
    if (stop) return;
    scrollTo({ top: y0 + (y - y0) * easeOut(k), behavior: 'instant' });
    if (k < 1) requestAnimationFrame(step);
    else for (const ev of ['wheel', 'touchstart', 'keydown', 'mousedown']) removeEventListener(ev, cancel, opts);
  };
  requestAnimationFrame(step);
}
