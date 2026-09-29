// Fero Works fly-through (plan.md §3 item 6, §5). Scroll progress 0 → 1 drives five shots:
// above the clouds at dusk → descent through the clouds → low over the ridges (banking) → round the last ridge to
// reveal the artificial mountain and its cave → hold on the temple inside. Everything is generated at load:
// terrain from a procedural height field, cloud texture from canvas noise, temple from primitives. No downloads.
import {
  AdditiveBlending, AmbientLight, BackSide, BufferAttribute, BufferGeometry, CanvasTexture, CatmullRomCurve3, Color,
  CylinderGeometry, DirectionalLight, DoubleSide, FogExp2, Group, HemisphereLight, LatheGeometry, Mesh,
  MeshLambertMaterial, MeshStandardMaterial, PerspectiveCamera, PlaneGeometry, PointLight, Scene, ShaderMaterial,
  SphereGeometry, Sprite, SpriteMaterial, SRGBColorSpace, Vector2, Vector3, WebGLRenderer, BoxGeometry, ConeGeometry,
  CircleGeometry, TorusGeometry,
} from 'three';
import type { SceneHandle, SceneState } from './boot';

const NIGHT = new Color(0x0e0e1f), NAVY = new Color(0x262654), SLATE = new Color(0x798a96), SLATE_DEEP = new Color(0x52606b);
const SAND = 0xf4efe6, SAFFRON = 0xcd8841;

// ── Noise (value noise + fBm), deterministic.
function hash(x: number, y: number) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
function vnoise(x: number, y: number) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x: number, y: number, oct = 5) { let s = 0, a = 0.5, f = 1; for (let i = 0; i < oct; i++) { s += a * vnoise(x * f, y * f); f *= 2.03; a *= 0.5; } return s; }
const ridged = (x: number, y: number) => { let s = 0, a = 0.55, f = 1; for (let i = 0; i < 4; i++) { s += a * (1 - Math.abs(vnoise(x * f, y * f) * 2 - 1)) ** 2; f *= 2.1; a *= 0.5; } return s; };
const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// ── Camera path and a separate look-at path (world units ≈ metres; the mountain stands at z = −160).
const PATH = new CatmullRomCurve3([
  [0, 78, 250], [4, 60, 215], [10, 40, 180], [20, 22, 145], [32, 13, 105], [42, 10, 60], [44, 10, 15],
  [36, 10, -25], [28, 11, -62], [14, 10, -78], [5, 9, -86], [0, 8.5, -90],
].map(([x, y, z]) => new Vector3(x, y, z)), false, 'centripetal');
const LOOK = new CatmullRomCurve3([
  [0, 55, 0], [0, 42, 60], [10, 20, 100], [25, 12, 70], [38, 10, 30], [44, 9, -10], [35, 9, -50],
  [18, 12, -115], [6, 12, -150], [1, 8, -135], [0, 5.5, -124], [0, 5.5, -124],
].map(([x, y, z]) => new Vector3(x, y, z)), false, 'centripetal');
const MOUNT = new Vector3(0, 0, -160), RIDGE = new Vector2(10, -32);

// Progress → curve parameter: eased at both ends, and 0.86 → 1 is the hold on the temple.
const toT = (p: number) => { const q = Math.min(1, p / 0.86); return q * q * (3 - 2 * q); };

function heightAt(x: number, z: number, pathXZ: Vector2[]) {
  let h = 26 * ridged(x * 0.011, z * 0.011) + 8 * fbm(x * 0.03 + 7, z * 0.03);
  let d = 1e9; // distance to the flight path (the valley)
  for (const p of pathXZ) d = Math.min(d, (x - p.x) ** 2 + (z - p.y) ** 2);
  h *= 0.15 + 0.85 * smooth(10, 42, Math.sqrt(d));
  const r = Math.hypot(x - RIDGE.x, z - RIDGE.y); // the last ridge, which hides the mountain until the camera rounds it
  h += 38 * Math.exp(-(r * r) / (2 * 15 * 15)) * smooth(8, 16, Math.sqrt(d));
  const m = Math.hypot(x - MOUNT.x, z - MOUNT.z); // a plain for the mountain to stand on
  h *= 0.25 + 0.75 * smooth(48, 80, m);
  return h - 2;
}

function terrain(mobile: boolean) {
  const seg = mobile ? 150 : 210;
  const g = new PlaneGeometry(620, 620, seg, seg); g.rotateX(-Math.PI / 2); g.translate(0, 0, 20);
  const pathXZ = PATH.getSpacedPoints(90).map((p) => new Vector2(p.x, p.z));
  const pos = g.attributes.position as BufferAttribute;
  const col = new Float32Array(pos.count * 3), c = new Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), y = heightAt(x, z, pathXZ);
    pos.setY(i, y);
    c.copy(NAVY).lerp(SLATE_DEEP, smooth(-2, 22, y)).lerp(SLATE, smooth(16, 40, y) * 0.8); // navy valleys → slate crests
    c.toArray(col, i * 3);
  }
  g.setAttribute('color', new BufferAttribute(col, 3)); g.computeVertexNormals();
  return new Mesh(g, new MeshLambertMaterial({ vertexColors: true, flatShading: true }));
}

// The artificial mountain: a displaced dome with an arched cave mouth and a tunnel, facing the camera (+z).
function mountain() {
  const g = new SphereGeometry(46, 180, 64, 0, Math.PI * 2, 0, Math.PI / 2);
  const pos = g.attributes.position as BufferAttribute, v = new Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n = v.clone().normalize();
    const k = 1 + 0.18 * (fbm(v.x * 0.05 + 3, v.z * 0.05 + v.y * 0.04) - 0.5) + 0.1 * (ridged(v.x * 0.03, v.y * 0.05) - 0.3);
    v.copy(n.multiplyScalar(46 * k)); v.y *= 1.12;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  // Cut the cave mouth: drop faces inside a semicircular arch of radius 9 on the front.
  const idx = g.index!.array, keep: number[] = [];
  // Any face touching the arch opening goes; the stone arch (outer radius 10.5) covers the ragged edge.
  const inMouth = (a: number) => pos.getZ(a) > 20 && Math.hypot(pos.getX(a), pos.getY(a)) < 9.3;
  for (let i = 0; i < idx.length; i += 3) if (!(inMouth(idx[i]) || inMouth(idx[i + 1]) || inMouth(idx[i + 2]))) keep.push(idx[i], idx[i + 1], idx[i + 2]);
  g.setIndex(keep); g.computeVertexNormals();
  const rock = new MeshLambertMaterial({ color: 0x4a5070, flatShading: true });
  const grp = new Group();
  grp.add(new Mesh(g, rock));
  // Tunnel: a half cylinder (the arch) with a back wall and floor, lit only by the temple's lamp.
  const inner = new MeshLambertMaterial({ color: 0x2c2c4e, side: BackSide, flatShading: true });
  const tunnel = new Mesh(new CylinderGeometry(9, 9, 22, 28, 1, true, -Math.PI / 2, Math.PI), inner);
  tunnel.rotation.x = Math.PI / 2; tunnel.position.set(0, 0, 34); grp.add(tunnel);
  const back = new Mesh(new CircleGeometry(9, 28, 0, Math.PI), new MeshLambertMaterial({ color: 0x24243f })); back.position.set(0, 0, 23.2); grp.add(back);
  const floor = new Mesh(new PlaneGeometry(18, 22), new MeshLambertMaterial({ color: 0x33334f })); floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0.05, 34); grp.add(floor);
  // A dressed-stone arch frames the cave mouth, so it reads as a made entrance, not a hole.
  const arch = new Mesh(new TorusGeometry(9.6, 0.9, 10, 36, Math.PI), new MeshStandardMaterial({ color: 0xb9b0a3, roughness: 0.95 }));
  arch.position.set(0, 0, 44.6); grp.add(arch);
  grp.position.copy(MOUNT);
  return grp;
}

// Nagara shikhara: curvilinear spire in bands (bhumi), on a stepped jagati, with urushringas, amalaka and kalash.
function spire(r0: number, h: number, seg: number) {
  const p: Vector2[] = [];
  const bands = 7;
  for (let i = 0; i <= bands * 4; i++) {
    const y = (i / (bands * 4)) * h;
    const base = r0 * (1 - (y / h) ** 1.55) ** 0.75;
    const lip = i % 4 === 0 ? 0.06 * r0 : 0;             // a small ledge at every band
    p.push(new Vector2(Math.max(0.05 * r0, base + lip), y));
  }
  return new LatheGeometry(p, seg);
}
function temple() {
  const t = new Group();
  const stone = new MeshStandardMaterial({ color: SAND, roughness: 0.78 });
  const add = (geo: BufferGeometry, x: number, y: number, z: number, mat = stone) => { const m = new Mesh(geo, mat); m.position.set(x, y, z); t.add(m); return m; };
  [[8, 6], [7, 5.2], [6.2, 4.6]].forEach(([w, d], i) => add(new BoxGeometry(w, 0.5, d), 0, 0.25 + i * 0.5, 0)); // jagati, 3 steps
  add(new BoxGeometry(3.4, 2.6, 3.4), 0, 2.8, -0.4);                         // garbhagriha walls
  add(new BoxGeometry(3.0, 2.0, 2.0), 0, 2.5, 1.8);                          // mandapa
  add(new ConeGeometry(2.1, 1.2, 4), 0, 4.1, 1.8).rotation.y = Math.PI / 4; // mandapa roof
  add(new BoxGeometry(0.8, 1.3, 0.05), 0, 2.15, 2.83, new MeshStandardMaterial({ color: SAFFRON, emissive: SAFFRON, emissiveIntensity: 1.2 })); // lit doorway
  add(spire(1.9, 4.4, 24), 0, 4.1, -0.4);                                    // main shikhara
  for (const [x, z, s] of [[-1.45, -0.4, 0.46], [1.45, -0.4, 0.46], [0, 1.0, 0.5], [0, -1.8, 0.46]]) add(spire(1.9 * s, 4.4 * s, 18), x, 4.1, z); // urushringas
  const amalaka = new LatheGeometry([0, 0.18, 0.34, 0.42, 0.34, 0.18, 0].map((r, i) => new Vector2(0.001 + r * 1.7, i * 0.07)), 24);
  add(amalaka, 0, 8.45, -0.4);
  const kalash = new LatheGeometry([[0.02, 0], [0.18, 0.05], [0.26, 0.2], [0.2, 0.38], [0.08, 0.46], [0.12, 0.52], [0.02, 0.8]].map(([r, y]) => new Vector2(r, y)), 18);
  add(kalash, 0, 8.87, -0.4, new MeshStandardMaterial({ color: SAFFRON, roughness: 0.45, metalness: 0.2 }));
  add(new BoxGeometry(0.04, 1.2, 0.04), 0.3, 9.3, -0.4, new MeshStandardMaterial({ color: 0xe7dfd2 }));
  const flag = add(new ConeGeometry(0.28, 0.6, 3), 0.62, 9.7, -0.4, new MeshStandardMaterial({ color: SAFFRON, emissive: SAFFRON, emissiveIntensity: 0.4, side: DoubleSide }));
  flag.rotation.z = -Math.PI / 2;
  t.scale.setScalar(0.95);
  return t;
}

// Additive plane: conic rays (Light Rays) or a soft glow.
function glow(size: number, rays: boolean) {
  const m = new ShaderMaterial({
    transparent: true, depthWrite: false, blending: AdditiveBlending, uniforms: { uA: { value: 0 }, uC: { value: new Color(SAFFRON) } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `varying vec2 vUv; uniform float uA; uniform vec3 uC; void main(){ vec2 d = vUv - vec2(0.5, 0.35); float r = length(d) * 2.0;
      ${rays ? 'float a = atan(d.y, d.x); float f = step(0.7, fract(a / 0.12)) * (1.0 - smoothstep(0.0, 1.0, r)) * 0.3;' : 'float f = 0.6 * (1.0 - smoothstep(0.0, 0.8, r));'}
      gl_FragColor = vec4(uC * f * uA, 1.0); }`,
  });
  return new Mesh(new PlaneGeometry(size, size), m);
}

function sky() {
  const m = new ShaderMaterial({
    side: BackSide, depthWrite: false, fog: false,
    uniforms: { uTop: { value: NIGHT }, uMid: { value: new Color(0x1b1b3c) }, uGlow: { value: new Color(SAFFRON) } },
    vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `varying vec3 vDir; uniform vec3 uTop, uMid, uGlow; void main(){
      float h = clamp(vDir.y, -0.2, 1.0);
      vec3 c = mix(uMid, uTop, smoothstep(0.02, 0.5, h));
      float toward = pow(max(0.0, -vDir.z), 3.0);                     // the horizon glow sits beyond the mountain (−z)
      c += uGlow * 0.55 * toward * exp(-abs(h) * 9.0);
      gl_FragColor = vec4(c, 1.0); }`,
  });
  return new Mesh(new SphereGeometry(900, 32, 16), m);
}

function clouds(group: Group) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 128;
  const ctx = cv.getContext('2d')!, img = ctx.createImageData(128, 128);
  for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
    const r = Math.hypot(x - 64, y - 64) / 64;
    const a = Math.max(0, fbm(x / 28, y / 28, 4) * 1.6 - 0.35) * Math.max(0, 1 - r * r);
    const o = (y * 128 + x) * 4; img.data[o] = 205; img.data[o + 1] = 215; img.data[o + 2] = 228; img.data[o + 3] = Math.min(255, a * 255);
  }
  ctx.putImageData(img, 0, 0);
  const tex = new CanvasTexture(cv); tex.colorSpace = SRGBColorSpace;
  for (let i = 0; i < 18; i++) {
    const s = new Sprite(new SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.55, color: i % 3 ? 0x8f9cb8 : 0xb9a58f }));
    s.position.set((hash(i, 1) - 0.5) * 240, 33 + hash(i, 2) * 9, 110 + hash(i, 3) * 150);
    const k = 70 + hash(i, 4) * 60; s.scale.set(k, k * 0.55, 1);
    group.add(s);
  }
}

export default function mount(host: HTMLElement, state: SceneState): SceneHandle {
  const mobile = matchMedia('(max-width: 1023px)').matches;
  const renderer = new WebGLRenderer({ antialias: !mobile, powerPreference: 'high-performance' });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));

  const scene = new Scene();
  const fog = new FogExp2(0x16163a, 0.006); scene.fog = fog; scene.background = NIGHT;
  const camera = new PerspectiveCamera(mobile ? 62 : 48, 16 / 9, 0.5, 2000);

  scene.add(sky(), terrain(mobile), mountain());
  const cloudLayer = new Group(); clouds(cloudLayer); scene.add(cloudLayer);
  const t = temple(); t.position.set(0, 0, -160 + 36); scene.add(t);
  const rays = glow(20, true); rays.position.set(0, 3, -160 + 25); scene.add(rays);
  const halo = glow(12, false); halo.position.set(0, 3.5, -160 + 28); scene.add(halo);

  scene.add(new AmbientLight(0x262654, 1.3));
  scene.add(new HemisphereLight(0x5a6a90, 0x0e0e1f, 0.8));
  const dusk = new DirectionalLight(SAFFRON, 1.5); dusk.position.set(-30, 25, -400); scene.add(dusk);     // saffron rim from the horizon
  const moon = new DirectionalLight(0xafd9eb, 1.1); moon.position.set(-80, 120, 120); scene.add(moon);
  const lamp = new PointLight(SAFFRON, 0, 0, 1.2); lamp.position.set(0, 6.5, -160 + 43.5); scene.add(lamp); // warm light just inside the arch
  const rim = new PointLight(SAFFRON, 0, 22, 1.3); rim.position.set(0, 7, -160 + 25); scene.add(rim);     // saffron rim behind the temple

  const eye = new Vector3(), at = new Vector3(), ahead = new Vector3();
  let smoothP = state.progress, roll = 0;
  return {
    canvas: renderer.domElement,
    resize(w, h) { renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); },
    render() {
      smoothP += (state.progress - smoothP) * (state.still ? 1 : 0.12);
      const u = toT(smoothP);
      PATH.getPointAt(u, eye); LOOK.getPointAt(u, at);
      camera.position.copy(eye); camera.lookAt(at);
      // Bank into the turn: roll follows the change in heading, damped.
      PATH.getPointAt(Math.min(1, u + 0.02), ahead);
      const turn = Math.atan2(ahead.x - eye.x, eye.z - ahead.z) - Math.atan2(at.x - eye.x, eye.z - at.z);
      roll += (Math.max(-0.2, Math.min(0.2, turn * 0.8)) * (1 - smooth(0.8, 1, u)) - roll) * (state.still ? 1 : 0.08);
      camera.rotateZ(roll);
      // Fog thickens inside the cloud layer (y 33–42), then clears below it.
      fog.density = 0.004 + 0.03 * smooth(46, 38, eye.y) * smooth(24, 32, eye.y) + 0.0015 * smooth(30, 12, eye.y);
      const reveal = smooth(0.62, 0.84, smoothP);
      lamp.intensity = 150 * reveal; rim.intensity = 70 * reveal;
      (rays.material as ShaderMaterial).uniforms.uA.value = reveal;
      (halo.material as ShaderMaterial).uniforms.uA.value = 0.8 * reveal;
      renderer.render(scene, camera);
    },
    dispose() {
      renderer.dispose();
      scene.traverse((o) => { const m = o as Mesh; m.geometry?.dispose(); const mat = m.material as { dispose?: () => void; map?: { dispose(): void } }; mat?.map?.dispose(); mat?.dispose?.(); });
    },
  };
}
