// Fero Works heightfield: four ridge layers across the valley (slate far → night near), two spurs (the last ridge on
// the left, and the foreground ridge at the reveal), a notch along the flight path and a plain around the mountain.
// Built in a Web Worker (ridges.worker.ts): ~100k vertices of noise is seconds of main-thread work on a laptop CPU.
import { Color, PlaneGeometry } from 'three';

const NIGHT = 0x0e0e1f, NAVY = 0x262654, SLATE_DEEP = 0x52606b;
const MOUNT_X = 0, MOUNT_Z = -985;

const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function hash(x: number, y: number) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
function vnoise(x: number, y: number) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), w = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * w + (a - b - c + d) * u * w;
}
const fbm = (x: number, y: number, o = 4) => { let s = 0, a = 0.5, f = 1; for (let i = 0; i < o; i++) { s += a * vnoise(x * f, y * f); f *= 2.03; a *= 0.5; } return s; };
const ridged = (x: number, y: number) => { let s = 0, a = 0.6, f = 1; for (let i = 0; i < 4; i++) { s += a * (1 - Math.abs(vnoise(x * f, y * f) * 2 - 1)) ** 2; f *= 2.2; a *= 0.5; } return s; };
const LAYERS = [[-130, 58], [-280, 72], [-450, 90], [-660, 110]];              // z, crest height (60–110 m)
const SPURS = [[-100, -470, 60, 96], [-20, -625, 48, 78]];                    // x, z, radius, height

/** path: the camera path in x/z, ordered along the flight (z decreasing). */
export function buildRidges(mobile: boolean, path: [number, number][]) {
  // The notch only matters within 140 m of the path, so each point checks only path samples within 150 m in z.
  const pz = path.map((p) => p[1]);
  const first = (z: number) => { let lo = 0, hi = pz.length; while (lo < hi) { const m = (lo + hi) >> 1; pz[m] > z + 150 ? (lo = m + 1) : (hi = m); } return lo; };
  const height = (x: number, z: number) => {
    let h = 0;
    for (const [zc, a] of LAYERS) {
      const d = Math.abs(z - (zc + 60 * (fbm(x * 0.003 + zc, 3) - 0.5)));
      const prof = Math.max(0, 1 - d / (80 + 40 * fbm(x * 0.01, zc))) ** 1.3;
      if (prof > 0) h = Math.max(h, prof * a * (0.5 + 0.55 * ridged(x * 0.005 + zc * 0.1, zc * 0.013)));
    }
    for (const [sx, sz, r, a] of SPURS) {
      const e = Math.exp(-((x - sx) ** 2 + (z - sz) ** 2) / (2 * r * r));
      if (e > 1e-3) h = Math.max(h, a * e * (0.8 + 0.4 * ridged(x * 0.02, z * 0.02)));
    }
    h += 5 * fbm(x * 0.04, z * 0.04);
    let d2 = 150 * 150;
    for (let i = first(z); i < path.length && path[i][1] >= z - 150; i++) d2 = Math.min(d2, (x - path[i][0]) ** 2 + (z - path[i][1]) ** 2);
    h *= 0.3 + 0.7 * smooth(25, 140, Math.sqrt(d2));                           // stay ~25 m under the camera
    h *= smooth(150, 250, Math.hypot(x - MOUNT_X, z - MOUNT_Z));              // the plain the mountain stands on
    return h - 1;
  };

  const g = new PlaneGeometry(2800, 2400, mobile ? 230 : 340, mobile ? 200 : 290);
  g.rotateX(-Math.PI / 2); g.translate(0, 0, -520);
  const pos = g.attributes.position.array as Float32Array, color = new Float32Array(pos.length);
  const lo = new Color(NIGHT), mid = new Color(NAVY), hi = new Color(SLATE_DEEP), c = new Color();
  for (let i = 0; i < pos.length; i += 3) {
    const y = height(pos[i], pos[i + 2]);
    pos[i + 1] = y;
    c.copy(lo).lerp(mid, smooth(0, 35, y)).lerp(hi, smooth(45, 100, y) * 0.8).toArray(color, i);
  }
  g.computeVertexNormals();
  return { position: pos, normal: g.attributes.normal.array as Float32Array, color, index: g.index!.array as Uint32Array | Uint16Array };
}
