// Offline Fero Works fly-through (design/Posters.dc.html P3), rendered frame by frame by render.mjs. Same camera
// path, timing and palette as the site's real-time scene (src/scripts/three/fero.ts), with what real time couldn't
// afford: dense geometry, a carved rock cave, a detailed Nagara temple, volumetric-looking clouds (36 layers of 3D
// noise), ridges to the horizon, soft shadows, MSAA at pixel ratio 2, a light bloom and dithering against banding.
import {
  ACESFilmicToneMapping, AdditiveBlending, AmbientLight, BackSide, BufferAttribute, CatmullRomCurve3, Color,
  DirectionalLight, FogExp2, Group, HalfFloatType, HemisphereLight, MathUtils, Mesh, MeshStandardMaterial,
  PCFSoftShadowMap, PerspectiveCamera, PlaneGeometry, PointLight, Scene, ShaderMaterial, SphereGeometry,
  SRGBColorSpace, Vector2, Vector3, WebGLRenderer, WebGLRenderTarget, NoToneMapping,
} from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { MOUTH_Z, TEMPLE_Z, MOUNT_C, cave, fbm, hash, mountain, smooth, temple } from './geometry.js';

const NIGHT = 0x0e0e1f, NAVY = 0x262654, SLATE = 0x798a96, SLATE_DEEP = 0x52606b, SAFFRON = 0xcd8841, SAND = 0xf4efe6, STONE = 0xe7dfd2;

// ── Camera rig (P3 nodes). The last node is pulled back and lowered from the real-time version so the whole temple,
// base included, sits inside the arch in the final shot (fov 38 → 34 instead of 30).
const v = (x, y, z) => new Vector3(x, y, z);
const POS = new CatmullRomCurve3([v(0, 520, 900), v(0, 360, 520), v(-60, 70, 0), v(70, 55, -520), v(0, 15, -812)]);
const AIM = new CatmullRomCurve3([v(0, 440, -1200), v(0, 120, -600), v(40, 50, -500), v(0, 40, -900), v(0, 12.5, -960)]);
const EDGE = [0, 0.22, 0.45, 0.72, 0.88];
const EASE = [(t) => t * t, (t) => 1 - (1 - t) ** 3, (t) => -(Math.cos(Math.PI * t) - 1) / 2, (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2)];
const DEG = Math.PI / 180;
function rig(p) {
  if (p >= EDGE[4]) return { i: 3, u: 1, e: 1 };
  let i = 0; while (i < 3 && p >= EDGE[i + 1]) i++;
  const u = (p - EDGE[i]) / (EDGE[i + 1] - EDGE[i]);
  return { i, u, e: EASE[i](u) };
}
const pitchOf = (a, b) => Math.atan2(b.y - a.y, Math.hypot(b.x - a.x, b.z - a.z));
const KEY_PITCH = [0, -20 * DEG, -3 * DEG, pitchOf(POS.points[3], AIM.points[3]), pitchOf(POS.points[4], AIM.points[4])];

const GLSL_NOISE = `
float h3(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float vn3(vec3 p){ vec3 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), u.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), u.x), u.y),
             mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), u.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), u.x), u.y), u.z); }
float fbm3(vec3 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 6; i++) { s += a * vn3(p); p = p * 2.03 + 11.7; a *= 0.5; } return s; }`;

// ── Sky: night → navy with a saffron dusk band toward the mountain (−z) and one far peak on the horizon.
function sky() {
  const m = new ShaderMaterial({
    side: BackSide, depthWrite: false, fog: false,
    uniforms: { uBand: { value: 1 }, uPeak: { value: 1 }, uTop: { value: new Color(NIGHT) }, uMid: { value: new Color(NAVY) }, uGlow: { value: new Color(SAFFRON) } },
    vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `varying vec3 vDir; uniform float uBand, uPeak; uniform vec3 uTop, uMid, uGlow;
      void main(){
        float el = vDir.y, az = atan(vDir.x, -vDir.z);
        vec3 c = mix(uMid, uTop, smoothstep(-0.02, 0.5, el));
        float toward = pow(max(0.0, -vDir.z), 2.0);
        c = mix(c, uGlow, uBand * toward * exp(-abs(el - 0.004) * 30.0) * 0.8);
        c += uGlow * 0.12 * uBand * toward * exp(-abs(el) * 6.0);
        float peak = step(el, 0.045 * (1.0 - abs(az) / 0.08)) * step(-0.03, el);
        c = mix(c, uMid * 0.8, peak * uPeak);
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  return new Mesh(new SphereGeometry(9500, 64, 32), m);
}

// ── The cloud deck: 36 thin layers through one 3D noise field, so the deck reads as volume (tops lit, bases dark,
// saffron where the dusk comes through the thin parts). Each layer fades near the camera and into the fog.
function cloudLayer(y, y0, y1) {
  const m = new ShaderMaterial({
    transparent: true, depthWrite: false, fog: false,
    uniforms: { uY: { value: y }, uStep: { value: (y1 - y0) / 35 }, uT: { value: 0 }, uA: { value: 1 }, uDensity: { value: 0.001 }, uFog: { value: new Color() },
      uBody: { value: new Color(SLATE) }, uRim: { value: new Color(SAFFRON) }, uDark: { value: new Color(NAVY) }, uLo: { value: y0 }, uHi: { value: y1 } },
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `${GLSL_NOISE}
      varying vec3 vW; uniform float uY, uStep, uT, uA, uDensity, uLo, uHi; uniform vec3 uFog, uBody, uRim, uDark;
      void main(){
        float hN = (uY - uLo) / (uHi - uLo);                                   // 0 at the base, 1 at the top
        float yj = uY + (h3(vec3(gl_FragCoord.xy, uY)) - 0.5) * uStep;          // jitter each slice's height: no banding
        vec3 q = vec3(vW.x / 950.0 + uT * 0.003, yj / 120.0, vW.z / 950.0);
        float n = fbm3(q) + 0.22 * (fbm3(q * 4.0 + 3.0) - 0.5);
        float bell = smoothstep(0.0, 0.3, hN) * (1.0 - smoothstep(0.45, 1.0, hN));   // billows round off at the top
        float dens = smoothstep(0.47, 0.6, n + 0.22 * bell + 0.02);
        if (dens < 0.01) discard;
        float nl = fbm3(q + vec3(0.0, 0.16, -0.05));                           // toward the light: up and toward the dusk
        float lit = clamp(0.15 + 0.75 * hN + (n - nl) * 3.2, 0.0, 1.0);         // faces toward the light are brighter
        float toward = smoothstep(300.0, -3500.0, vW.z);
        vec3 c = mix(uDark * 0.9, uBody * 1.1, lit);
        c += uRim * (pow(1.0 - dens, 2.0) * 0.6 + 0.35 * lit * hN) * toward * (0.3 + 0.7 * lit);
        float d = distance(cameraPosition, vW);
        c = mix(c, uFog, 1.0 - exp(-pow(d * uDensity, 2.0)));
        gl_FragColor = vec4(c, dens * 0.2 * uA * smoothstep(8.0, 70.0, d));
      }`,
  });
  const mesh = new Mesh(new PlaneGeometry(16000, 16000), m);
  mesh.rotation.x = -Math.PI / 2; mesh.position.set(0, y, -1500);
  return mesh;
}

// ── Ridges: the valley's ridge layers (as the site's ridges.ts) plus far ranges out to the horizon and wide flanks,
// so the frame is filled at every point of the flight. Atmospheric colour comes from the fog.
function ridges(path) {
  const LAYERS = [[-130, 58], [-280, 72], [-450, 90], [-660, 110], [-1350, 120], [-1800, 165], [-2400, 210], [-3100, 260]];
  const SPURS = [[-100, -470, 60, 96], [-20, -625, 48, 78]];
  const ridged = (x, y) => { let s = 0, a = 0.6, f = 1; for (let i = 0; i < 5; i++) { const n = 1 - Math.abs(fbm(x * f, y * f, 1) * 2 - 1); s += a * n * n; f *= 2.2; a *= 0.5; } return s; };
  const pz = path.map((p) => p[1]);
  const first = (z) => { let lo = 0, hi = pz.length; while (lo < hi) { const m = (lo + hi) >> 1; pz[m] > z + 150 ? (lo = m + 1) : (hi = m); } return lo; };
  const height = (x, z) => {
    let h = 0;
    for (const [zc, a] of LAYERS) {
      const d = Math.abs(z - (zc + 70 * (fbm(x * 0.003 + zc, 3) - 0.5)));
      const prof = Math.max(0, 1 - d / (90 + 60 * fbm(x * 0.01, zc))) ** 1.3;
      if (prof > 0) h = Math.max(h, prof * a * (0.5 + 0.55 * ridged(x * 0.005 + zc * 0.1, zc * 0.013)));
    }
    h = Math.max(h, 160 * smooth(900, 2600, Math.abs(x)) * (0.6 + 0.6 * ridged(x * 0.002, z * 0.002)));   // flanks
    for (const [sx, sz, r, a] of SPURS) {
      const e = Math.exp(-((x - sx) ** 2 + (z - sz) ** 2) / (2 * r * r));
      if (e > 1e-3) h = Math.max(h, a * e * (0.8 + 0.4 * ridged(x * 0.02, z * 0.02)));
    }
    h += 5 * fbm(x * 0.04, z * 0.04) + 1.2 * fbm(x * 0.3, z * 0.3, 2);
    let d2 = 150 * 150;
    for (let i = first(z); i < path.length && path[i][1] >= z - 150; i++) d2 = Math.min(d2, (x - path[i][0]) ** 2 + (z - path[i][1]) ** 2);
    h *= 0.3 + 0.7 * smooth(25, 140, Math.sqrt(d2));
    h *= smooth(150, 250, Math.hypot(x - MOUNT_C.x, z - MOUNT_C.z));
    return h - 1;
  };
  const g = new PlaneGeometry(7600, 4600, 1100, 640);
  g.rotateX(-Math.PI / 2); g.translate(0, 0, -1300);
  const pos = g.attributes.position.array, col = new Float32Array(pos.length);
  const lo = new Color(NIGHT), mid = new Color(NAVY), hi = new Color(SLATE_DEEP), c = new Color();
  for (let i = 0; i < pos.length; i += 3) {
    const y = height(pos[i], pos[i + 2]); pos[i + 1] = y;
    c.copy(lo).lerp(mid, smooth(0, 35, y)).lerp(hi, smooth(45, 140, y) * 0.8).toArray(col, i);
  }
  g.setAttribute('color', new BufferAttribute(col, 3));
  const flatG = g.toNonIndexed(); flatG.computeVertexNormals();
  const mesh = new Mesh(flatG, new MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true }));
  mesh.receiveShadow = true;
  return mesh;
}

function glow(w, h, rays) {
  const m = new ShaderMaterial({
    transparent: true, depthWrite: false, blending: AdditiveBlending, fog: false, uniforms: { uA: { value: 0 }, uC: { value: new Color(SAFFRON) } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `varying vec2 vUv; uniform float uA; uniform vec3 uC; void main(){
      vec2 d = vUv - vec2(0.5, 0.18); float r = length(d * vec2(1.0, 0.7));
      ${rays ? 'float a = atan(d.x, d.y); float f = (0.35 + 0.65 * smoothstep(0.5, 0.9, sin(a * 26.0) * 0.5 + 0.5)) * (1.0 - smoothstep(0.05, 0.48, r)) * 0.3 * step(0.0, d.y);      // falls to 0 inside the plane: no visible edges' : 'float f = 0.7 * (1.0 - smoothstep(0.0, 0.5, r));'}
      gl_FragColor = vec4(uC * f * uA, 1.0); }`,
  });
  return new Mesh(new PlaneGeometry(w, h), m);
}

// Dither (±0.5 of an 8-bit step, blue-ish noise from the pixel position and frame) so the dark gradients don't band
// once encoded.
const Dither = {
  uniforms: { tDiffuse: { value: null }, uF: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uF; varying vec2 vUv;
    float r(vec2 p){ return fract(sin(dot(p + uF, vec2(12.9898, 78.233))) * 43758.5453); }
    void main(){ vec4 c = texture2D(tDiffuse, vUv); c.rgb += (r(gl_FragCoord.xy) + r(gl_FragCoord.yx + 3.1) - 1.0) / 255.0; gl_FragColor = c; }`,
};

export async function build(canvas, width, height) {
  const renderer = new WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(2); renderer.setSize(width, height, false);
  renderer.outputColorSpace = SRGBColorSpace; renderer.toneMapping = NoToneMapping;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = PCFSoftShadowMap;

  const scene = new Scene();
  const fog = new FogExp2(0x2a2e52, 0.0005); scene.fog = fog; scene.background = new Color(NIGHT);
  const camera = new PerspectiveCamera(38, width / height, 1, 14000); scene.add(camera);
  const skyMesh = sky(); scene.add(skyMesh);
  scene.add(ridges(POS.getSpacedPoints(200).map((p) => [p.x, p.z])));

  const rock = new MeshStandardMaterial({ color: 0x3a3f66, roughness: 1, flatShading: true });
  const mtn = new Mesh(mountain(), rock); mtn.receiveShadow = mtn.castShadow = true; scene.add(mtn);
  const cv = cave();
  const caveRock = new MeshStandardMaterial({ color: 0x2c2c4e, roughness: 1, flatShading: true });
  const walls = new Mesh(cv.walls, caveRock); walls.receiveShadow = true; scene.add(walls);
  const rim = new Mesh(cv.rim, new MeshStandardMaterial({ color: 0x40456e, roughness: 1, flatShading: true })); rim.castShadow = rim.receiveShadow = true; scene.add(rim);

  const t = temple();
  const mat = (color, o = {}) => new MeshStandardMaterial({ color, roughness: 0.82, flatShading: true, ...o });
  for (const [g, m] of [[t.stone, mat(STONE)], [t.light, mat(SAND)], [t.saffron, mat(SAFFRON, { roughness: 0.45, emissive: new Color(SAFFRON), emissiveIntensity: 0.25 })],
    [t.dark, mat(0x1b1b3c)], [t.door, mat(SAFFRON, { emissive: new Color(0xffb35c), emissiveIntensity: 1.1 })]]) {
    const me = new Mesh(g, m); me.castShadow = me.receiveShadow = true; scene.add(me);
  }

  const deck = new Group();
  const Y0 = 212, Y1 = 432, N = 36;
  for (let i = 0; i < N; i++) deck.add(cloudLayer(Y0 + ((Y1 - Y0) * i) / (N - 1), Y0, Y1));
  scene.add(deck);

  // Cave light: a warm key in front of the temple (soft shadows), a saffron rim either side, spill at the mouth.
  const key = new PointLight(SAFFRON, 0, 70, 2); key.position.set(-9, 15, TEMPLE_Z + 20); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 6; key.shadow.bias = -0.002; scene.add(key);
  const rimL = new PointLight(SAFFRON, 0, 50, 2); rimL.position.set(-11, 14, TEMPLE_Z - 10); scene.add(rimL);
  const rimR = rimL.clone(); rimR.position.x = 11; scene.add(rimR);
  const floorL = new PointLight(0xffb35c, 0, 30, 2); floorL.position.set(0, 1.2, TEMPLE_Z + 9); scene.add(floorL);
  const spill = new PointLight(SAFFRON, 0, 160, 2); spill.position.set(0, 8, MOUTH_Z + 20); scene.add(spill);
  const rays = glow(46, 52, true); rays.position.set(0, 1, TEMPLE_Z - 20); scene.add(rays);
  const halo = glow(34, 38, false); halo.position.set(0, 5, TEMPLE_Z - 18); scene.add(halo);
  const deckGlow = glow(1600, 1600, false); deckGlow.rotation.x = -Math.PI / 2; deckGlow.position.set(0, 150, 250); scene.add(deckGlow);

  scene.add(new AmbientLight(NAVY, 1.3));
  scene.add(new HemisphereLight(SLATE, NIGHT, 0.85));
  const dusk = new DirectionalLight(SAFFRON, 1.2); dusk.position.set(-200, 160, -3000); scene.add(dusk);
  const sky2 = new DirectionalLight(0xafd9eb, 0.85); sky2.position.set(300, 500, 800); scene.add(sky2);

  const rt = new WebGLRenderTarget(width * 2, height * 2, { type: HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, rt);
  composer.setPixelRatio(2); composer.setSize(width, height);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new Vector2(width, height), 0.28, 0.5, 0.9);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const dither = new ShaderPass(Dither); composer.addPass(dither);

  const skyU = skyMesh.material.uniforms;
  const fogCol = new Color(), cDeck = new Color(0x4a4a66), cLow = new Color(0x262a4c), cCave = new Color(0x1b1b3c);
  const eye = new Vector3(), aim = new Vector3(), aspect = width / height;

  function frame(p, time, n) {
    const { i, u, e } = rig(p);
    const tt = (i + e) / 4;
    POS.getPoint(tt, eye); AIM.getPoint(tt, aim);
    camera.position.copy(eye); camera.up.set(0, 1, 0); camera.lookAt(aim);
    const pitch = MathUtils.lerp(KEY_PITCH[i], KEY_PITCH[i + 1], e) - pitchOf(eye, aim);
    const yaw = i === 2 ? 14 * DEG * Math.sin(Math.PI * u) : 0;
    const roll = 4 * DEG * (p < 0.58 ? smooth(0.45, 0.58, p) : 1 - smooth(0.58, 0.68, p));
    camera.rotateY(yaw); camera.rotateX(pitch); camera.rotateZ(roll);
    const fov = i === 3 ? MathUtils.lerp(38, 34, e) : 38;
    camera.fov = fov * (aspect < 1 ? 1.23 : 1); camera.updateProjectionMatrix();

    const inDeck = smooth(440, 400, eye.y);
    fog.density = p < 0.3 ? 0.0005 + 0.0055 * inDeck : p < 0.45 ? MathUtils.lerp(0.006, 0.0035, smooth(0.3, 0.45, p)) : MathUtils.lerp(0.0035, 0.0011, smooth(0.45, 0.72, p));
    fogCol.copy(cDeck).lerp(cLow, smooth(0.28, 0.45, p)).lerp(cCave, smooth(0.6, 0.8, p));
    fog.color.copy(fogCol);
    skyU.uBand.value = 1 - 0.7 * smooth(0.1, 0.3, p);
    skyU.uPeak.value = 1 - smooth(0.05, 0.16, p);
    const deckA = 1 - smooth(0.3, 0.4, p);
    deck.visible = deckA > 0;
    for (const l of deck.children) { const uu = l.material.uniforms; uu.uA.value = deckA; uu.uDensity.value = fog.density; uu.uFog.value.copy(fogCol); uu.uT.value = time; }
    const light = smooth(0.6, 0.72, p), ray = smooth(0.6, 0.84, p);
    key.intensity = 750 * light; rimL.intensity = rimR.intensity = 380 * light; floorL.intensity = 60 * light; spill.intensity = 2600 * light;
    rays.material.uniforms.uA.value = 0.4 * ray;
    halo.material.uniforms.uA.value = 0.3 * light;
    deckGlow.material.uniforms.uA.value = 0.55 * smooth(0.08, 0.2, p) * (1 - smooth(0.27, 0.34, p));
    deckGlow.visible = p < 0.34;
    dither.uniforms.uF.value = n;
    composer.render();
  }
  // Compile everything once up front.
  frame(0, 0, 0); frame(0.95, 0, 0);
  return { frame };
}
