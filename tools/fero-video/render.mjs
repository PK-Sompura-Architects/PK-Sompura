// Renders the Fero Works fly-through offline and encodes it.
//   node tools/fero-video/render.mjs stills [desktop|mobile] [p1,p2,…]   test frames → tools/fero-video/out/stills
//   node tools/fero-video/render.mjs video [desktop|mobile|both]         frames → MP4 (H.264) + WebM (VP9) + poster
// Frames: 8 s at 30 fps, fixed time step; the canvas draws at pixel ratio 2 with MSAA and the page is captured at 1×,
// so each frame is 2× supersampled. Outputs go to public/video/ (fero-desktop.*, fero-mobile.*, poster AVIF + WebP).
// Needs Google Chrome; ffmpeg comes from the ffmpeg-static devDependency. Run from the project root.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import puppeteer from 'puppeteer-core';
import ffmpeg from 'ffmpeg-static';
import sharp from 'sharp';

const ROOT = process.cwd(), OUT = path.join(ROOT, 'tools/fero-video/out'), PUB = path.join(ROOT, 'public/video');
const SIZES = { desktop: [1920, 1080], mobile: [1080, 1920] };
const FPS = 30, SECONDS = 8, FRAMES = FPS * SECONDS;
// Encoding targets (per the brief): desktop MP4 ≈ 2–3 MB, mobile MP4 ≈ 1–1.5 MB, WebM a little smaller.
const RATE = { desktop: { mp4: '2600k', webm: '2100k' }, mobile: { mp4: '1250k', webm: '1000k' } };

const [mode = 'stills', which = 'desktop', list] = process.argv.slice(2);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.wasm': 'application/wasm' };
const server = http.createServer((req, res) => {
  const f = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(f)] ?? 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(4398);

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new',
  args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-unsafe-webgpu'],
});

async function open(kind) {
  const [w, h] = SIZES[kind];
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.error('page error:', e.message));
  page.on('console', (m) => m.type() === 'error' && console.error('console:', m.text()));
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  const t0 = Date.now();
  await page.goto(`http://localhost:4398/tools/fero-video/index.html?w=${w}&h=${h}`);
  await page.waitForFunction('window.ready === true', { timeout: 0, polling: 500 });
  console.log(`${kind}: scene built in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  return page;
}
const shot = async (page, p, n, file) => {
  await page.evaluate((p, t, n) => window.scene.frame(p, t, n), p, n / FPS, n);
  await page.screenshot({ path: file, type: 'png', optimizeForSpeed: true });
};

try {
  if (mode === 'stills') {
    fs.mkdirSync(path.join(OUT, 'stills'), { recursive: true });
    const page = await open(which);
    for (const p of (list ?? '0,0.15,0.3,0.45,0.6,0.72,0.8,1').split(',').map(Number)) {
      const f = path.join(OUT, 'stills', `${which}-${p.toFixed(2)}.png`);
      const t = Date.now(); await shot(page, p, Math.round(p * (FRAMES - 1)), f);
      console.log(`  p=${p.toFixed(2)} → ${path.basename(f)} (${Date.now() - t} ms)`);
    }
  } else {
    fs.mkdirSync(PUB, { recursive: true });
    for (const kind of which === 'both' ? ['desktop', 'mobile'] : [which]) {
      const dir = path.join(OUT, `frames-${kind}`); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
      const page = await open(kind); const t0 = Date.now();
      for (let n = 0; n < FRAMES; n++) {
        await shot(page, n / (FRAMES - 1), n, path.join(dir, `f${String(n).padStart(4, '0')}.png`));
        if (n % 30 === 29) console.log(`  ${kind}: ${n + 1}/${FRAMES} frames, ${((Date.now() - t0) / 1000).toFixed(0)} s`);
      }
      await page.close();
      const src = ['-y', '-hide_banner', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(dir, 'f%04d.png')];
      const base = path.join(PUB, `fero-${kind}`);
      // H.264 MP4, two-pass to the target rate, fast start so it plays while downloading.
      for (const pass of [1, 2]) execFileSync(ffmpeg, [...src, '-c:v', 'libx264', '-preset', 'slow', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
        '-b:v', RATE[kind].mp4, '-pass', String(pass), '-passlogfile', path.join(OUT, `x264-${kind}`), '-an', '-movflags', '+faststart',
        ...(pass === 1 ? ['-f', 'mp4', 'NUL'] : [`${base}.mp4`])]);
      // VP9 WebM, two-pass.
      for (const pass of [1, 2]) execFileSync(ffmpeg, [...src, '-c:v', 'libvpx-vp9', '-b:v', RATE[kind].webm, '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2',
        '-pix_fmt', 'yuv420p', '-pass', String(pass), '-passlogfile', path.join(OUT, `vp9-${kind}`), '-an',
        ...(pass === 1 ? ['-f', 'webm', 'NUL'] : [`${base}.webm`])]);
      // The final frame as the poster.
      const last = path.join(dir, `f${String(FRAMES - 1).padStart(4, '0')}.png`);
      await sharp(last).avif({ quality: 55, effort: 6 }).toFile(`${base}-poster.avif`);
      await sharp(last).webp({ quality: 80 }).toFile(`${base}-poster.webp`);
      for (const ext of ['mp4', 'webm']) console.log(`  ${path.basename(base)}.${ext}: ${(fs.statSync(`${base}.${ext}`).size / 1048576).toFixed(2)} MB`);
      for (const ext of ['avif', 'webp']) console.log(`  ${path.basename(base)}-poster.${ext}: ${(fs.statSync(`${base}-poster.${ext}`).size / 1024).toFixed(0)} KB`);
    }
  }
} finally {
  await browser.close(); server.close();
}
