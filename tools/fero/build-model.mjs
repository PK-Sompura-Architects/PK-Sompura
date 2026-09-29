// Builds public/models/fero.glb: the artificial mountain with its arched cave mouth, the tunnel, the stone arch rim
// and the Nagara shikhara inside (design/Posters.dc.html P3). World units are metres, in scene coordinates, so the
// runtime just adds the model. Geometry is Draco-compressed; the one stone texture is KTX2 (Basis ETC1S).
// Run from the project root:  node tools/fero/build-model.mjs
// Clouds, ridges, fog, sky and light are procedural at runtime (src/scripts/three/fero.ts), not in this file.
import {
  BoxGeometry, BufferAttribute, BufferGeometry, ConeGeometry, CylinderGeometry, ExtrudeGeometry, LatheGeometry,
  Matrix4, PlaneGeometry, Shape, Vector2, Vector3,
} from 'three';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Document, NodeIO } from '@gltf-transform/core';
import { KHRDracoMeshCompression, KHRTextureBasisu, KHRMaterialsEmissiveStrength } from '@gltf-transform/extensions';
import { draco } from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';
import { encodeToKTX2 } from 'ktx2-encoder';
import fs from 'node:fs';

// ── Layout (P3 "Scene and camera rig"): mountain 140 m, cave mouth 36 × 44 m, temple 24 m including the flag,
// set 40 m inside the mouth.
export const MOUTH_Z = -875, TEMPLE_Z = -915, MOUNT_C = new Vector3(0, 0, -985);
const MOUTH_W = 36, MOUTH_H = 44, MOUTH_R = MOUTH_W / 2, MOUTH_SPRING = MOUTH_H - MOUTH_R;

// ── Deterministic value noise.
const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
const fbm = (x, y, o = 4) => { let s = 0, a = 0.5, f = 1; for (let i = 0; i < o; i++) { s += a * vnoise(x * f, y * f); f *= 2.07; a *= 0.5; } return s; };
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// The arch opening in the x/y plane of the mouth.
const inArch = (x, y, pad = 0) => y < MOUTH_H + pad && (y <= MOUTH_SPRING ? Math.abs(x) < MOUTH_R + pad : Math.hypot(x, y - MOUTH_SPRING) < MOUTH_R + pad);
function archShape(r, spring, bottom = 0) {
  const s = new Shape();
  s.moveTo(-r, bottom); s.lineTo(-r, spring); s.absarc(0, spring, r, Math.PI, 0, true); s.lineTo(r, bottom); s.lineTo(-r, bottom);
  return s;
}

// ── The terraced mountain: a faceted lathe (terrace lips every 9 m, low-frequency facets around it, the summit
// pushed a little left), with the arch cut out of its front and a tunnel behind.
function mountain() {
  const RINGS = 90, SEG = 200, H = 140, R0 = 128;
  const pos = [], uv = [];
  // Each azimuth reaches its own summit height, so the top breaks into peaks (the main one a little left).
  const reach = (th) => 0.62 + 0.42 * fbm(th * 1.1 + 9, 0.5, 3) + 0.25 * Math.exp(-((th + 0.5) ** 2) / 0.18);
  for (let j = 0; j <= RINGS; j++) {
    const y = (j / RINGS) * H;
    const terrace = 5.5 * (1 - (y / 11 - Math.floor(y / 11))) ** 2;       // a lip at the foot of each 11 m terrace
    for (let i = 0; i <= SEG; i++) {
      const th = (i / SEG) * Math.PI * 2 - Math.PI;                       // 0 = facing +z (the camera)
      const facet = Math.floor(th / 0.24) * 0.24;                         // stepped azimuth → flat facets
      const top = H * Math.min(1.05, reach(facet));
      let r = R0 * Math.max(0, 1 - y / top) ** 0.8 + terrace * Math.max(0, 1 - y / top);
      const calm = (1 - smooth(0.18, 0.5, Math.abs(th))) * (1 - smooth(55, 80, y)); // keep the face around the mouth calm
      r *= 1 + (0.3 * (fbm(facet * 1.7 + 4, y * 0.025) - 0.5) + 0.1 * (vnoise(th * 5, y * 0.08) - 0.5)) * (1 - 0.85 * calm);
      const x = Math.sin(th) * r, z = Math.cos(th) * r;
      pos.push(MOUNT_C.x + x, Math.min(y, top), MOUNT_C.z + z);
      uv.push(th * 12, y / 24);
    }
  }
  const idx = [];
  const P = (i) => [pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]];
  const cut = (i) => { const [x, y, z] = P(i); return z > MOUTH_Z - 30 && inArch(x, y, 0.5); };
  for (let j = 0; j < RINGS; j++) for (let i = 0; i < SEG; i++) {
    const a = j * (SEG + 1) + i, b = a + 1, c = a + SEG + 1, d = c + 1;
    if (!(cut(a) || cut(b) || cut(c))) idx.push(a, c, b);
    if (!(cut(b) || cut(c) || cut(d))) idx.push(b, c, d);
  }
  let g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute('uv', new BufferAttribute(new Float32Array(uv), 2));
  g.setIndex(idx);
  g = g.toNonIndexed(); g.computeVertexNormals();                         // flat shading: the facets read as rock
  return g;
}

// Tunnel: the arch shape extruded 60 m into the mountain, faces turned inward, with a back wall; plus the floor.
function tunnel() {
  const depth = 60;
  const g = new ExtrudeGeometry(archShape(MOUTH_R, MOUTH_SPRING), { depth, bevelEnabled: false, curveSegments: 20 });
  g.translate(0, 0, MOUTH_Z - depth - 0.5);
  // Drop the front cap (it would close the mouth) and flip the rest so it is seen from inside.
  const pos = g.attributes.position, keep = [];
  for (let i = 0; i < pos.count; i += 3) {
    const front = [0, 1, 2].every((k) => Math.abs(pos.getZ(i + k) - (MOUTH_Z - 0.5)) < 0.01);
    if (!front) keep.push(i, i + 2, i + 1);
  }
  const out = new BufferGeometry();
  const src = g.toNonIndexed(), arr = ['position', 'uv'];
  for (const name of arr) {
    const a = src.attributes[name], n = a.itemSize, d = new Float32Array(keep.length * n);
    keep.forEach((v, k) => { for (let c = 0; c < n; c++) d[k * n + c] = a.array[v * n + c]; });
    out.setAttribute(name, new BufferAttribute(d, n));
  }
  const uvs = out.attributes.uv; for (let i = 0; i < uvs.count; i++) uvs.setXY(i, uvs.getX(i) / 24, uvs.getY(i) / 24);
  out.computeVertexNormals();
  return out;
}

// Dressed-stone arch rim around the mouth (3 m wide, 4 m deep), so the cave reads as a made entrance.
function archRim(R = MOUTH_R, spring = MOUTH_SPRING, w = 3, z = MOUTH_Z - 2, depth = 4) {
  const s = new Shape();                                                     // a U: outer arch out, inner arch back
  s.moveTo(-R - w, 0); s.lineTo(-R - w, spring); s.absarc(0, spring, R + w, Math.PI, 0, true); s.lineTo(R + w, 0);
  s.lineTo(R, 0); s.lineTo(R, spring); s.absarc(0, spring, R, 0, Math.PI, false); s.lineTo(-R, 0); s.lineTo(-R - w, 0);
  const g = new ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelSize: 0.4, bevelThickness: 0.4, bevelSegments: 1, curveSegments: 24 });
  g.translate(0, 0, z);
  const uvs = g.attributes.uv; for (let i = 0; i < uvs.count; i++) uvs.setXY(i, uvs.getX(i) / 12, uvs.getY(i) / 12);
  return g;
}

// ── Nagara shikhara to the P3 elevation. Total height 24 m with the flag: jagati 0.12, wall (mandovara) 0.18,
// shikhara 0.48; recessed bands (bhumi) every 2.3% of the height; a central ratha on each face, lighter and
// projecting 0.3 m; two urushringas per side (0.45× and 0.28× copies, each with amalaka and kalash); amalaka,
// kalash and dhvaja on top.
const T = 24, J = 0.12 * T, W = 0.18 * T, S = 0.48 * T, BAND = 0.023 * T;

// Curvilinear spire profile with a small recess at every bhumi band. r0 at the base, height h.
function spireProfile(r0, h) {
  const pts = [];
  const n = Math.max(4, Math.round(h / BAND));
  for (let i = 0; i <= n; i++) for (const f of [0, 0.78]) {
    const y = ((i + f) / n) * h; if (y > h) continue;
    const base = r0 * (1 - (y / h) ** 1.7) ** 0.72;
    pts.push(new Vector2(Math.max(0.12 * r0, base - (f ? 0.035 * r0 : 0)), y));
  }
  return pts;
}
// A square-plan spire: the lathe with 4 segments, rotated 45° so the faces point along x and z.
function spire(r0, h) { const g = new LatheGeometry(spireProfile(r0, h), 4); g.rotateY(Math.PI / 4); return g; }
// The ratha: a narrow projecting strip following the spire's face profile, on the +z face (rotated for the others).
function ratha(r0, h, w) {
  const prof = spireProfile(r0, h), pos = [], idx = [];
  prof.forEach((p, i) => {
    const face = p.x * Math.SQRT1_2 + 0.3;                                  // face distance of the square spire + 0.3 m
    const hw = w * (p.x / r0);
    pos.push(-hw, p.y, face, hw, p.y, face);
    if (i) { const a = (i - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  });
  const g = new BufferGeometry(); g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3)); g.setIndex(idx);
  g.setAttribute('uv', new BufferAttribute(new Float32Array(pos.length / 3 * 2), 2));
  return g.toNonIndexed();
}
function crown(r0, y) {                                                     // amalaka (ribbed disc) + kalash
  const am = new LatheGeometry([0, 0.5, 0.85, 1, 0.85, 0.5, 0].map((r, i) => new Vector2(0.05 + r * r0, i * 0.12 * r0)), 20);
  am.translate(0, y, 0);
  const kal = new LatheGeometry([[0.02, 0], [0.34, 0.1], [0.5, 0.36], [0.4, 0.66], [0.16, 0.8], [0.24, 0.9], [0.03, 1.35]].map(([r, yy]) => new Vector2(r * r0, yy * r0)), 16);
  kal.translate(0, y + 0.72 * r0, 0);
  return { am, kal };
}

function temple() {
  const stone = [], light = [], saffron = [], door = [];
  const at = (g, x, y, z, ry = 0) => { g.applyMatrix4(new Matrix4().makeRotationY(ry).setPosition(x, y, z)); return g; };
  // Jagati: three steps, 14 → 11.6 m wide.
  for (let i = 0; i < 3; i++) stone.push(at(new BoxGeometry(14 - i * 1.2, J / 3, 12.5 - i * 1.2), 0, J / 6 + (i * J) / 3, 0));
  // Mandovara: the wall with projecting bays (a bhadra on each face and pratirathas either side), plus a plinth moulding.
  const WB = 8.2;
  stone.push(at(new BoxGeometry(WB + 0.5, 0.45, WB + 0.5), 0, J + 0.22, 0));
  stone.push(at(new BoxGeometry(WB, W, WB), 0, J + W / 2, 0));
  for (let k = 0; k < 4; k++) {
    const ry = (k * Math.PI) / 2;
    light.push(at(new BoxGeometry(3.2, W, 0.8), Math.sin(ry) * (WB / 2 + 0.4), J + W / 2, Math.cos(ry) * (WB / 2 + 0.4), ry));
    for (const s of [-1, 1]) stone.push(at(new BoxGeometry(1.1, W, 0.4), Math.sin(ry) * (WB / 2 + 0.2) + Math.cos(ry) * s * 2.9, J + W / 2, Math.cos(ry) * (WB / 2 + 0.2) - Math.sin(ry) * s * 2.9, ry));
  }
  stone.push(at(new BoxGeometry(WB + 0.9, 0.5, WB + 0.9), 0, J + W + 0.25, 0));  // cornice
  // Garbhagriha door (emissive), in the front bhadra.
  door.push(at(new BoxGeometry(1.7, 2.8, 0.1), 0, J + 1.4, WB / 2 + 0.85));
  // Shikhara: main spire, a lighter central ratha on each face, and 2 urushringas per side (left and right).
  const y0 = J + W + 0.5, R = 5.3, Hs = S;
  stone.push(at(spire(R, Hs), 0, y0, 0));
  for (let k = 0; k < 4; k++) light.push(at(ratha(R, Hs * 0.96, 1.1), 0, y0, 0, (k * Math.PI) / 2));
  const { am, kal } = crown(1.55, y0 + Hs - 0.25);
  stone.push(am); saffron.push(kal);
  for (const [sc, off] of [[0.45, 4.1], [0.28, 6.6]]) for (const side of [-1, 1]) for (const face of [0, 1]) {
    // Front/back face pairs on the left and right, stepping out and down the main spire.
    const x = side * off, z = face ? -1.8 : 1.8, r = R * sc, h = Hs * sc;
    stone.push(at(spire(r, h), x, y0 - 0.2, z));
    const c = crown(r * 0.3, y0 - 0.2 + h - 0.1); stone.push(at(c.am, x, 0, z)); saffron.push(at(c.kal, x, 0, z));
  }
  // Dhvaja: pole and flag, to 24 m.
  const pole = new CylinderGeometry(0.07, 0.07, 3.3, 6); pole.translate(0.45, T - 1.65, 0); light.push(pole);
  const flag = new ConeGeometry(0.75, 1.9, 3); flag.rotateZ(-Math.PI / 2); flag.scale(1, 1, 0.12); flag.translate(1.4, T - 0.55, 0); saffron.push(flag);

  const place = (gs) => { const m = mergeGeometries(gs.map((g) => { const n = g.index ? g.toNonIndexed() : g; n.deleteAttribute('normal'); if (!n.attributes.uv) n.setAttribute('uv', new BufferAttribute(new Float32Array(n.attributes.position.count * 2), 2)); return n; })); m.translate(0, 0, TEMPLE_Z); m.computeVertexNormals(); return m; };
  return { stone: place(stone), light: place(light), saffron: place(saffron), door: place(door) };
}

// ── Stone texture (256², grey): fine grain plus faint coursing lines, multiplied into every material's colour.
function stoneTexture() {
  const N = 256, px = new Uint8Array(N * N * 4);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    let v = 0.86 + 0.1 * (fbm(x / 22, y / 22, 5) - 0.5) + 0.08 * (hash(x, y) - 0.5);
    if (y % 32 < 2) v -= 0.07;                                              // coursing
    const o = (y * N + x) * 4, c = Math.round(255 * Math.min(1, Math.max(0, v)));
    px[o] = px[o + 1] = px[o + 2] = c; px[o + 3] = 255;
  }
  return { data: px, width: N, height: N };
}

// ── Write the glTF.
const doc = new Document();
const buffer = doc.createBuffer();
const scene = doc.createScene('fero');
const tex = stoneTexture();
const ktx2 = await encodeToKTX2(new Uint8Array(1), { isUASTC: false, qualityLevel: 160, generateMipmap: true, isSetKTX2SRGBTransferFunc: true, imageDecoder: async () => tex });
doc.createExtension(KHRTextureBasisu).setRequired(true);
const emissive = doc.createExtension(KHRMaterialsEmissiveStrength);
const stoneTex = doc.createTexture('stone').setImage(new Uint8Array(ktx2)).setMimeType('image/ktx2');
const srgb = (hex) => [((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255].map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
function material(name, hex, { rough = 0.9, tex = true, glow = 0 } = {}) {
  const m = doc.createMaterial(name).setBaseColorFactor([...srgb(hex), 1]).setRoughnessFactor(rough).setMetallicFactor(0);
  if (tex) m.setBaseColorTexture(stoneTex);
  if (glow) { m.setEmissiveFactor(srgb(hex)); m.setExtension('KHR_materials_emissive_strength', emissive.createEmissiveStrength().setEmissiveStrength(glow)); }
  return m;
}
function add(name, geo, mat) {
  const prim = doc.createPrimitive().setMaterial(mat);
  for (const [attr, key] of [['POSITION', 'position'], ['NORMAL', 'normal'], ['TEXCOORD_0', 'uv']]) {
    const a = geo.attributes[key]; if (!a) continue;
    prim.setAttribute(attr, doc.createAccessor().setType(a.itemSize === 3 ? 'VEC3' : 'VEC2').setArray(new Float32Array(a.array)).setBuffer(buffer));
  }
  if (geo.index) prim.setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(geo.index.array)).setBuffer(buffer));
  scene.addChild(doc.createNode(name).setMesh(doc.createMesh(name).addPrimitive(prim)));
}
const idx = (g) => mergeVertices(g, 1e-4);
// Palette only: rock navy / deep slate, white stone sand → stone, saffron.
add('mountain', idx(mountain()), material('rock', 0x3a3f66, { rough: 1 }));
add('tunnel', idx(tunnel()), material('cave', 0x0e0e1f, { rough: 1 }));
add('arch', idx(archRim()), material('arch', 0xe7dfd2, { rough: 0.85 }));
// The sanctum arch on the cave's back wall, rim lit saffron: it frames the temple in S5.
add('sanctum-arch', idx(archRim(11.5, 20, 1.4, MOUTH_Z - 60, 1.2)), material('arch-glow', 0xcd8841, { rough: 0.6, glow: 0.9 }));
const t = temple();
add('temple', idx(t.stone), material('stone', 0xe7dfd2, { rough: 0.8 }));
add('temple-ratha', idx(t.light), material('stone-light', 0xf4efe6, { rough: 0.8 }));
add('temple-saffron', idx(t.saffron), material('saffron', 0xcd8841, { rough: 0.5, tex: false, glow: 0.4 }));
add('temple-door', idx(t.door), material('door', 0xcd8841, { tex: false, glow: 3 }));

const io = new NodeIO().registerExtensions([KHRDracoMeshCompression, KHRTextureBasisu, KHRMaterialsEmissiveStrength]).registerDependencies({
  'draco3d.encoder': await draco3d.createEncoderModule(), 'draco3d.decoder': await draco3d.createDecoderModule(),
});
await doc.transform(draco({ method: 'edgebreaker', quantizePosition: 14, quantizeNormal: 8, quantizeTexcoord: 10 }));
fs.mkdirSync('public/models', { recursive: true });
const glb = await io.writeBinary(doc);
fs.writeFileSync('public/models/fero.glb', glb);
const tris = doc.getRoot().listMeshes().reduce((s, m) => s + m.listPrimitives().reduce((a, p) => a + (p.getIndices()?.getCount() ?? 0) / 3, 0), 0);
console.log(`public/models/fero.glb: ${(glb.byteLength / 1024).toFixed(1)} KB (texture ${(ktx2.byteLength / 1024).toFixed(1)} KB), ${Math.round(tris)} triangles`);
