// Renders the posters from the real three.js scenes (same camera and light as the live canvas), replacing the
// stand-ins. Usage (project root):  npm run build  then  node tools/posters/render-3d.mjs  then  python tools/posters/render.py --real
// Needs Google Chrome, and no other `astro preview` running (Astro allows one at a time).
// Needs Google Chrome. Writes PNGs to tools/posters/out/ (not committed); render.py --real encodes them.
import puppeteer from 'puppeteer-core';
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 4399;
const OUT = new URL('./out/', import.meta.url);
fs.mkdirSync(OUT, { recursive: true });

// name: [still param, css width, css height] rendered at device scale 2 → export size
const JOBS = {
  hero: ['hero:0', 1200, 675],
  'hero-m': ['hero:0', 480, 600],
  toolpath: ['toolpath:0.56', 1200, 600],
  'toolpath-m': ['toolpath:0.56', 480, 560],
  'mountain-k3': ['mountain-k3:0.7', 1200, 675],
  'mountain-k3-m': ['mountain-k3:0.7', 480, 747],
};

const server = spawn(`npx astro preview --port ${PORT}`, { shell: true, stdio: 'ignore' });
for (let i = 0; i < 60; i++) { // wait for the preview server (up to 30 s)
  try { if ((await fetch(`http://localhost:${PORT}/`)).ok) break; } catch {}
  await new Promise((r) => setTimeout(r, 500));
}
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
try {
  for (const [name, [still, w, h]] of Object.entries(JOBS)) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
    await page.goto(`http://localhost:${PORT}/?still=${still}`, { waitUntil: 'networkidle0' });
    const sel = `[data-scene="${still.split(':')[0]}"]`;
    await page.waitForSelector(`${sel}[data-still-ready]`, { timeout: 20000 });
    // Pull the frame out of the layout at the export size; the scene re-renders on resize.
    await page.$eval(sel, (el, [w, h]) => Object.assign(el.style, {
      position: 'fixed', left: '0', top: '0', width: `${w}px`, height: `${h}px`, margin: '0', zIndex: '9999', aspectRatio: 'auto',
      // The mountain canvas is transparent: give the export the section's own ground (contours, grain, night).
      ...(el.dataset.scene === 'mountain-k3' ? { background: 'repeating-radial-gradient(ellipse 120% 90% at 50% 92%, rgb(121 138 150 / 0) 0 24px, rgb(121 138 150 / .22) 24px 25px), url(/tex/grain-night.webp), #0E0E1F' } : {}),
    }), [w, h]);
    await new Promise((r) => setTimeout(r, 1200));
    await page.evaluate(() => window.dispatchEvent(new Event('resize')));
    await new Promise((r) => setTimeout(r, 600));
    await (await page.$(sel)).screenshot({ path: new URL(`${name}.png`, OUT).pathname.slice(1) });
    console.log('rendered', name, `${w * 2}×${h * 2}`);
    await page.close();
  }
} finally {
  await browser.close();
  server.kill();
  spawnSync('npx astro preview stop', { shell: true, stdio: 'ignore' }); // the shell child can outlive kill() on Windows
}
