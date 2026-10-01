// The first play of the CNC trace and the Fero video: the piece is brought to fit the screen, then the page is held
// still until it ends, so nothing is missed by stopping short or overshooting. Replays never hold. Escape, or the
// time limit, lets go early.
import type Lenis from 'lenis';

let lenis: Lenis | undefined;
export const useLenis = (l: Lenis) => { lenis = l; };

export function hold(el: HTMLElement, onReady: () => void, maxMs: number) {
  const bar = innerWidth < 1024 ? 64 : 0; // the sticky nav bar below desktop
  const r = el.getBoundingClientRect(), room = innerHeight - bar;
  // Fits below the bar: centred there. Taller (the full-screen Fero stage): its top at the top of the screen.
  const y = Math.round(scrollY + r.top - (r.height <= room ? bar + (room - r.height) / 2 : 0));
  const html = document.documentElement;
  html.classList.add('scroll-held');
  const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') release(); };
  const timer = setTimeout(release, maxMs);
  addEventListener('keydown', esc);
  function release() {
    clearTimeout(timer); removeEventListener('keydown', esc);
    if (!html.classList.contains('scroll-held')) return;
    html.classList.remove('scroll-held');
    if (!document.querySelector('dialog[open]')) lenis?.start();
  }
  if (lenis) { lenis.stop(); lenis.scrollTo(y, { force: true, lock: true, duration: 0.7, onComplete: () => onReady() }); }
  else { scrollTo({ top: y, behavior: 'smooth' }); setTimeout(onReady, 700); }
  return release;
}
