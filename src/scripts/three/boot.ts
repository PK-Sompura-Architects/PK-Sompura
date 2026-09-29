// Mounts the three.js scenes over their posters (Handoff §8 PosterFrame). Only reached when scene3d.ts's gate passed.
// Pins are created up front so the page never jumps when a scene mounts later; the three.js chunk itself
// loads only when a scene comes within one viewport, and each canvas renders only while on screen.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export interface SceneState { progress: number; pointer: number; still: boolean }
export interface SceneHandle { canvas: HTMLCanvasElement; resize(w: number, h: number): void; render(): void; dispose(): void }
type Name = 'hero' | 'toolpath' | 'mountain-k3';

const loaders: Record<Name, (el: HTMLElement, s: SceneState) => Promise<SceneHandle>> = {
  hero: (el, s) => import('./relief').then((m) => m.default(el, s, 'hero')),
  toolpath: (el, s) => import('./relief').then((m) => m.default(el, s, 'toolpath')),
  'mountain-k3': (el, s) => import('./mountain').then((m) => m.default(el, s)),
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
      } else {
        // Toolpath: pinned 150vh, cutter scrubbed 0 → 1. Mountain: pinned 250vh, K1 → K4.
        ScrollTrigger.create({
          trigger: el, pin: true, start: 'center center', end: name === 'toolpath' ? '+=150%' : '+=250%', scrub: true,
          onUpdate: (st) => (state.progress = st.progress),
        });
      }
    }

    let handle: SceneHandle | null = null;
    let visible = false, raf = 0;
    const loop = () => {
      raf = 0;
      if (!handle || !visible || document.hidden) return;
      state.pointer = pointer.x;
      handle.render();
      raf = requestAnimationFrame(loop);
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
    const near = new IntersectionObserver(([e]) => { if (e.isIntersecting) { near.disconnect(); mountNow(); } }, { rootMargin: '100% 0px' });
    near.observe(el);
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; kick(); }).observe(el);
  }
  ScrollTrigger.refresh();
}
