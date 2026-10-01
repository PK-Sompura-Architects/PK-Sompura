// Link-preview images (Open Graph / Twitter), 1200 × 630 JPEG, rendered from HTML in headless Chrome with the site's
// own fonts and images:
//   public/og/default.jpg            the logo, name and tagline on sand, with the hero's temple drawing
//   public/og/projects/<id>.jpg      each project that has a photo: the photo, with its name on a sand panel
// Run from the project root after the photos are exported:  node tools/og/render.mjs
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const ROOT = process.cwd(), OUT = path.join(ROOT, 'public/og');
const projects = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/projects.json'), 'utf8'));
const media = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/media.json'), 'utf8'));
const TYPES = { '.html': 'text/html', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const f = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(f)] ?? 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(4397);

const font = (pkg, file) => `/node_modules/@fontsource/${pkg}/files/${file}`;
const css = `
  @font-face { font-family: Caslon; src: url(${font('libre-caslon-display', 'libre-caslon-display-latin-400-normal.woff2')}); }
  @font-face { font-family: Hanken; src: url(${font('hanken-grotesk', 'hanken-grotesk-latin-500-normal.woff2')}); }
  @font-face { font-family: Plex; src: url(${font('ibm-plex-mono', 'ibm-plex-mono-latin-500-normal.woff2')}); }
  * { margin: 0; box-sizing: border-box; }
  body { width: 1200px; height: 630px; overflow: hidden; background: #F4EFE6 url(/public/tex/sand.webp); color: #262654; position: relative; }
  .mono { font: 500 20px/1.3 Plex; letter-spacing: .08em; text-transform: uppercase; color: #52606B; }
  .logo { width: 84px; height: auto; }`;
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const page = (body) => `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${body}</body></html>`;

const DEFAULT = page(`
  <div style="position:absolute;left:72px;top:64px;display:flex;align-items:center;gap:20px">
    <img class="logo" src="/public/logo-fill.webp"><span style="font:400 40px/1 Caslon">P.K. Sompura</span></div>
  <h1 style="position:absolute;left:72px;top:206px;font:400 92px/.96 Caslon;letter-spacing:-.01em">Where<br>Devotion<br>Meets Stone.</h1>
  <p class="mono" style="position:absolute;left:72px;bottom:58px;font-size:16px">Temple Architect &amp; Contractor · Palitana, Gujarat</p>
  <img src="/public/hero-temple.svg" style="position:absolute;right:48px;top:52px;height:520px">`);

const card = (p, img) => page(`
  <img src="${img}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">
  <div style="position:absolute;left:0;bottom:0;width:640px;padding:36px 48px 40px 56px;background:#F4EFE6 url(/public/tex/sand.webp)">
    <p class="mono" style="font-size:17px">Temple Register · P.K. Sompura</p>
    <p style="font:400 64px/1.02 Caslon;margin-top:14px">${esc(p.name)}</p>
    <p class="mono" style="margin-top:14px;font-size:18px;color:#262654">${esc([p.place && [p.place, p.state].join(', '), p.type].filter(Boolean).join(' · '))}</p>
  </div>`);

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
try {
  const tab = await browser.newPage();
  await tab.setViewport({ width: 1200, height: 630 });
  const shoot = async (html, file) => {
    fs.writeFileSync(path.join(ROOT, 'tools/og/_card.html'), html);
    await tab.goto('http://localhost:4397/tools/og/_card.html', { waitUntil: 'networkidle0' });
    await tab.evaluate(() => document.fonts.ready);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    await tab.screenshot({ path: file, type: 'jpeg', quality: 82 });
    console.log(`${path.relative(ROOT, file)}  ${(fs.statSync(file).size / 1024).toFixed(0)} KB`);
  };
  await shoot(DEFAULT, path.join(OUT, 'default.jpg'));
  for (const p of projects) {
    const id = p.photos?.[0]?.src, m = id && media[id];
    if (!m) continue;
    const w = m.widths.includes(1600) ? 1600 : m.widths.at(-1);
    await shoot(card(p, `/public/media/${id}-${w}.webp`), path.join(OUT, 'projects', `${p.id}.jpg`));
  }
} finally {
  fs.rmSync(path.join(ROOT, 'tools/og/_card.html'), { force: true });
  await browser.close(); server.close();
}
