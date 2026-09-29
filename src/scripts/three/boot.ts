// Mounts the three.js scenes over their posters (Handoff §8 PosterFrame). Only reached when scene3d.ts's gate passed.
// Pins are created up front so the page never jumps when a scene mounts later; the three.js chunk itself
// loads only when a scene comes within one viewport, and each canvas renders only while on screen.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export interface SceneState { progress: number; pointer: number; still: boolean }
export interface SceneHandle { canvas: HTMLCanvasElement; resize(w: number, h: number): void; render(): void; dispose(): void }
type Name = 'hero' | 'toolpath' | 'fero';

const loaders: Record<Name, (el: HTMLElement, s: SceneState) => Promise<SceneHandle>> = {
  hero: (el, s) => import('./relief').then((m) => m.default(el, s, 'hero')),
  toolpath: (el, s) => import('./relief').then((m) => m.default(el, s, 'toolpath')),
  fero: (el, s) => import('./fero').then((m) => m.default(el, s)),
};

export function boot(els: HTMLElement[], still?: { name: Name; progress: number }) {
  const pointer = { x: 0 };
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    addEventListener('pointermove', (e) => (pointer.x = (e.clientX / innerWidth) * 2 - 1), { passive: true });
  }

  for (const el of els) {
    const name = el.dataset.scene as Name;
    if (still && still.name !== name) continue;
    const state: SceneState = { progress: still ? still.progress : name === 'toolpath' ? 0 : 0, pointer: 0, still: !!still };

    if (!still) {
      if (name === 'hero') {
        ScrollTrigger.create({ trigger: el, start: 'top top', end: 'bottom top', onUpdate: (st) => (state.progress = st.progress) });
      } else if (name === 'fero') {
        // The stage is pinned by CSS (sticky inside [data-fly]); ScrollTrigger scrubs the progress across the container.
        // Scrub 0.6 (P3). The HTML text follows the same smoothed progress, so words and camera move together.
        gsap.to(state, { progress: 1, ease: 'none', scrollTrigger: { trigger: el.closest('[data-fly]'), start: 'top top', end: 'bottom bottom', scrub: 0.6 },
          onUpdate: () => el.dispatchEvent(new CustomEvent('fly:progress', { detail: state.progress })) });
      } else {
        // Toolpath: pinned by CSS (CncCut.astro); the motion layer scrubs the machine order and hands the progress on.
        el.addEventListener('cnc:progress', (e) => (state.progress = (e as CustomEvent<number>).detail));
      }
    }

    let handle: SceneHandle | null = null;
    let visible = false, raf = 0;
    // Frame-rate guard: time the first ~90 visible frames; if the scene can't hold 30 fps, hand back to the poster.
    const times: number[] = [];
    let last = 0;
    const loop = (now: number) => {
      raf = 0;
      if (!handle || !visible || document.hidden) { last = 0; return; }
      state.pointer = pointer.x;
      handle.render();
      if (last && times.length < 100) {
        times.push(now - last);
        if (times.length === 100) {
          const avg = times.slice(10).reduce((a, b) => a + b, 0) / 90;
          el.dataset.fps = String(Math.round(1000 / avg));
          if (avg > 1000 / 30) { fallBack(); return; }
        }
      }
      last = now;
      raf = requestAnimationFrame(loop);
    };
    const fallBack = () => {
      el.removeAttribute('data-3d-live');
      el.setAttribute('data-3d-fallback', '');
      handle?.canvas.remove();
      handle?.dispose();
      handle = null;
    };
    const kick = () => { if (!raf && visible && handle && !still) raf = requestAnimationFrame(loop); };
    document.addEventListener('visibilitychange', kick);

    const mountNow = async () => {
      handle = await loaders[name](el, state);
      const c = handle.canvas;
      c.className = 'absolute inset-0 h-full w-full';
      c.setAttribute('aria-hidden', 'true');
      c.style.opacity = '0';
      el.append(c);
      // Resizing clears the WebGL buffer, so draw again right away (no blank frame, and stills stay valid).
      const size = () => { handle!.resize(el.clientWidth, el.clientHeight); handle!.render(); };
      size();
      new ResizeObserver(size).observe(el);
      handle.render(); // first frame, then crossfade poster → canvas (600 ms, ease-out)
      requestAnimationFrame(() => {
        c.style.transition = 'opacity 600ms cubic-bezier(0.22, 1, 0.36, 1)';
        c.style.opacity = '1';
        el.setAttribute('data-3d-live', '');
        if (still) el.setAttribute('data-still-ready', '');
      });
      kick();
    };

    if (still) { visible = true; mountNow(); continue; }
    // Load within one viewport; render only while actually on screen.
    const near = new IntersectionObserver(([e]) => { if (e.isIntersecting) { near.disconnect(); mountNow(); } }, { rootMargin: '300% 0px' });
    near.observe(el);
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; kick(); }).observe(el);
  }
  ScrollTrigger.refresh();
}
