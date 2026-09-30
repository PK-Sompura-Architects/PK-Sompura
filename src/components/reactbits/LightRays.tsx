// From React Bits (https://reactbits.dev), TS + Tailwind variant. MIT + Commons Clause, Copyright (c) 2026 David Haz.
// Used as part of this website only; not redistributed as a component.
// Cut down to the one setting the site uses (Ambient.tsx): top-centre saffron rays, speed 0.3, spread 0.9,
// length 1.6, fade 0.9, no mouse, noise, distortion, pulse or light mode.

import { useEffect, useRef } from 'react';
import { Renderer, Program, Triangle, Mesh } from 'ogl';

const vertex = `
attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }`;

const fragment = `precision highp float;
uniform float iTime;
uniform vec2 iResolution;

float rayStrength(vec2 src, vec2 coord, float seedA, float seedB, float speed) {
  vec2 d = coord - src;
  float cosAngle = dot(normalize(d), vec2(0.0, 1.0));
  float spread = pow(max(cosAngle, 0.0), 1.0 / 0.9);
  float dist = length(d);
  float maxDist = iResolution.x * 1.6;
  float lengthFalloff = clamp((maxDist - dist) / maxDist, 0.0, 1.0);
  float fadeFalloff = clamp((iResolution.x * 0.9 - dist) / (iResolution.x * 0.9), 0.5, 1.0);
  float base = clamp((0.45 + 0.15 * sin(cosAngle * seedA + iTime * speed)) +
                     (0.3 + 0.2 * cos(-cosAngle * seedB + iTime * speed)), 0.0, 1.0);
  return base * lengthFalloff * fadeFalloff * spread;
}

void main() {
  vec2 coord = vec2(gl_FragCoord.x, iResolution.y - gl_FragCoord.y);
  vec2 src = vec2(0.5 * iResolution.x, -0.2 * iResolution.y);
  vec4 c = vec4(1.0) * (rayStrength(src, coord, 36.2214, 21.11349, 0.45) * 0.5 +
                        rayStrength(src, coord, 22.3991, 18.0234, 0.33) * 0.4);
  float b = 1.0 - coord.y / iResolution.y;
  c.x *= 0.1 + b * 0.8;
  c.y *= 0.3 + b * 0.6;
  c.z *= 0.5 + b * 0.5;
  c.rgb *= vec3(0.8039, 0.5333, 0.2549); // #CD8841
  gl_FragColor = c;
}`;

export default function LightRays() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = ref.current!;
    const renderer = new Renderer({ dpr: 1 /* soft background: 1x is enough */, alpha: true });
    const gl = renderer.gl;
    gl.canvas.style.width = '100%';
    gl.canvas.style.height = '100%';
    host.appendChild(gl.canvas);

    const program = new Program(gl, { vertex, fragment, uniforms: { iTime: { value: 0 }, iResolution: { value: [1, 1] } } });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    const size = () => {
      renderer.setSize(host.clientWidth, host.clientHeight);
      program.uniforms.iResolution.value = [gl.drawingBufferWidth, gl.drawingBufferHeight];
    };
    let raf = 0;
    const loop = (t: number) => {
      program.uniforms.iTime.value = t * 0.001;
      renderer.render({ scene: mesh });
      raf = requestAnimationFrame(loop);
    };
    // Only animate while on screen.
    const io = new IntersectionObserver(([e]) => {
      cancelAnimationFrame(raf);
      if (e.isIntersecting) raf = requestAnimationFrame(loop);
    }, { threshold: 0.1 });

    addEventListener('resize', size);
    size();
    io.observe(host);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      removeEventListener('resize', size);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      gl.canvas.remove();
    };
  }, []);

  return <div ref={ref} className="relative z-[3] h-full w-full overflow-hidden pointer-events-none" />;
}
