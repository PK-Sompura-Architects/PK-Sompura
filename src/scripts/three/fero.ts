// Fero Works fly-through, built to design/Posters.dc.html P3. One camera: position and lookAt each follow a
// CatmullRomCurve3 through the five P3 nodes, sampled by the same eased progress (the per-move ranges and eases,
// pitch, yaw, roll and fov are P3's). 1 unit = 1 m.
// The mountain, cave, arch and temple come from public/models/fero.glb (Draco + KTX2, tools/fero/build-model.mjs).
// Sky, clouds, ridges, fog, wisps and light are procedural: shader noise and a heightfield, no meshes to download.
import {
  AdditiveBlending, AmbientLight, BackSide, BufferAttribute, CatmullRomCurve3, Color, DirectionalLight, FogExp2,
  Group, HemisphereLight, LineBasicMaterial, LineSegments, BufferGeometry, Mesh, MeshLambertMaterial, MathUtils,
  PerspectiveCamera, PlaneGeometry, PointLight, Scene, ShaderMaterial, SphereGeometry, SRGBColorSpace, Vector3,
  WebGLRenderer,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import type { SceneHandle, SceneState } from './boot';

// Palette tokens only.
const NIGHT = 0x0e0e1f, NAVY = 0x262654, SLATE = 0x798a96, SLATE_DEEP = 0x52606b, SAFFRON = 0xcd8841, SAND = 0xf4efe6;
const MOUTH_Z = -875, TEMPLE_Z = -915;

// ── Camera rig (P3 "Camera nodes").
const v = (x: number, y: number, z: number) => new Vector3(x, y, z);
const POS = new CatmullRomCurve3([v(0, 520, 900), v(0, 360, 520), v(-60, 70, 0), v(70, 55, -520), v(0, 22, -840)]);
const AIM = new CatmullRomCurve3([v(0, 440, -1200), v(0, 120, -600), v(40, 50, -500), v(0, 40, -900), v(0, 18, -960)]);
const EDGE = [0, 0.22, 0.45, 0.72, 0.88];                                   // S1…S5; 0.88 → 1 is the hold
const EASE = [
  (t: number) => t * t,                                                     // S1→S2 power1.in
  (t: number) => 1 - (1 - t) ** 3,                                          // S2→S3 power2.out
  (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,                          // S3→S4 sine.inOut
  (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),    // S4→S5 power2.inOut
];
const DEG = Math.PI / 180;
const smooth = (a: number, b: number, x: number) => { const t = MathUtils.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
function rig(p: number) {
  if (p >= EDGE[4]) return { i: 3, u: 1, e: 1 };
  let i = 0; while (i < 3 && p >= EDGE[i + 1]) i++;
  const u = (p - EDGE[i]) / (EDGE[i + 1] - EDGE[i]);
  return { i, u, e: EASE[i](u) };
}
const pitchOf = (from: Vector3, to: Vector3) => Math.atan2(to.y - from.y, Math.hypot(to.x - from.x, to.z - from.z));
// P3 pitch: 0° at S1, −20° at S2, −3° at S3; S4 and S5 are framed by their lookAt nodes.
const KEY_PITCH = [0, -20 * DEG, -3 * DEG, pitchOf(POS.points[3], AIM.points[3]), pitchOf(POS.points[4], AIM.points[4])];

function hash(x: number, y: number) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); } // wisp placement

// ── Heightfield (ridges.ts), built in a worker so the main thread never stalls on it.
const PATH_XZ = POS.getSpacedPoints(160).map((p) => [p.x, p.z] as [number, number]);
function ridges(mobile: boolean): Promise<Mesh> {
  const w = new Worker(new URL('./ridges.worker.ts', import.meta.url), { type: 'module' });
  return new Promise((resolve, reject) => {
    w.onerror = (e) => { w.terminate(); reject(e); };
    w.onmessage = (e) => {
      w.terminate();
      const { position, normal, color, index } = e.data as { position: Float32Array; normal: Float32Array; color: Float32Array; index: Uint32Array };
      const g = new BufferGeometry();
      g.setAttribute('position', new BufferAttribute(position, 3)); g.setAttribute('normal', new BufferAttribute(normal, 3));
      g.setAttribute('color', new BufferAttribute(color, 3)); g.setIndex(new BufferAttribute(index, 1));
      resolve(new Mesh(g, new MeshLambertMaterial({ vertexColors: true, flatShading: true })));
    };
    w.postMessage({ mobile, path: PATH_XZ });
  });
}

// ── Sky: night → navy, a saffron horizon band toward the mountain (−z), and one small far peak on the horizon.
const NOISE = `float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h2(i), h2(i + vec2(1, 0)), u.x), mix(h2(i + vec2(0, 1)), h2(i + vec2(1, 1)), u.x), u.y); }
float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * vn(p); p *= 2.03; a *= 0.5; } return s; }`;
function sky() {
  const m = new ShaderMaterial({
    side: BackSide, depthWrite: false, fog: false,
    uniforms: { uBand: { value: 1 }, uPeak: { value: 1 }, uTop: { value: new Color(NIGHT) }, uMid: { value: new Color(NAVY) }, uGlow: { value: new Color(SAFFRON) } },
    vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `varying vec3 vDir; uniform float uBand, uPeak; uniform vec3 uTop, uMid, uGlow;
      void main(){
        float el = vDir.y, az = atan(vDir.x, -vDir.z);
        vec3 c = mix(uMid, uTop, smoothstep(-0.02, 0.45, el));
        float toward = pow(max(0.0, -vDir.z), 2.0);
        c = mix(c, uGlow, uBand * toward * exp(-abs(el - 0.004) * 38.0) * 0.85);
        float peak = step(el, 0.045 * (1.0 - abs(az) / 0.08)) * step(-0.03, el);
        c = mix(c, uMid * 0.8, peak * uPeak);
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }`,
  });
  return new Mesh(new SphereGeometry(9000, 48, 24), m);
}

// ── Cloud deck (top 420 m): stacked horizontal layers of fbm coverage with saffron rims toward the horizon glow.
// Each fades out near the camera (no popping as it passes through) and by the fog.
function cloudLayer(y: number, seed: number) {
  const m = new ShaderMaterial({
    transparent: true, depthWrite: false, fog: false,
    uniforms: { uSeed: { value: seed }, uA: { value: 1 }, uDensity: { value: 0.001 }, uFog: { value: new Color() },
      uBody: { value: new Color(SLATE) }, uRim: { value: new Color(SAFFRON) }, uDark: { value: new Color(NAVY) } },
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `${NOISE}
      varying vec3 vW; uniform float uSeed, uA, uDensity; uniform vec3 uFog, uBody, uRim, uDark;
      void main(){
        vec2 p = vW.xz / 1100.0 + uSeed;
        float n = fbm(p) * 0.75 + fbm(p * 4.0 + 7.0) * 0.25;
        float cover = smoothstep(0.42, 0.62, n);
        if (cover < 0.01) discard;
        float edge = 1.0 - smoothstep(0.62, 0.8, n);                    // thin parts of the cloud catch the light
        float toward = smoothstep(200.0, -3000.0, vW.z);                 // brighter toward the dusk (−z)
        vec3 c = mix(uDark, uBody, smoothstep(0.45, 0.85, n) * 1.3) + uRim * edge * toward * 0.9;
        float d = distance(cameraPosition, vW);
        float f = 1.0 - exp(-pow(d * uDensity, 2.0));
        c = mix(c, uFog, f);
        gl_FragColor = vec4(c, cover * uA * smoothstep(15.0, 90.0, d) * 0.92);
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new Mesh(new PlaneGeometry(14000, 14000), m);
  mesh.rotation.x = -Math.PI / 2; mesh.position.set(0, y, -1500);
  return mesh;
}

// ── Vertical wisps streaming up past the lens while inside the deck (they stop at 0.32).
function wisps() {
  const N = 70, pos = new Float32Array(N * 6), base: number[] = [];
  for (let i = 0; i < N; i++) {
    const x = (hash(i, 1) - 0.5) * 60, z = -12 - hash(i, 2) * 50, len = 4 + hash(i, 3) * 10;
    base.push(hash(i, 4) * 80);
    pos.set([x, 0, z, x, len, z], i * 6);
  }
  const g = new BufferGeometry(); g.setAttribute('position', new BufferAttribute(pos, 3));
  const lines = new LineSegments(g, new LineBasicMaterial({ color: SAND, transparent: true, opacity: 0, depthWrite: false, fog: false }));
  return { lines, base, pos: pos.slice() };
}

// Additive plane: conic rays (Light Rays) or a soft halo, saffron.
function glow(w: number, h: number, rays: boolean) {
  const m = new ShaderMaterial({
    transparent: true, depthWrite: false, blending: AdditiveBlending, fog: false, uniforms: { uA: { value: 0 }, uC: { value: new Color(SAFFRON) } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `varying vec2 vUv; uniform float uA; uniform vec3 uC; void main(){
      vec2 d = vUv - vec2(0.5, 0.18); float r = length(d * vec2(1.0, 0.7));
      ${rays ? 'float a = atan(d.x, d.y); float f = (0.35 + 0.65 * smoothstep(0.5, 0.9, sin(a * 26.0) * 0.5 + 0.5)) * (1.0 - smoothstep(0.05, 0.75, r)) * 0.35 * step(0.0, d.y);' : 'float f = 0.7 * (1.0 - smoothstep(0.0, 0.5, r));'}
      gl_FragColor = vec4(uC * f * uA, 1.0); }`,
  });
  return new Mesh(new PlaneGeometry(w, h), m);
}

export default async function mount(host: HTMLElement, state: SceneState): Promise<SceneHandle> {
  const mobileGPU = matchMedia('(max-width: 1023px)').matches;
  const renderer = new WebGLRenderer({ antialias: !mobileGPU, powerPreference: 'high-performance' });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobileGPU ? 1 : 1.25)); // full-screen scene: pixels are the cost on laptop GPUs

  // Both loaders use their bundled decoders (Vite emits and fingerprints the wasm); they load with this chunk only.
  const draco = new DRACOLoader();
  const ktx2 = new KTX2Loader().detectSupport(renderer);
  const ridgeMesh = ridges(mobileGPU);                                       // starts in the worker now
  const gltf = await new GLTFLoader().setDRACOLoader(draco).setKTX2Loader(ktx2).loadAsync('/models/fero.glb');
  draco.dispose(); ktx2.dispose();

  const scene = new Scene();
  const fog = new FogExp2(0x2a2e52, 0.0005); scene.fog = fog; scene.background = new Color(NIGHT);
  const camera = new PerspectiveCamera(38, 16 / 9, 1, 12000);
  scene.add(camera);

  const skyMesh = sky(); scene.add(skyMesh);
  scene.add(await ridgeMesh);
  scene.add(gltf.scene);
  const deck = new Group();
  [420, 392, 356, 310, 262, 222].forEach((y, i) => deck.add(cloudLayer(y, i * 3.7)));
  scene.add(deck);
  const w = wisps(); camera.add(w.lines);

  // Cave light: a warm key from the cave floor, a saffron rim on both edges, spill at the mouth, rays and a halo.
  const key = new PointLight(SAFFRON, 0, 34, 2); key.position.set(0, 2, TEMPLE_Z + 16); scene.add(key);
  const rimL = new PointLight(SAFFRON, 0, 45, 2); rimL.position.set(-9, 12, TEMPLE_Z - 9); scene.add(rimL);
  const rimR = rimL.clone(); rimR.position.x = 9; scene.add(rimR);
  const spill = new PointLight(SAFFRON, 0, 140, 2); spill.position.set(0, 6, MOUTH_Z + 26); scene.add(spill);
  const rays = glow(40, 46, true); rays.position.set(0, 1, TEMPLE_Z - 18); scene.add(rays);
  const halo = glow(30, 34, false); halo.position.set(0, 4, TEMPLE_Z - 16); scene.add(halo);
  const mouthGlow = glow(60, 40, false); mouthGlow.position.set(0, 4, MOUTH_Z + 6); scene.add(mouthGlow);
  // S2: warm saffron diffused below the camera inside the deck.
  const deckGlow = glow(1400, 1400, false); deckGlow.rotation.x = -Math.PI / 2; deckGlow.position.set(0, 150, 250); scene.add(deckGlow);

  scene.add(new AmbientLight(NAVY, 1.4));
  scene.add(new HemisphereLight(SLATE, NIGHT, 0.9));
  const dusk = new DirectionalLight(SAFFRON, 1.1); dusk.position.set(-200, 120, -3000); scene.add(dusk);
  const sky2 = new DirectionalLight(0xafd9eb, 0.55); sky2.position.set(300, 600, 800); scene.add(sky2);

  const skyU = (skyMesh.material as ShaderMaterial).uniforms;
  const fogCol = new Color(), cDeck = new Color(0x4a4a66), cLow = new Color(0x262a4c), cCave = new Color(0x1b1b3c);
  const eye = new Vector3(), aim = new Vector3();
  let aspect = 16 / 9;

  return {
    canvas: renderer.domElement,
    compile: () => renderer.compileAsync(scene, camera),
    resize(width, height) { renderer.setSize(width, height, false); aspect = width / height; camera.aspect = aspect; camera.updateProjectionMatrix(); },
    render() {
      const p = MathUtils.clamp(state.progress, 0, 1);
      const { i, u, e } = rig(p);
      const t = (i + e) / 4;
      POS.getPoint(t, eye); AIM.getPoint(t, aim);
      camera.position.copy(eye); camera.up.set(0, 1, 0); camera.lookAt(aim);
      // P3 pitch (keyframed, same ease), yaw bump past the last ridge, roll peak at 0.58.
      const pitch = MathUtils.lerp(KEY_PITCH[i], KEY_PITCH[i + 1], e) - pitchOf(eye, aim);
      const yaw = i === 2 ? 14 * DEG * Math.sin(Math.PI * u) : 0;
      const roll = 4 * DEG * (p < 0.58 ? smooth(0.45, 0.58, p) : 1 - smooth(0.58, 0.68, p));
      camera.rotateY(yaw); camera.rotateX(pitch); camera.rotateZ(roll);
      // fov 38° → 30° over the push into the cave; phones (portrait) see the vertical fov × 1.23.
      const fov = i === 3 ? MathUtils.lerp(38, 30, e) : 38;
      camera.fov = fov * (aspect < 1 ? 1.23 : 1); camera.updateProjectionMatrix();

      // Fog: thin above the deck, 0.012 inside it; out of the cloud base at 0.30 it thins to 0.004 by S3, then clears
      // for the reveal.
      const inDeck = smooth(432, 396, eye.y);
      fog.density = p < 0.3 ? 0.0005 + 0.0115 * inDeck
        : p < 0.45 ? MathUtils.lerp(0.012, 0.004, smooth(0.3, 0.45, p))
        : MathUtils.lerp(0.004, 0.0014, smooth(0.45, 0.72, p));
      fogCol.copy(cDeck).lerp(cLow, smooth(0.28, 0.45, p)).lerp(cCave, smooth(0.6, 0.8, p));
      fog.color.copy(fogCol);
      skyU.uBand.value = 1 - 0.7 * smooth(0.1, 0.3, p);                    // the horizon band spreads into the fog
      skyU.uPeak.value = 1 - smooth(0.05, 0.16, p);
      const deckA = 1 - smooth(0.3, 0.4, p);
      deck.visible = deckA > 0;
      for (const l of deck.children) { const uu = ((l as Mesh).material as ShaderMaterial).uniforms; uu.uA.value = deckA; uu.uDensity.value = fog.density; uu.uFog.value.copy(fogCol); }
      // Wisps: stream up past the lens inside the deck, stop at 0.32.
      const wa = smooth(0.12, 0.18, p) * (1 - smooth(0.28, 0.32, p));
      (w.lines.material as LineBasicMaterial).opacity = 0.22 * wa;
      w.lines.visible = wa > 0;
      if (wa > 0) {
        const a = w.lines.geometry.attributes.position as BufferAttribute;
        for (let k = 0; k < w.base.length; k++) {
          const y = ((w.base[k] + p * 900) % 80) - 40;
          a.setY(k * 2, y); a.setY(k * 2 + 1, y + (w.pos[k * 6 + 4]));
        }
        a.needsUpdate = true;
      }
      // Cave light 0 → 1 over 0.60–0.72; rays reach full at 0.84.
      const light = smooth(0.6, 0.72, p), ray = smooth(0.6, 0.84, p);
      key.intensity = 520 * light; rimL.intensity = rimR.intensity = 260 * light; spill.intensity = 2600 * light;
      (rays.material as ShaderMaterial).uniforms.uA.value = 0.8 * ray;
      (halo.material as ShaderMaterial).uniforms.uA.value = 0.6 * light;
      (mouthGlow.material as ShaderMaterial).uniforms.uA.value = 0.22 * light * (1 - smooth(0.76, 0.84, p));
      (deckGlow.material as ShaderMaterial).uniforms.uA.value = 0.55 * smooth(0.08, 0.2, p) * (1 - smooth(0.27, 0.34, p));
      deckGlow.visible = p < 0.34;
      renderer.render(scene, camera);
    },
    dispose() {
      renderer.dispose();
      scene.traverse((o) => { const m = o as Mesh; m.geometry?.dispose(); const mat = m.material as { dispose?: () => void; map?: { dispose(): void } }; mat?.map?.dispose(); mat?.dispose?.(); });
    },
  };
}
