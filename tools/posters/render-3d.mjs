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
  // Fero Works fly-through (Posters P3): shots S1–S5 at their progress points, 2400×1350 and 1080×1920.
  ...Object.fromEntries([[1, 0], [2, 0.22], [3, 0.45], [4, 0.72], [5, 1]].flatMap(([n, p]) => [
    [`fw-s${n}`, [`fero:${p}`, 1200, 675]], [`fw-s${n}-m`, [`fero:${p}`, 540, 960]]])),
};

const server = spawn(`npx astro preview --port ${PORT}`, { shell: true, stdio: 'ignore' });
for (let i = 0; i < 60; i++) { // wait for the preview server (up to 30 s)
  try { if ((await fetch(`http://localhost:${PORT}/`)).ok) break; } catch {}
  await new Promise((r) => setTimeout(r, 500));
}
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
try {
  // ONLY=<regex> renders a subset, e.g. ONLY=^fw- while iterating on one scene.
  for (const [name, [still, w, h]] of Object.entries(JOBS).filter(([n]) => !process.env.ONLY || new RegExp(process.env.ONLY).test(n))) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
    await page.goto(`http://localhost:${PORT}/?still=${still}`, { waitUntil: 'networkidle0' });
    const sel = `[data-scene="${still.split(':')[0]}"]`;
    await page.waitForSelector(`${sel}[data-still-ready]`, { timeout: 20000 });
    // Pull the frame out of the layout at the export size; the scene re-renders on resize.
    await page.$eval(sel, (el, [w, h]) => Object.assign(el.style, {
      position: 'fixed', left: '0', top: '0', width: `${w}px`, height: `${h}px`, margin: '0', zIndex: '9999', aspectRatio: 'auto',
    }), [w, h]);
    await new Promise((r) => setTimeout(r, 1200));
    await page.evaluate(() => window.dispatchEvent(new Event('resize')));
    await new Promise((r) => setTimeout(r, 600));
    // Posters are the scene alone: hide the HTML layered in the stage (chapter text, scrims, the old poster).
    await page.$eval(sel, (el) => el.querySelectorAll(':scope > :not(canvas)').forEach((n) => (n.style.visibility = 'hidden')));
    await (await page.$(sel)).screenshot({ path: new URL(`${name}.png`, OUT).pathname.slice(1) });
    console.log('rendered', name, `${w * 2}×${h * 2}`);
    await page.close();
  }
} finally {
  await browser.close();
  server.kill();
  spawnSync('npx astro preview stop', { shell: true, stdio: 'ignore' }); // the shell child can outlive kill() on Windows
}
