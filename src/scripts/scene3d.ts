// The 3D gate (Handoff §8): the scenes load only with WebGL2, no prefers-reduced-motion, no Save-Data and
// deviceMemory ≥ 4 (browsers that don't report it are allowed). Otherwise the <img> poster stays, and nothing
// else downloads. `?still=hero|toolpath|fero[:progress]` renders one frame for re-exporting the posters.
const els = [...document.querySelectorAll<HTMLElement>('[data-scene]')];
const q = new URLSearchParams(location.search).get('still');

export function gate() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
  if (nav.connection?.saveData) return false;
  if (nav.deviceMemory !== undefined && nav.deviceMemory < 4) return false;
  try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; }
}

if (els.length && (q || gate())) {
  const still = q ? { name: q.split(':')[0] as 'hero', progress: Number(q.split(':')[1] ?? 0.7) } : undefined;
  const go = () => import('./three/boot').then((m) => m.boot(els, still));
  if (still) go();
  else 'requestIdleCallback' in window ? requestIdleCallback(go, { timeout: 2000 }) : setTimeout(go, 1200);
}
