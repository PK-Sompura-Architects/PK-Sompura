import { useEffect, useRef, useState } from 'react';
import LightRays from './reactbits/LightRays';
import Topography from './reactbits/Topography';
import { afterLoad } from '../scripts/after-load';

// Ambient WebGL backgrounds (React Bits), recoloured to the palette. Desktop only: the pages hydrate this island with
// client:media="(min-width: 1024px) and (pointer: fine)", so phones and tablets never load it and keep the CSS still frame. The still frame is also the
// reduced-motion / no-WebGL / Save-Data state; it fades out once the canvas is live ([data-live] in global.css).
type Kind = 'rays' | 'topo';

const canRun = () => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  if ((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData) return false;
  try { return !!document.createElement('canvas').getContext('webgl'); } catch { return false; }
};

export default function Ambient({ kind }: { kind: Kind }) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);

  // The shader compiles after the page has loaded, so it never blocks the first paint or input.
  useEffect(() => afterLoad(() => setOn(canRun())), []);
  useEffect(() => {
    if (!on) return;
    const host = ref.current?.closest('[data-ambient]');
    host?.setAttribute('data-live', '');
    return () => host?.removeAttribute('data-live');
  }, [on]);

  // Always render a box: client:visible needs one to observe (astro-island itself is display: contents).
  return (
    <div ref={ref} className="absolute inset-0">
      {on && <>
      {kind === 'rays' && (
        // Rays stay at or below 25% saffron behind text (Board 01 §8). Measured: the shader's glow is ~7% saffron (p99)
        // at full opacity, so the layer runs at 75% (≈21%).
        <div className="h-full w-full opacity-75">
          <LightRays />
        </div>
      )}
      {kind === 'topo' && <Topography />}
      </>}
    </div>
  );
}
