// Scene 2: the artificial mountain that opens (Board 05 P3). Pinned for 250vh; scroll progress drives K1 → K4.
// Built from three.js primitives in code: no mesh or texture download. The canvas is transparent, so the
// section's night ground, Topography contours and grain show through, as in the poster.
import {
  AdditiveBlending, AmbientLight, BoxGeometry, Color, ConeGeometry, DirectionalLight, DoubleSide, ExtrudeGeometry, Group,
  LatheGeometry, Mesh, MeshBasicMaterial, MeshStandardMaterial, PerspectiveCamera, PlaneGeometry, PointLight, Scene,
  ShaderMaterial, Shape, SphereGeometry, SRGBColorSpace, TorusGeometry, Vector2, WebGLRenderer,
} from 'three';
import type { SceneHandle, SceneState } from './boot';

const SAND = 0xf4efe6, STONE = 0xe7dfd2, SAFFRON = 0xcd8841;

// Keyframes from Board 05 / Mountain Poster: [progress, offset % of view width, glow, rays, rim, seam].
const K = [
  [0.0, 0, 0.18, 0, 0.08, 0.5],
  [0.35, 7, 0.55, 0.45, 0.25, 0.8],
  [0.7, 29, 1, 1, 0.38, 0],
  [0.85, 29, 1, 1, 0.38, 0], // hold: a rest the eye can read
  [1.0, 33, 0.8, 0.6, 0.3, 0],
];
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2); // power2.inOut
function frame(p: number) {
  let i = 0;
  while (i < K.length - 2 && p > K[i + 1][0]) i++;
  const [a, b] = [K[i], K[i + 1]];
  const t = easeInOut(Math.min(1, Math.max(0, (p - a[0]) / (b[0] - a[0] || 1))));
  return a.map((v, j) => v + (b[j] - v) * t);
}

// Rock half: the poster's jagged silhouette, extruded, with horizontal strata cut into the faces.
function rockHalf(width: number, height: number, mirror: boolean) {
  const pts = [[0, 1], [0, 0.58], [0.14, 0.5], [0.26, 0.54], [0.4, 0.34], [0.52, 0.38], [0.66, 0.16], [0.78, 0.2], [0.9, 0.06], [1, 0.1], [1, 1]];
  const s = new Shape();
  pts.forEach(([x, y], i) => {
    const X = (mirror ? 1 - x : x) * width, Y = (1 - y) * height;
    i ? s.lineTo(X, Y) : s.moveTo(X, Y);
  });
  const g = new ExtrudeGeometry(s, { depth: 4, bevelEnabled: true, bevelThickness: 0.25, bevelSize: 0.18, bevelSegments: 1 });
  g.translate(mirror ? 0 : -width, 0, -2);
  const m = new MeshStandardMaterial({ color: 0x262654, roughness: 0.95, flatShading: true });
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vLocal;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLocal = position;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vLocal;')
      .replace('#include <dithering_fragment>', `#include <dithering_fragment>
        float edge = ${mirror ? '1.0 - vLocal.x' : '1.0 + vLocal.x'} / ${width.toFixed(2)};
        gl_FragColor.rgb = mix(gl_FragColor.rgb * vec3(0.37, 0.37, 0.53), gl_FragColor.rgb * vec3(1.3, 1.5, 1.6), clamp(edge, 0.0, 1.0));
        gl_FragColor.rgb *= 1.0 - 0.25 * step(0.93, fract((vLocal.y + vLocal.x * ${mirror ? '-0.18' : '0.18'}) * 3.1));`);
  };
  return new Mesh(g, m);
}

// Nagara shikhara profile: a curvilinear tower, with bands.
function tower(r0: number, hgt: number, seg: number) {
  const p: Vector2[] = [];
  for (let i = 0; i <= 24; i++) {
    const y = (i / 24) * hgt;
    const band = i % 3 === 0 ? 0.04 : 0;
    p.push(new Vector2(Math.max(0.02, r0 * (1 - (y / hgt) ** 1.7) ** 0.85 + band * r0), y));
  }
  return new LatheGeometry(p, seg);
}

function temple() {
  const g = new Group();
  const stone = new MeshStandardMaterial({ color: SAND, roughness: 0.85, flatShading: true });
  const smooth = new MeshStandardMaterial({ color: SAND, roughness: 0.8 }); // towers: white stone, bands from the profile
  const add = (geo: any, x = 0, y = 0, z = 0, mat = stone) => { const m = new Mesh(geo, mat); m.position.set(x, y, z); g.add(m); return m; };
  add(new BoxGeometry(3.2, 0.35, 2.2), 0, 0.175, 0.2);                       // plinth
  add(new BoxGeometry(2.1, 1.1, 1.6), 0, 0.9, 0.2);                          // mandapa
  add(new PlaneGeometry(0.42, 0.72), 0, 0.72, 1.01, new MeshBasicMaterial({ color: SAFFRON })); // lit doorway
  add(tower(0.8, 2.9, 24), 0, 1.45, 0, smooth);                              // main shikhara
  add(tower(0.34, 1.3, 20), -1.0, 1.45, 0.3, smooth);                        // urushringas
  add(tower(0.34, 1.3, 20), 1.0, 1.45, 0.3, smooth);
  add(new TorusGeometry(0.2, 0.08, 6, 14), 0, 4.38, 0).rotation.x = Math.PI / 2; // amalaka
  add(new SphereGeometry(0.09, 10, 8), 0, 4.55, 0, new MeshStandardMaterial({ color: SAFFRON, roughness: 0.5 })); // kalash
  add(new BoxGeometry(0.025, 0.75, 0.025), 0, 4.95, 0, new MeshStandardMaterial({ color: STONE }));              // flagpole
  const flag = add(new ConeGeometry(0.16, 0.34, 3), 0.17, 5.18, 0, new MeshBasicMaterial({ color: SAFFRON, side: DoubleSide }));
  flag.rotation.z = -Math.PI / 2;
  return g;
}

// Additive plane with a radial glow or conic rays (the poster's Light Rays inside the mountain).
function glowPlane(size: number, rays: boolean) {
  const m = new ShaderMaterial({
    transparent: true, depthWrite: false, blending: AdditiveBlending,
    uniforms: { uA: { value: 0 }, uC: { value: new Color(SAFFRON) } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `varying vec2 vUv; uniform float uA; uniform vec3 uC;
      void main(){ vec2 d = vUv - 0.5; float r = length(d) * 2.0;
        ${rays ? 'float a = atan(d.y, d.x); float s = step(0.75, fract(a / 0.1396)); float f = s * (1.0 - smoothstep(0.0, 1.0, r)) * 0.22;'
               : 'float f = 0.55 * (1.0 - smoothstep(0.0, 0.42, r)) + 0.12 * (1.0 - smoothstep(0.42, 0.84, r));'}
        gl_FragColor = vec4(uC * f * uA, 1.0); }`,
  });
  return new Mesh(new PlaneGeometry(size, size), m);
}

export default function mount(host: HTMLElement, state: SceneState): SceneHandle {
  const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  const mobile = matchMedia('(max-width: 1023px)').matches;
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));

  const scene = new Scene();
  const camera = new PerspectiveCamera(30, 16 / 9, 0.1, 100);
  const VIEW_W = 16, H = 7.56; // world width at z = 0 on desktop; rock height = 84% of a 9-unit frame
  const left = rockHalf(VIEW_W * 0.505, H, false);
  const right = rockHalf(VIEW_W * 0.505, H, true);
  const rocks = new Group(); rocks.add(left, right); rocks.position.y = -4.5; scene.add(rocks);
  const t = temple(); t.position.set(0, -4.5 + 0.9, -0.2); t.scale.setScalar(0.95); scene.add(t);
  const glow = glowPlane(9, false); glow.position.set(0, -4.5 + 3.3, -1.2); scene.add(glow);
  const rays = glowPlane(16, true); rays.position.set(0, -4.5 + 3.9, -1.6); scene.add(rays);
  const seam = new Mesh(new PlaneGeometry(0.05, 6.8), new MeshBasicMaterial({ color: SAFFRON, transparent: true }));
  seam.position.set(0, -4.5 + 3.4, 2.3); scene.add(seam);

  scene.add(new AmbientLight(0x262654, 1.1));
  scene.add(new AmbientLight(0xf4efe6, 0.35)); // keeps the stone white rather than lamp-coloured
  const moon = new DirectionalLight(0xafd9eb, 0.9); moon.position.set(-6, 8, 6); scene.add(moon);
  const lamp = new PointLight(SAFFRON, 0, 14, 1.4); lamp.position.set(0, -4.5 + 1.6, 2.2); scene.add(lamp);
  const rim = new PointLight(SAFFRON, 0, 10, 1.2); rim.position.set(0, -4.5 + 3.5, -1.4); scene.add(rim);

  const canvas = renderer.domElement;
  let aspect = 16 / 9;
  return {
    canvas,
    resize(w, h) {
      renderer.setSize(w, h, false);
      aspect = w / h; camera.aspect = aspect;
      // Desktop frames a fixed width; portrait (mobile 9:14) frames a narrower slice so the temple stays large.
      const visW = aspect >= 1 ? VIEW_W : 7.2;
      const dist = visW / aspect / 2 / Math.tan((camera.fov * Math.PI) / 360);
      camera.position.set(0, aspect >= 1 ? -0.4 : 0.2, dist);
      camera.lookAt(0, aspect >= 1 ? -0.6 : -0.3, 0);
      camera.updateProjectionMatrix();
    },
    render() {
      const [, off, g, r, rimA, s] = frame(state.progress);
      const dx = (off / 100) * (aspect >= 1 ? VIEW_W : 7.2 * 1.6);
      left.position.x = -dx; right.position.x = dx;
      (glow.material as ShaderMaterial).uniforms.uA.value = g;
      (rays.material as ShaderMaterial).uniforms.uA.value = r;
      lamp.intensity = 7 * g; rim.intensity = 10 * rimA * 2.5;
      (seam.material as MeshBasicMaterial).opacity = s;
      renderer.render(scene, camera);
    },
    dispose() {
      renderer.dispose();
      scene.traverse((o) => { const m = o as Mesh; m.geometry?.dispose(); (m.material as any)?.dispose?.(); });
    },
  };
}
