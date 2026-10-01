// Motion layer (phase 4). Loaded at idle by motion.ts, never when prefers-reduced-motion is set.
// Each effect follows the React Bits component named on the boards (Handoff §9) with the same GSAP calls and
// timings, applied to the server-rendered markup so headings stay real HTML and the hero h1 stays static.
// Rule: anything already on screen when this runs is left as it is (no flash); only content below is animated in.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import { useLenis } from './scroll-hold';

gsap.registerPlugin(ScrollTrigger, SplitText);

const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => [...root.querySelectorAll<T>(sel)];
const below = (el: Element, frac: number) => el.getBoundingClientRect().top > innerHeight * frac;

// ── Lenis smooth scroll, driven by GSAP's ticker so ScrollTrigger stays in sync (Board 01 §6: duration 1.1).
const lenis = new Lenis({ duration: 1.1, anchors: { offset: innerWidth < 1024 ? -64 : 0 } });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
useLenis(lenis);
// Stop smooth scrolling while any modal dialog (menu, filter sheet) is open, or a first play holds the page.
new MutationObserver(() => ($$('dialog[open]').length || document.documentElement.classList.contains('scroll-held') ? lenis.stop() : lenis.start()))
  .observe(document.body, { subtree: true, attributes: true, attributeFilter: ['open'] });

// ── Split Text (§5, §7, §8 headings): lines rise y 40% → 0 with opacity, 0.8 s power3.out, 80 ms stagger, at 75%.
for (const el of $$('[data-split]')) {
  if (!below(el, 0.75)) continue;
  const cut = el.classList.contains('text-cut');
  const split = SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: cut ? 'split-line text-cut' : 'split-line' }); // masks: .split-line-mask (global.css)
  if (cut) el.classList.remove('text-cut'); // the cut texture moves onto each line, so clipping survives the transform
  gsap.from(split.lines, {
    yPercent: 40, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08,
    scrollTrigger: { trigger: el, start: 'top 75%', once: true },
  });
}

// ── Masked Heading (§4, TypeCard page): the texture fill wipes up through the letters, 1.1 s power3.out.
for (const el of $$('[data-masked]')) {
  const onLoad = el.dataset.masked === 'load';
  if (!onLoad && !below(el, 0.8)) continue;
  el.classList.add('wipe');
  gsap.fromTo(el, { '--wipe': '0%' }, {
    '--wipe': '100%', duration: 1.1, ease: 'power3.out',
    ...(onLoad ? { delay: 0.1 } : { scrollTrigger: { trigger: el, start: 'top 80%', once: true } }),
  });
}

// ── Scroll Reveal (§2): words go deep slate → navy, scrubbed from the paragraph top at 80% to its bottom at 35%.
for (const el of $$('[data-scroll-reveal]')) {
  const split = SplitText.create(el, { type: 'words', aria: 'none' });
  gsap.fromTo(split.words, { color: '#52606B' }, {
    color: '#262654', ease: 'none', stagger: 0.05,
    scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 35%', scrub: true },
  });
}

// ── Count Up (§3): 0 → final at 50% in view, once, 1.6 s easeOut, 120 ms stagger. Final values stay in the HTML.
const counters = $$('[data-count]');
if (counters.length && below(counters[0], 0.5)) {
  const vals = counters.map((el) => ({ el, n: Number(el.dataset.count), v: { x: 0 } }));
  vals.forEach(({ el }) => (el.textContent = '0'));
  ScrollTrigger.create({
    trigger: counters[0], start: 'center bottom', once: true,
    onEnter: () => vals.forEach(({ el, n, v }, i) =>
      gsap.to(v, { x: n, duration: 1.6, ease: 'power2.out', delay: i * 0.12, onUpdate: () => (el.textContent = String(Math.round(v.x))) })),
  });
}

// ── Photo reveal (§4, project pages): the arch/rect mask grows from the bottom, 0.9 s power2.out, 120 ms stagger.
const photos = $$('[data-reveal-photo]').filter((el) => below(el, 0.85));
if (photos.length) gsap.set(photos, { clipPath: 'inset(100% 0% 0% 0%)' });
if (photos.length) ScrollTrigger.batch(photos, {
  start: 'top 85%', once: true,
  onEnter: (batch) => gsap.to(batch, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: 'power2.out', stagger: 0.12 }),
});

// ── Card rise (§7): fade and rise 24 px, 0.6 s power2.out, 80 ms stagger.
const cards = $$('[data-rise]').filter((el) => below(el, 0.9));
if (cards.length) gsap.set(cards, { opacity: 0, y: 24 });
if (cards.length) ScrollTrigger.batch(cards, {
  start: 'top 90%', once: true,
  onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', stagger: 0.08 }),
});

// ── §6 ground: sand → night crossfade over 40vh, scrubbed, before the Fero chapter.
const fero = document.getElementById('fero-works');
if (fero) {
  gsap.fromTo(fero, { backgroundColor: '#F4EFE6' }, {
    backgroundColor: '#0E0E1F', ease: 'none',
    scrollTrigger: { trigger: fero, start: 'top bottom', end: 'top 60%', scrub: true },
  });
}

// ── Scroll Stack (§6, desktop): plates stick at 120 px (CSS); the plate underneath scales to 0.96 and dims to 80%,
//    only while the next plate slides over it (from touching its bottom edge to covering it). fromTo, because GSAP
//    would tween filter up from brightness(0) when starting from 'none'.
if (matchMedia('(min-width: 1024px)').matches) {
  const plates = $$('[data-stack] > li');
  plates.slice(1).forEach((plate, i) => {
    gsap.fromTo(plates[i], { scale: 1, filter: 'brightness(1)' }, {
      scale: 0.96, filter: 'brightness(0.8)', ease: 'none', transformOrigin: '50% 0%',
      scrollTrigger: { trigger: plate, start: () => `top ${120 + plates[i].offsetHeight}px`, end: 'top 120px', scrub: true, invalidateOnRefresh: true },
    });
  });
}

// ── Flowing Menu (register rows, desktop): the navy band slides in from the edge the pointer entered,
//    0.6 s expo.out; the strip loops at 40 px/s; exit reverses in 0.4 s. Keyboard focus keeps the static band (CSS).
const fm = new WeakMap<HTMLElement, gsap.core.Tween>();
const edge = (row: HTMLElement, e: MouseEvent) => (e.clientY - row.getBoundingClientRect().top < row.offsetHeight / 2 ? -101 : 101);
document.documentElement.classList.add('fm-js');
document.addEventListener('mouseover', (e) => {
  const row = (e.target as Element).closest<HTMLElement>('.register-row');
  if (!row || row.contains(e.relatedTarget as Node)) return;
  const band = row.querySelector<HTMLElement>('.band');
  const track = row.querySelector<HTMLElement>('.band-track');
  if (!band || !track) return;
  // y: 0 — GSAP would otherwise read the CSS translateY(101%) resting state as a pixel offset.
  gsap.fromTo(band, { y: 0, yPercent: edge(row, e) }, { y: 0, yPercent: 0, duration: 0.6, ease: 'expo.out', overwrite: true });
  const half = track.scrollWidth / 2;
  fm.get(track)?.kill();
  fm.set(track, gsap.fromTo(track, { x: 0 }, { x: -half, duration: half / 40, ease: 'none', repeat: -1 }));
});
document.addEventListener('mouseout', (e) => {
  const row = (e.target as Element).closest<HTMLElement>('.register-row');
  if (!row || row.contains(e.relatedTarget as Node)) return;
  const band = row.querySelector<HTMLElement>('.band');
  const track = row.querySelector<HTMLElement>('.band-track');
  if (!band) return;
  gsap.to(band, { y: 0, yPercent: edge(row, e), duration: 0.4, ease: 'power2.in', overwrite: true, onComplete: () => { track && fm.get(track)?.kill(); } });
});

// ── Staggered Menu (mobile nav, Board 04): pre-layers stone → navy, then the night panel, each 0.5 s power4.out,
//    70 ms apart; items rise through a line mask, 0.5 s power4.out, 60 ms apart from 200 ms. Close reverses in 0.45 s.
const menu = document.getElementById('site-menu') as HTMLDialogElement | null;
if (menu) {
  const layers = $$('[data-menu-layer]', menu);
  const items = $$('[data-menu-item]', menu);
  const open = () => {
    if (!menu.open) menu.showModal();
    gsap.timeline()
      .fromTo(layers, { xPercent: 100 }, { xPercent: 0, duration: 0.5, ease: 'power4.out', stagger: 0.07 })
      .fromTo(items, { yPercent: 100 }, { yPercent: 0, duration: 0.5, ease: 'power4.out', stagger: 0.06 }, 0.2);
  };
  const close = () => gsap.to([...layers].reverse(), {
    xPercent: 100, duration: 0.45, ease: 'power3.in', stagger: 0.05, onComplete: () => menu.close(),
  });
  // Take over from the native invoker commands so the panel can animate both ways.
  for (const b of $$<HTMLButtonElement>('[commandfor="site-menu"]')) {
    const cmd = b.getAttribute('command');
    b.removeAttribute('commandfor');
    b.addEventListener('click', cmd === 'close' ? close : open);
  }
  menu.addEventListener('cancel', (e) => { e.preventDefault(); close(); }); // Esc
}
