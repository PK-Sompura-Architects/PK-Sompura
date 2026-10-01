// Local link-preview checker. Reads every built page in dist/, checks its Open Graph / Twitter tags, canonical URL
// and LocalBusiness JSON-LD, fetches each og:image from the local preview server (the site address is mapped to it)
// and checks it is a 1200 × 630 image, then draws preview cards for a few pages to tools/og/out/.
//   npm run build && npx astro preview --port 4322   then   node tools/og/check.mjs [port]
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import sharp from 'sharp';

const ROOT = process.cwd(), DIST = path.join(ROOT, 'dist'), OUT = path.join(ROOT, 'tools/og/out');
const LOCAL = `http://localhost:${process.argv[2] ?? 4322}`;
const SITE = /site:\s*'([^']+)'/.exec(fs.readFileSync(path.join(ROOT, 'astro.config.mjs'), 'utf8'))[1];
const REQUIRED = ['og:title', 'og:description', 'og:image', 'og:type', 'og:url', 'twitter:card', 'twitter:image'];

const pages = [];
(function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p) : f.endsWith('.html') && pages.push(p); } })(DIST);

const meta = (html) => {
  const m = {};
  for (const [, k, v] of html.matchAll(/<meta (?:property|name)="([^"]+)" content="([^"]*)"/g)) m[k] = v.replace(/&amp;/g, '&').replace(/&#39;/g, "'");
  m.canonical = /<link rel="canonical" href="([^"]+)"/.exec(html)?.[1];
  m.ld = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html)?.[1];
  m.title = /<title>([^<]*)<\/title>/.exec(html)?.[1];
  return m;
};
const imgCache = new Map();
async function checkImage(url) {
  if (imgCache.has(url)) return imgCache.get(url);
  const res = await fetch(url.replace(SITE, LOCAL));
  const r = res.ok ? await sharp(Buffer.from(await res.arrayBuffer())).metadata().then((x) => `${x.width}x${x.height} ${x.format}`) : `HTTP ${res.status}`;
  imgCache.set(url, r); return r;
}

const rows = [], problems = [];
for (const file of pages.sort()) {
  const rel = '/' + path.relative(DIST, file).replace(/\\/g, '/').replace(/index\.html$/, '').replace(/\.html$/, '');
  const m = meta(fs.readFileSync(file, 'utf8'));
  const miss = REQUIRED.filter((k) => !m[k]);
  const img = m['og:image'] ? await checkImage(m['og:image']) : 'none';
  let ld = 'missing';
  try { const j = JSON.parse(m.ld); ld = j['@type'] === 'LocalBusiness' && j.telephone && j.email && j.address?.streetAddress && j.sameAs?.length ? 'ok' : 'incomplete'; } catch {}
  const canonOk = rel === '/404' || m.canonical === new URL(rel, SITE).href;
  const bad = [...miss.map((k) => `missing ${k}`), img !== '1200x630 jpeg' && `image ${img}`, ld !== 'ok' && `JSON-LD ${ld}`, !canonOk && `canonical ${m.canonical}`,
    m['twitter:card'] && m['twitter:card'] !== 'summary_large_image' && 'twitter:card'].filter(Boolean);
  rows.push({ page: rel, image: m['og:image']?.replace(SITE, ''), status: bad.length ? bad.join('; ') : 'ok' });
  if (bad.length) problems.push(rel);
}
console.table(rows);
console.log(`${pages.length} pages, ${problems.length} with problems${problems.length ? ': ' + problems.join(', ') : ''}. Site address: ${SITE}`);

// Preview cards, drawn the way WhatsApp and X show a shared link.
fs.mkdirSync(OUT, { recursive: true });
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const tab = await browser.newPage(); await tab.setViewport({ width: 1100, height: 100, deviceScaleFactor: 1 });
const cards = [];
for (const rel of ['/', '/contact', '/projects/vaishno-devi-gulbarga', '/projects/godiji-derasar']) {
  const f = path.join(DIST, rel === '/' ? 'index.html' : `${rel.slice(1)}/index.html`);
  const m = meta(fs.readFileSync(f, 'utf8')), host = new URL(SITE).host;
  cards.push(`<div class="pair"><p class="lbl">${rel}</p>
    <div class="wa"><img src="${m['og:image'].replace(SITE, LOCAL)}"><div class="t"><b>${m['og:title']}</b><span>${m['og:description']}</span><i>${host}</i></div></div>
    <div class="x"><img src="${m['twitter:image'].replace(SITE, LOCAL)}"><div class="t"><i>${host}</i><b>${m['twitter:title']}</b></div></div></div>`);
}
await tab.setContent(`<style>body{margin:0;padding:24px;background:#e9edef;font:15px/1.35 system-ui,sans-serif;display:grid;gap:28px}
  .pair{display:grid;grid-template-columns:440px 520px;gap:24px;align-items:start}.lbl{grid-column:1/3;margin:0;font:600 13px monospace;color:#555}
  .wa{background:#d9fdd3;border-radius:10px;padding:5px}.wa img{width:100%;border-radius:7px;display:block}.wa .t{background:#f0f5ef;padding:8px 10px;border-radius:0 0 7px 7px;display:grid;gap:3px}
  .wa span{color:#555;font-size:13px}.wa i{color:#777;font-size:12px;font-style:normal}
  .x{border:1px solid #cfd9de;border-radius:16px;overflow:hidden;background:#fff;position:relative}.x img{width:100%;display:block}
  .x .t{position:absolute;left:12px;bottom:12px;display:grid;gap:4px}.x .t i,.x .t b{background:rgba(0,0,0,.77);color:#fff;font-style:normal;font-size:13px;padding:2px 6px;border-radius:4px;width:fit-content}</style>${cards.join('')}`, { waitUntil: 'networkidle0' });
await tab.screenshot({ path: path.join(OUT, 'previews.png'), fullPage: true });
await browser.close();
console.log('preview cards: tools/og/out/previews.png');
process.exitCode = problems.length ? 1 : 0;
