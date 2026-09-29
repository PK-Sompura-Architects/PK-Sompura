import { useEffect, useRef, useState } from 'react';
import LightRays from './reactbits/LightRays';
import Topography from './reactbits/Topography';
import LineWaves from './reactbits/LineWaves';

// Ambient WebGL backgrounds (React Bits), recoloured to the palette. The CSS still frame underneath is the
// reduced-motion / no-WebGL / Save-Data state; it fades out once the canvas is live ([data-live] in global.css).
type Kind = 'rays' | 'topo' | 'waves';

const canRun = () => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  if ((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData) return false;
  try { return !!document.createElement('canvas').getContext('webgl'); } catch { return false; }
};

export default function Ambient({ kind }: { kind: Kind }) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => { setOn(canRun()); }, []);
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
          <LightRays raysOrigin="top-center" raysColor="#CD8841" raysSpeed={0.3} lightSpread={0.9} rayLength={1.6}
            followMouse={false} mouseInfluence={0} fadeDistance={0.9} />
        </div>
      )}
      {kind === 'topo' && (
        <Topography lowColor="#798A96" midColor="#798A96" highColor="#798A96" colorMode="uniform" speed={0.1}
          morphSpeed={0.02} opacity={0.22} glow={0.2} grain={false} mouseInteraction={false} />
      )}
      {kind === 'waves' && (
        // Light mode on sand. At 50% the darkest line pixel stays at least as light as sky, so navy text
        // crossing the waves keeps ≥ 9.38:1 (Handoff §1: navy on sky allowed; deep slate is masked out).
        <div className="h-full w-full opacity-50">
          <LineWaves color1="#AFD9EB" color2="#AFD9EB" color3="#AFD9EB" speed={0.2} lightMode
            enableMouseInteraction={false} colorCycleSpeed={0} brightness={0.9} />
        </div>
      )}
      </>}
    </div>
  );
}
