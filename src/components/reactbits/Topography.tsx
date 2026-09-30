// From React Bits (https://reactbits.dev), TS + Tailwind variant. MIT + Commons Clause, Copyright (c) 2026 David Haz.
// Used as part of this website only; not redistributed as a component.
// Cut down to the one setting the site uses (Ambient.tsx): slate #798A96 lines at 22%, speed 0.1, morph 3 / 0.02,
// 2 bands, thickness 0.01, glow 0.2, contrast 3; no mouse, grain, fill, colour modes or light mode.

import { useEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Triangle } from 'ogl';

const vertex = `#version 300 es
in vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

const fragment = `#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform vec4 uCtrlA;
uniform vec4 uCtrlB;
uniform vec4 uCtrlC;
uniform vec4 uCtrlD;
out vec4 fragColor;

float bez(float t, vec4 c) {
  float w = 6.2831853 * t;
  return 0.5 * (c.x * sin(w) + c.y * cos(w) + c.z * sin(2.0 * w) + c.w * cos(2.0 * w));
}

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution;
  float f = 2.0 * distance(vec2(bez(uv.x, uCtrlA), bez(uv.x, uCtrlB)), vec2(bez(uv.y, uCtrlC), bez(uv.y, uCtrlD)));
  float frac = fract(f);
  float lineDist = min(frac, 1.0 - frac);
  float aa = fwidth(f) + 0.0001;
  float mask = 1.0 - smoothstep(0.01 - aa, 0.01 + aa, lineDist);
  float glow = 1.0 - smoothstep(0.01, 0.11 + aa, lineDist);
  float a = pow(clamp(mask + glow * 0.55, 0.0, 1.0), 3.0) * 0.22;
  fragColor = vec4(vec3(0.4745, 0.5412, 0.5882) * a, a); // #798A96, premultiplied
}
`;

const CTRL = [[1, -2, 3, -4], [9, -8, 7, -6], [5, 2, 5, -5], [-1, -3, 8, 9]];

export default function Topography() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = ref.current!;
    const renderer = new Renderer({ webgl: 2, alpha: true, premultipliedAlpha: true, antialias: false, dpr: 1 /* soft background: 1x is enough */ });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    const canvas = gl.canvas as HTMLCanvasElement;
    Object.assign(canvas.style, { width: '100%', height: '100%', display: 'block' });
    host.appendChild(canvas);

    const ctrl = CTRL.map(() => new Float32Array(4));
    const program = new Program(gl, {
      vertex, fragment,
      uniforms: {
        iResolution: { value: new Float32Array([1, 1]) },
        uCtrlA: { value: ctrl[0] }, uCtrlB: { value: ctrl[1] }, uCtrlC: { value: ctrl[2] }, uCtrlD: { value: ctrl[3] },
      },
    });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    const t0 = performance.now();
    const draw = (t: number) => {
      const time = (t - t0) * 0.001;
      CTRL.forEach((idx, g) => idx.forEach((i, j) => (ctrl[g][j] = 3 * Math.sin(time * 0.1 * Math.sin(i * 0.02) + i))));
      renderer.render({ scene: mesh });
    };
    const ro = new ResizeObserver(() => {
      renderer.setSize(Math.max(1, Math.floor(host.clientWidth)), Math.max(1, Math.floor(host.clientHeight)));
      program.uniforms.iResolution.value.set([gl.drawingBufferWidth, gl.drawingBufferHeight]);
      draw(performance.now());
    });
    ro.observe(host);

    let raf = 0;
    const loop = (t: number) => { draw(t); raf = requestAnimationFrame(loop); };
    // Only animate while on screen (rAF already pauses in hidden tabs).
    const io = new IntersectionObserver(([e]) => {
      cancelAnimationFrame(raf);
      if (e.isIntersecting) raf = requestAnimationFrame(loop);
    });
    io.observe(host);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      canvas.remove();
    };
  }, []);

  return <div ref={ref} className="relative h-full w-full overflow-hidden" />;
}
