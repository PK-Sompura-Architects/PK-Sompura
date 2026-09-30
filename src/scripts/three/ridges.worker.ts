// Builds the Fero heightfield off the main thread, so scrolling never waits for it.
import { buildRidges } from './ridges';

self.onmessage = (e: MessageEvent<{ mobile: boolean; path: [number, number][] }>) => {
  const r = buildRidges(e.data.mobile, e.data.path);
  (self as unknown as Worker).postMessage(r, [r.position.buffer, r.normal.buffer, r.color.buffer, r.index.buffer]);
};
