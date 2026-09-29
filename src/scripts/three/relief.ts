// Scene 1: the carved panel under raking light (Board 05 P1), and the same panel being cut by a toolpath (P2).
// The relief is a height field evaluated per pixel: no mesh or texture download beyond the shared stone tile.
// [A2] Stand-in panel following the poster geometry (frame, dentils, grooves, rosette, bosses, diamonds).
// When the real CNC panel arrives, replace h() with a lookup into its height map.
import { Mesh, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial, SRGBColorSpace, TextureLoader, RepeatWrapping, Vector2, WebGLRenderer } from 'three';
import type { SceneHandle, SceneState } from './boot';

const frag = /* glsl */ `
precision highp float;
uniform vec2 uRes;       // canvas size in px
uniform float uAz;       // light azimuth in degrees (30 → 70)
uniform float uCut;      // toolpath position 0..1 (screen x); < 0 = no toolpath
uniform sampler2D uStone;
uniform float uSteps;    // shadow march steps
varying vec2 vUv;

const vec3 SAND = vec3(0.957, 0.937, 0.902);
const vec3 STONE = vec3(0.906, 0.875, 0.824);
const vec3 NAVY = vec3(0.149, 0.149, 0.329);
const vec3 SAFFRON = vec3(0.804, 0.533, 0.255);
const vec3 SLATE_DEEP = vec3(0.322, 0.376, 0.420);
const float EL = 0.2094;  // light elevation, 12°
const float DEPTH = 0.6;  // relief depth in panel units per height unit

float box(vec2 q, vec2 a, vec2 b, float bev) { vec2 d = min(q - a, b - q); return smoothstep(0.0, bev, min(d.x, d.y)); }

// Height of the panel at q (panel units: 70.4 × 88, y down, like the poster's cqh units).
float h(vec2 q) {
  float H = 1.0 * box(q, vec2(3.3), vec2(67.1, 84.7), 0.5);           // raised slab
  H -= 0.7 * box(q, vec2(5.6), vec2(64.8, 82.4), 0.6);                // recessed field
  float pitch = (70.4 - 18.0 - 2.6) / 10.0;                           // 11 dentils, top and bottom
  float i = clamp(floor((q.x - 9.0) / pitch + 0.5), 0.0, 10.0);
  float x0 = 9.0 + i * pitch;
  H += 0.8 * box(q, vec2(x0, 8.0), vec2(x0 + 2.6, 10.6), 0.35);
  H += 0.8 * box(q, vec2(x0, 77.4), vec2(x0 + 2.6, 80.0), 0.35);
  H -= 0.6 * box(q, vec2(9.0, 14.0), vec2(12.4, 74.0), 0.6);          // side grooves
  H -= 0.6 * box(q, vec2(58.0, 14.0), vec2(61.4, 74.0), 0.6);
  vec2 c = vec2(35.2, 44.0);
  vec2 d = q - c; float r = length(d); float a = atan(d.x, -d.y);
  H += 1.1 * smoothstep(21.1, 20.3, r);                               // rosette disc
  H -= 0.7 * smoothstep(16.5, 15.8, r);                               // recessed ring
  float s12 = floor(a / 0.5236 + 0.5) * 0.5236;                       // 12 bosses
  H += 0.6 * smoothstep(0.9, 0.2, length(q - (c + 14.2 * vec2(sin(s12), -cos(s12)))));
  H += 1.2 * smoothstep(11.75, 11.1, r);                              // inner disc
  H -= 0.7 * smoothstep(7.0, 6.4, r);                                 // inner recess
  H += 1.1 * sqrt(max(0.0, 1.0 - r * r / 10.9));                      // centre boss (dome, r 3.3)
  float s8 = floor(a / 0.7854 + 0.5) * 0.7854;                        // 8 diamonds
  vec2 l = q - (c + 27.7 * vec2(sin(s8), -cos(s8)));
  H += 0.9 * smoothstep(0.0, 0.6, 3.32 - (abs(l.x) + abs(l.y)));
  return H;
}

void main() {
  vec2 px = vUv * uRes;
  float unit = uRes.y / 100.0;                   // 1 panel unit = 1% of the frame height (cqh)
  vec2 q = (px - 0.5 * uRes) / unit;             // centred, y up
  q = vec2(q.x + 35.2, 44.0 - q.y);              // panel coords, y down
  vec3 stone = STONE * (0.94 + 0.12 * texture2D(uStone, px / 512.0).r);

  // Toolpath: right of the cutter the slab is uncarved, with raster passes.
  float cutX = uCut * uRes.x;
  bool uncut = uCut >= 0.0 && px.x > cutX;

  float H = uncut ? 0.0 : h(q);
  vec3 col = stone;
  if (!uncut) {
    float e = 0.15;
    float hx = (h(q + vec2(e, 0.0)) - h(q - vec2(e, 0.0))) / (2.0 * e);
    float hy = (h(q + vec2(0.0, e)) - h(q - vec2(0.0, e))) / (2.0 * e);
    vec3 N = normalize(vec3(-hx * DEPTH, hy * DEPTH, 1.0));      // hy flips: panel y is down
    float az = radians(uAz);
    vec3 L = normalize(vec3(-cos(az) * cos(EL), sin(az) * cos(EL), sin(EL)));
    // Soft cast shadow: march toward the light across the height field.
    vec2 dir = normalize(vec2(-cos(az), -sin(az)));              // panel y down
    float sh = 0.0, h0 = H * DEPTH;
    for (float k = 1.0; k <= 24.0; k++) {
      if (k > uSteps) break;
      float t = k * 0.35;
      float rise = h(q + dir * t) * DEPTH - h0 - t * tan(EL);
      sh = max(sh, smoothstep(0.0, 0.15, rise));
    }
    float lit = clamp(0.5 + 2.0 * (dot(N, L) - sin(EL)), 0.0, 1.0) * mix(1.0, 0.2, sh);
    vec3 shadowCol = mix(STONE, NAVY, 0.45);                     // deepest: navy at 45% over stone
    col = lit < 0.5 ? mix(shadowCol, stone, lit * 2.0) : mix(stone, SAND, (lit - 0.5) * 2.0);
    // Height tint: raised faces a shade lighter, recesses a shade darker, so forms read as solids, not outlines.
    col = mix(col, SAND, clamp(H * 0.14, 0.0, 0.3));
    col = mix(col, shadowCol, clamp(-H * 0.28, 0.0, 0.35));
  } else {
    float line = step(6.0, mod(px.y, 7.0));
    col = mix(stone, SLATE_DEEP, 0.16 * line);
  }
  // Grade: warm light from upper left, cool shade to lower right (118°).
  vec2 g = vUv; float gt = clamp(dot(vec2(g.x, 1.0 - g.y), normalize(vec2(0.88, 0.47))) / 1.1, 0.0, 1.0);
  col = mix(col, SAND, 0.38 * (1.0 - smoothstep(0.0, 0.34, gt)));
  col = mix(col, vec3(0.055, 0.055, 0.122), 0.42 * smoothstep(0.55, 1.0, gt));
  if (uCut >= 0.0) {
    float dx = abs(px.x - cutX);
    col = mix(col, SAFFRON, clamp(1.0 - dx / 1.5, 0.0, 1.0));                 // cutter line, 2 px
    col = mix(col, SAFFRON, 0.55 * exp(-dx * dx / 200.0) * step(1.5, dx));    // glow 14 px
    float ring = abs(length(px - vec2(cutX, 0.62 * uRes.y)) - 1.5 * unit);   // cutter head at 38% from top
    col = mix(col, SAFFRON, clamp(1.2 - ring, 0.0, 1.0));
  }
  gl_FragColor = vec4(col, 1.0);
}`;

export default function mount(host: HTMLElement, state: SceneState, mode: 'hero' | 'toolpath'): SceneHandle {
  const renderer = new WebGLRenderer({ antialias: false, powerPreference: 'low-power' });
  renderer.outputColorSpace = SRGBColorSpace;
  const mobile = matchMedia('(max-width: 1023px)').matches;
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));
  const stone = new TextureLoader().load('/tex/stone.webp');
  stone.wrapS = stone.wrapT = RepeatWrapping;
  const mat = new ShaderMaterial({
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy * 2.0, 0.0, 1.0); }',
    fragmentShader: frag,
    uniforms: {
      uRes: { value: new Vector2(1, 1) }, uAz: { value: 30 }, uCut: { value: mode === 'toolpath' ? 0.56 : -1 },
      uStone: { value: stone }, uSteps: { value: mobile ? 12 : 24 },
    },
  });
  const scene = new Scene();
  scene.add(new Mesh(new PlaneGeometry(1, 1), mat));
  const camera = new OrthographicCamera();
  const canvas = renderer.domElement;

  let az = 30;
  return {
    canvas,
    resize(w, h) {
      renderer.setSize(w, h, false);
      mat.uniforms.uRes.value.set(w * renderer.getPixelRatio(), h * renderer.getPixelRatio());
    },
    render() {
      if (mode === 'hero') {
        // Light azimuth 30° → 70° across the hero's scroll range, ±10° from the cursor; damped follow (lerp 0.08).
        const target = 30 + 40 * state.progress + 10 * state.pointer;
        az += (target - az) * (state.still ? 1 : 0.08);
        mat.uniforms.uAz.value = az;
      } else {
        mat.uniforms.uCut.value = state.progress; // cutter 0 → 1, scrubbed
      }
      renderer.render(scene, camera);
    },
    dispose() { renderer.dispose(); mat.dispose(); stone.dispose(); },
  };
}
