// Offline Fero Works scene: geometry. Same layout as the site's real-time scene (P3): 1 unit = 1 m, the mountain at
// z −985, its cave mouth at z −875 (36 × 44 m), the temple 40 m inside at z −915. Built far denser than a browser
// could afford in real time, since every frame is rendered once, offline.
import {
  BoxGeometry, BufferAttribute, BufferGeometry, ConeGeometry, CylinderGeometry, ExtrudeGeometry, IcosahedronGeometry,
  LatheGeometry, Matrix4, Shape, Vector2, Vector3,
} from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

export const MOUTH_Z = -875, TEMPLE_Z = -915, MOUNT_C = new Vector3(0, 0, -985);
export const MOUTH_W = 36, MOUTH_H = 44, MOUTH_R = MOUTH_W / 2, MOUTH_SPRING = MOUTH_H - MOUTH_R;

// ── Deterministic noise (value noise, 2D and 3D).
export const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
const hash3 = (x, y, z) => { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); };
export function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function vnoise3(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const f = (t) => t * t * (3 - 2 * t), u = f(x - xi), v = f(y - yi), w = f(z - zi);
  const l = (a, b, t) => a + (b - a) * t;
  const c = (dx, dy, dz) => hash3(xi + dx, yi + dy, zi + dz);
  return l(l(l(c(0, 0, 0), c(1, 0, 0), u), l(c(0, 1, 0), c(1, 1, 0), u), v), l(l(c(0, 0, 1), c(1, 0, 1), u), l(c(0, 1, 1), c(1, 1, 1), u), v), w);
}
export const fbm = (x, y, o = 4) => { let s = 0, a = 0.5, f = 1; for (let i = 0; i < o; i++) { s += a * vnoise(x * f, y * f); f *= 2.07; a *= 0.5; } return s; };
export const fbm3 = (x, y, z, o = 4) => { let s = 0, a = 0.5, f = 1; for (let i = 0; i < o; i++) { s += a * vnoise3(x * f, y * f, z * f); f *= 2.07; a *= 0.5; } return s; };
export const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const at = (g, x, y, z, ry = 0, s = 1) => g.applyMatrix4(new Matrix4().makeRotationY(ry).scale(new Vector3(s, s, s)).setPosition(x, y, z));
const flat = (g) => { const n = g.index ? g.toNonIndexed() : g; n.computeVertexNormals(); return n; };
const merge = (gs) => flat(mergeGeometries(gs.map((g) => { const n = g.index ? g.toNonIndexed() : g.clone(); for (const k of Object.keys(n.attributes)) if (k !== 'position') n.deleteAttribute(k); return n; })));

const inArch = (x, y, pad = 0) => y < MOUTH_H + pad && (y <= MOUTH_SPRING ? Math.abs(x) < MOUTH_R + pad : Math.hypot(x, y - MOUTH_SPRING) < MOUTH_R + pad);
function archShape(r, spring, step = 1.2) {
  const s = new Shape();                                     // straight runs split every `step` m, so they can be displaced
  s.moveTo(-r, 0);
  for (let y = step; y < spring; y += step) s.lineTo(-r, y);
  s.lineTo(-r, spring); s.absarc(0, spring, r, Math.PI, 0, true);
  for (let y = spring - step; y > 0; y -= step) s.lineTo(r, y);
  s.lineTo(r, 0);
  for (let x = r - step; x > -r; x -= step) s.lineTo(x, 0);
  return s;
}

// ── The terraced mountain (as the site's model, denser): terrace lips every 11 m, faceted flanks, the summit a
// little left, the arch cut out of its front. Small-scale noise on top so the rock breaks up in close shots.
export function mountain() {
  const RINGS = 220, SEG = 520, H = 140, R0 = 128;
  const pos = [];
  const reach = (th) => 0.62 + 0.42 * fbm(th * 1.1 + 9, 0.5, 3) + 0.25 * Math.exp(-((th + 0.5) ** 2) / 0.18);
  for (let j = 0; j <= RINGS; j++) {
    const y = (j / RINGS) * H;
    const terrace = 1.5 * (1 - (y / 11 - Math.floor(y / 11))) ** 2;
    for (let i = 0; i <= SEG; i++) {
      const th = (i / SEG) * Math.PI * 2 - Math.PI;
      const facet = Math.floor(th / 0.24) * 0.24;
      const top = H * Math.min(1.05, reach(facet));
      let r = R0 * Math.max(0, 1 - y / top) ** 0.8 + terrace * Math.max(0, 1 - y / top);
      const calm = (1 - smooth(0.18, 0.5, Math.abs(th))) * (1 - smooth(55, 80, y));
      r *= 1 + (0.34 * (fbm(facet * 1.7 + 4, y * 0.025) - 0.5) + 0.16 * (vnoise(th * 6, y * 0.1) - 0.5)) * (1 - 0.8 * calm);
      r += 4.5 * (fbm(th * 26, y * 0.22, 4) - 0.5) * Math.max(0, 1 - y / top) ** 0.3;   // rock grain
      pos.push(MOUNT_C.x + Math.sin(th) * r, Math.min(y, top), MOUNT_C.z + Math.cos(th) * r);
    }
  }
  const idx = [], P = (i) => [pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]];
  const cut = (i) => { const [x, y, z] = P(i); return z > MOUTH_Z - 30 && inArch(x, y, 0.5); };
  for (let j = 0; j < RINGS; j++) for (let i = 0; i < SEG; i++) {
    const a = j * (SEG + 1) + i, b = a + 1, c = a + SEG + 1, d = c + 1;
    if (!(cut(a) || cut(b) || cut(c))) idx.push(a, c, b);
    if (!(cut(b) || cut(c) || cut(d))) idx.push(b, c, d);
  }
  const g = new BufferGeometry(); g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3)); g.setIndex(idx);
  return flat(g);
}

// ── The cave: the arch extruded 70 m in, its walls and roof pushed about by 3D noise so they read as hewn rock, a
// rough back wall and floor; and a rim of boulders round the mouth, instead of a smooth dressed-stone arch.
export function cave() {
  const depth = 70;
  const g0 = new ExtrudeGeometry(archShape(MOUTH_R, MOUTH_SPRING), { depth, steps: 90, bevelEnabled: false, curveSegments: 60 });
  g0.translate(0, 0, MOUTH_Z - depth - 0.5);
  const g = mergeVertices(g0.toNonIndexed().deleteAttribute('normal').deleteAttribute('uv'), 1e-3);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const back = z < MOUTH_Z - depth; // the back wall
    if (y < 0.01 && !back) { p.setY(i, 0.3 * fbm3(x * 0.2, 0, z * 0.2, 2)); continue; } // floor: nearly flat
    // push outward from the axis (walls/roof) by up to ~3.5 m, deeper further in
    const cx = 0, cy = Math.min(y, MOUTH_SPRING);
    let dx = x - cx, dy = y - cy; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
    const n = fbm3(x * 0.11, y * 0.11, z * 0.11, 4) - 0.5, n2 = fbm3(x * 0.45 + 5, y * 0.45, z * 0.45, 3) - 0.5;
    const k = back ? 0 : (6.5 * n + 1.6 * n2) * smooth(MOUTH_Z + 1, MOUTH_Z - 8, z);
    p.setXYZ(i, x + dx * k, y + dy * k * (y > 0.5 ? 1 : 0), back ? z + 4 * n : z);
  }
  // Remove the front cap (it would close the mouth) and turn the faces inward.
  const ng = g.toNonIndexed(), a = ng.attributes.position, keep = [];
  for (let i = 0; i < a.count; i += 3) {
    const front = [0, 1, 2].every((k) => a.getZ(i + k) > MOUTH_Z - 0.6);
    if (!front) keep.push(i, i + 2, i + 1);
  }
  const d = new Float32Array(keep.length * 3); keep.forEach((v, k) => d.set([a.getX(v), a.getY(v), a.getZ(v)], k * 3));
  const walls = new BufferGeometry(); walls.setAttribute('position', new BufferAttribute(d, 3));

  // Boulders along the arch outline, at the mouth: 2–3 lumpy stones per step.
  const stones = [];
  const outline = [];
  for (let y = 0; y <= MOUTH_SPRING; y += 2) { outline.push([-MOUTH_R, y]); outline.push([MOUTH_R, y]); }
  for (let t = 0; t <= Math.PI; t += 0.065) outline.push([-Math.cos(t) * MOUTH_R, MOUTH_SPRING + Math.sin(t) * MOUTH_R]);
  outline.forEach(([x, y], i) => {
    for (let k = 0; k < 1 + (hash(i, 21) > 0.45 ? 1 : 0) + (hash(i, 22) > 0.8 ? 1 : 0); k++) {
      const r = 0.9 + 2.6 * hash(i, k + 3) ** 1.8;
      const s = new IcosahedronGeometry(1, 1), sp = s.attributes.position;
      for (let j = 0; j < sp.count; j++) {
        const v = new Vector3(sp.getX(j), sp.getY(j), sp.getZ(j));
        v.multiplyScalar(r * (0.75 + 0.5 * fbm3(v.x * 1.3 + i, v.y * 1.3 + k, v.z * 1.3, 3)));
        sp.setXYZ(j, v.x, v.y * 0.8, v.z * 0.6);
      }
      const nx = y > MOUTH_SPRING ? x / MOUTH_R : Math.sign(x), ny = y > MOUTH_SPRING ? (y - MOUTH_SPRING) / MOUTH_R : 0;
      const push = r * 0.4 + 0.8 * hash(i, 7);                            // sit on the lip, just outside the opening
      stones.push(at(s, x + nx * push + (hash(i, k) - 0.5) * 3, y + ny * push + (hash(k, i) - 0.5) * 2.6, MOUTH_Z - 1.5 + (hash(i, 9 + k) - 0.5) * 4, hash(i, 11 + k) * 6));
    }
  });
  return { walls: flat(walls), rim: merge(stones) };
}

// ── The temple: a Nagara shikhara, 24 m to the top of the flag. Plan: pancharatha (a central bhadra, pratirathas and
// karnas on each face). From the ground: a stepped jagati with a front stair; the mandovara (wall) on base mouldings,
// with bays and a cornice; the curved shikhara in bhumi tiers (a recessed band and a small amalaka on each corner at
// every tier), 2 urushringas per side; the ribbed amalaka, kalash and dhvaja.
const T = 25, J = 2.2, W = 4.2, S = 13.8;

// Pancharatha plan outline at half-width h: offsets of the rathas (fractions of h) and their projection depth.
function planPoly(h, depth = 0.09) {
  const pts = [];
  const steps = [[1.0, 0], [0.62, depth], [0.34, depth * 2]]; // karna, pratiratha, bhadra: each steps out further
  // one quarter from the corner to the face centre on the +z face, then mirrored round.
  const q = [];
  q.push([h, h]);
  for (let s = 0; s < steps.length - 1; s++) {
    const [w0, d0] = steps[s], [w1, d1] = steps[s + 1];
    q.push([w1 * h, h * (1 + d0)]); q.push([w1 * h, h * (1 + d1)]);
  }
  q.push([0, h * (1 + steps[2][1])]);
  // The +z face from its right corner to its left, then the same face turned onto −x, −z and +x in order.
  let face = [...q, ...q.slice(0, -1).reverse().map(([x, z]) => [-x, z])];
  for (let k = 0; k < 4; k++) {
    face.slice(0, -1).forEach((p) => pts.push(p));
    face = face.map(([x, z]) => [-z, x]);
  }
  return pts;
}
// A stack of plan rings into a closed mesh (sides + top cap).
function loft(rings) {
  const n = rings[0].pts.length, pos = [], idx = [];
  rings.forEach((r) => r.pts.forEach(([x, z]) => pos.push(x, r.y, z)));
  for (let j = 0; j < rings.length - 1; j++) for (let i = 0; i < n; i++) {
    const a = j * n + i, b = j * n + ((i + 1) % n), c = a + n, d = b + n;
    idx.push(a, b, c, b, d, c);
  }
  const top = rings.length - 1, cIdx = pos.length / 3; const ty = rings[top].y;
  pos.push(0, ty, 0);
  for (let i = 0; i < n; i++) idx.push(top * n + i, cIdx, top * n + ((i + 1) % n));
  const g = new BufferGeometry(); g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3)); g.setIndex(idx);
  return g;
}
// The curved spire: pancharatha plan, radius falling off on a Nagara curve, a recess at every bhumi tier.
function shikhara(r0, h, tiers, depth = 0.09) {
  const rings = [];
  const prof = (t) => r0 * (1 - 0.2 * t - 0.62 * t ** 2.6);        // gentle taper, curving in near the top
  for (let i = 0; i < tiers; i++) for (const [f, k] of [[0, 1], [0.12, 0.965], [0.22, 0.965], [0.3, 1]]) {
    const t = (i + f) / tiers; rings.push({ y: t * h, pts: planPoly(Math.max(prof(t), 0.16 * r0) * k, depth) });
  }
  rings.push({ y: h, pts: planPoly(0.16 * r0 * 0.97, depth) });
  return { g: loft(rings), prof };
}
function amalaka(r, y, ribs = 28) { // ribbed disc
  const pts = [0, 0.55, 0.9, 1, 0.9, 0.55, 0].map((v, i) => new Vector2(0.05 + v * r, i * 0.11 * r));
  const g = new LatheGeometry(pts, ribs * 2), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), a = Math.atan2(z, x), rr = Math.hypot(x, z), k = 1 + 0.07 * Math.cos(a * ribs);
    p.setXYZ(i, Math.cos(a) * rr * k, p.getY(i), Math.sin(a) * rr * k);
  }
  g.translate(0, y, 0); return g;
}
function kalash(r, y) {
  const g = new LatheGeometry([[0.02, 0], [0.34, 0.1], [0.5, 0.36], [0.4, 0.66], [0.16, 0.8], [0.26, 0.9], [0.18, 1.02], [0.03, 1.4]].map(([a, b]) => new Vector2(a * r, b * r)), 20);
  g.translate(0, y, 0); return g;
}

export function temple() {
  const stone = [], light = [], saffron = [], dark = [], door = [];
  // Jagati: four moulded steps, 16 → 12.4 m, and a front stair.
  for (let i = 0; i < 4; i++) {
    const w = 14.5 - i * 1.1, h = J / 4;
    stone.push(at(new BoxGeometry(w, h * 0.8, w * 0.9), 0, h * i + h * 0.4, 0));
    light.push(at(new BoxGeometry(w + 0.25, h * 0.2, w * 0.9 + 0.25), 0, h * i + h * 0.9, 0)); // the lip of each step
  }
  for (let s = 0; s < 8; s++) stone.push(at(new BoxGeometry(3.2, (J * (s + 1)) / 8, 0.55), 0, (J * (s + 1)) / 16, 14.5 * 0.45 + 2.2 - s * 0.55));
  // Mandovara: base mouldings (khura, kumbha, kalasha, kapotika), the wall in the pancharatha plan, a cornice.
  const WB = 3.9; let y = J;
  for (const [hh, k, mat] of [[0.35, 1.08, stone], [0.55, 1.12, light], [0.3, 1.05, stone], [0.28, 1.1, light]]) {
    mat.push(loft([{ y, pts: planPoly(WB * k) }, { y: y + hh, pts: planPoly(WB * k) }])); y += hh;
  }
  const wallH = W - 1.5;
  stone.push(loft([{ y, pts: planPoly(WB) }, { y: y + wallH, pts: planPoly(WB) }]));
  // Niches in the bhadra of the side and back faces, the door in the front.
  for (let k = 1; k < 4; k++) {
    const a = (k * Math.PI) / 2, d = WB * 1.18 + 0.02;
    dark.push(at(new BoxGeometry(1.3, 2.0, 0.12), Math.sin(a) * d, y + wallH * 0.52, Math.cos(a) * d, a));
    light.push(at(new BoxGeometry(1.8, 0.25, 0.3), Math.sin(a) * d, y + wallH * 0.52 + 1.15, Math.cos(a) * d, a));
  }
  door.push(at(new BoxGeometry(1.6, 2.7, 0.12), 0, J + 0.2 + 1.35, WB * 1.18 + 0.02));
  light.push(at(new BoxGeometry(2.3, 0.3, 0.4), 0, J + 0.2 + 2.85, WB * 1.18 + 0.1));
  y += wallH;
  for (const [hh, k] of [[0.3, 1.12], [0.25, 1.2], [0.2, 1.1]]) { light.push(loft([{ y, pts: planPoly(WB * k) }, { y: y + hh, pts: planPoly(WB * k) }])); y += hh; }
  // Shikhara, in 9 bhumi tiers; a small amalaka on each corner at each tier.
  const y0 = y, R = WB * 0.98, tiers = 10;
  const sh = shikhara(R, S, tiers); stone.push(at(sh.g, 0, y0, 0));
  for (let i = 1; i < tiers; i++) {
    const t = i / tiers, r = Math.max(sh.prof(t), 0.16 * R);
    for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) light.push(amalaka(0.36, 0).translate(sx * r * 1.0, y0 + t * S - 0.1, sz * r * 1.0));
  }
  // Urushringas: on each face, two half-spires stacked against the bhadra.
  for (let k = 0; k < 4; k++) {
    const a = (k * Math.PI) / 2;
    for (const [sc, hy, out] of [[0.42, 0.0, 1.0], [0.28, 0.24, 0.9]]) {
      const r = R * sc, h = S * sc, u = shikhara(r, h, 5, 0.07);
      const d = R * out * (1 - 0.2 * hy - 0.62 * hy ** 2.6) + r * 0.12;
      light.push(at(u.g, Math.sin(a) * d, y0 + hy * S, Math.cos(a) * d, a));
      stone.push(amalaka(r * 0.36, 0).translate(Math.sin(a) * d, y0 + hy * S + h, Math.cos(a) * d));
      saffron.push(kalash(r * 0.26, 0).translate(Math.sin(a) * d, y0 + hy * S + h + r * 0.28, Math.cos(a) * d));
    }
  }
  // Crown: griva, amalaka, kalash, dhvaja.
  const top = y0 + S;
  stone.push(new CylinderGeometry(R * 0.2, R * 0.24, 0.35, 24).translate(0, top + 0.1, 0));
  stone.push(amalaka(R * 0.36, top + 0.25));
  saffron.push(kalash(R * 0.24, top + 0.25 + R * 0.36 * 0.66));
  const flagTop = T;
  light.push(new CylinderGeometry(0.06, 0.06, flagTop - (top + 1.2), 8).translate(0.55, (flagTop + top + 1.2) / 2, 0));
  const flag = new ConeGeometry(0.72, 1.9, 3); flag.rotateZ(-Math.PI / 2); flag.scale(1, 1, 0.1); flag.translate(1.5, flagTop - 0.55, 0);
  saffron.push(flag);
  const place = (gs) => { const m = merge(gs); m.translate(0, 0, TEMPLE_Z); return m; };
  return { stone: place(stone), light: place(light), saffron: place(saffron), dark: place(dark), door: place(door), height: T };
}
