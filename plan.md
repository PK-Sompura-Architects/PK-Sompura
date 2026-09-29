# P.K. Sompura: website plan

The main idea we build on. Research and evidence are in `research/`; the reasoning behind each choice is in the published directions page. This file records the decisions.

---

## 1. The idea in one paragraph

**Carved in Sandstone.** A light, material-led site on a pale sandstone ground with navy ink, where type and relief look cut into stone rather than printed. The opening shot is one of the firm's own carved panels, rebuilt in 3D and lit by a low raking light that moves as you scroll. In the CNC chapter a toolpath sweeps across the same panel and carves it live. Halfway down, the tone deepens into night for the **one big 3D moment**: an artificial mountain that opens to reveal the temple inside, which is the work nobody else does. Projects are presented as a **Temple Register**, an archive that works whether or not a project has photographs.

Line from the company's own material: **"Where Devotion Meets Stone."**

---

## 2. Facts the site may state

| Fact | Status |
|---|---|
| P.K. Sompura · Temple Architect & Contractor · Palitana, Gujarat | confirmed |
| Family practice, three generations | confirmed |
| **Over 51 projects completed** | confirmed by client |
| About 21 projects documented with photos | confirmed; these are the register entries with images |
| Five CNC machines, owned | confirmed by client (the archive shows 3–4 of them) |
| Artificial mountain temples: Vaishno Devi Ahmedabad, Vaishno Devi Gulbarga (Karnataka) | confirmed |
| Contact: +91 92278 66635 · pksompura35@gmail.com · Instagram `p.k_sompura` | confirmed |
| Three lines of work: Fero Works (mountain temples), Stone Works (hand carving), CNC Works | from the company PDF |

**Not used until confirmed:** "more than 40 years", the second phone number (…66634), the grandfather's name. Nothing on the site depends on dates.

**Rules from the brief:** English only. No photographs of the family. No identifiable faces at all by default.

---

## 3. Site structure

A single long homepage carries the story; projects get their own pages.

```
/                  Home (the story, below)
/projects          The Temple Register (all projects)
/projects/[slug]   One project (works with or without photos)
/contact           Contact and visiting the Palitana workshop
```

### Homepage, top to bottom

1. **Hero: the carved panel.** A 3D relief of a real sandstone panel from the archive, lit by raking light that shifts with scroll (the cursor on desktop). Headline "Where Devotion Meets Stone" with the firm name and line. Poster image underneath at all times.
2. **The family.** A short paragraph on three generations of temple building in Palitana. It brightens word by word as you scroll (Scroll Reveal) but is fully readable at rest.
3. **Numbers.** 3 generations · 51+ projects · 5 CNC machines (Count Up, with final values in the HTML).
4. **Stone Works.** Hand carving in sandstone and marble to Shilpa Shastra geometry. Close-up photographs of their panels; headings filled with sandstone texture (Masked Heading).
5. **CNC Works.** The toolpath carving the hero panel live, with Line Waves behind. The workshop photographs (machines cleaned of date stamps).
6. **Fero Works: the fly-through.** The page turns to night and the chapter becomes a scroll-scrubbed flight, in five shots:
   1. Above a cloud layer at dusk: night palette, a saffron glow on the horizon. Chapter title "Fero Works · Artificial mountain temples" overlaid as HTML.
   2. Descent through the clouds: the fog thickens, then clears.
   3. Low over a range of rocky ridges, the camera banking gently along the valley.
   4. Round the last ridge to reveal an artificial mountain with a cave mouth; inside, the white-stone shikhara temple lit warm saffron, Light Rays behind it. The one-line description is overlaid as HTML.
   5. Hold on the temple, then hand off to the build sequence as stacked plates (Scroll Stack): sketch → model → foundation → rock shell → finished Gulbarga temple.

   The chapter text is HTML over the stage and never waits for the canvas.
7. **Selected projects.** Five or six register entries with the best photographs, and a link to the full register.
8. **Contact.** Phone, email, Instagram and workshop address as plain text, with Light Rays behind.

---

## 4. The Temple Register

- **51+ projects in total; about 21 with photos.** Each project is one entry in a typed content collection. An entry needs only a name and a place; everything else is optional.
- Fields: `name`, `place`, `state`, `type` (e.g. Jain derasar, Hindu temple, mountain temple, bhavan), `scope` (any of design, hand carving, CNC, construction, Fero/mountain), `photos` (optional), `featured` (optional), `note` (optional).
- **No dates anywhere.** Sorting is by place or by type.
- **Display:** a list of rows (Flowing Menu). On hover or tap a row shows its place, type and scope; a photo appears only if one exists. Entries without photos get a typographic card (name, place, scope marks), not a grey placeholder.
- Rows can be filtered by place and by scope.
- The ~30 projects without photos are added as a list the client provides; until then the register shows the documented ones and states "over 51 completed".

Candidate projects from the photo archive folders, to confirm with the client (names as the folders spell them): Adpur Dheti Pag · Asha Life Mission · Bhamriya · Bhavnagar · Dadabhagavan Kelanpur · Devilaya · Digambar Jain Derasar, Baroda · Dhola · Gelmata, Rajkot · Godiji Derasar, Tharad · Gulbarga (Vaishno Devi) · Hastgiri · Jaliya · Jambudip · Kachhi Bhavan, Junagadh · Kachhi Bhavan, Palitana · Khajuri · Kotadi · Liliya · Malav · Mota Derasar, Tharad · Osval, Palitana · Parvala · Rampara · RRD, Limbdi · Shobhavad · Songadh · Surat · Taleti · Tana · Varkhadi, Tharad. Vaishno Devi Ahmedabad needs its folder identified.

---

## 5. 3D

Two scenes, both plain three.js, each loaded as its own chunk only when its section approaches the viewport.

| Scene | Where | How it's built | Size target |
|---|---|---|---|
| **Carved relief + toolpath** | Hero and CNC chapter | A flat plane displaced by a depth map made from one real CNC panel photo. Raking light moves with scroll. The toolpath is a mask sweeping across the same mesh. | ≈150 KB assets, one mesh, one KTX2 texture |
| **Fly-through to the mountain temple** | Fero Works chapter | A pinned stage (CSS sticky inside a tall container) with GSAP ScrollTrigger scrub driving the progress. The camera follows a `CatmullRomCurve3` path with a separate look-at curve, eased at both ends. Terrain: a displaced plane from a procedural noise height field, vertex colours in navy/slate, `FogExp2` for depth. Clouds: a few layered billboard planes with a soft noise texture. The artificial mountain has a cave mouth; inside, a low-poly, smooth-shaded Nagara shikhara in sand-white stone: stepped jagati, tiered spire with amalaka and kalash, urushringa spires, saffron rim light, Light Rays behind. Everything is generated in code at load. | ≤ 400 KB total; actual recorded below |

**Fly-through specifics:** device pixel ratio capped at 1.5; rendering stops when the section is off-screen; the first seconds of rendering are timed, and if the scene can't hold 30 fps it hands back to the poster. The poster is a **4-frame still sequence** (above the clouds → ridges → reveal → temple), rendered from the real scene, that crossfades on scroll. It is used for reduced motion, Save-Data, no WebGL2 and low-end devices.

**Fly-through, measured size** (first pass):
- Scene code: 3.7 KB gzipped (`fero.ts`), plus three.js, shared with the carved panel: 132 KB gzipped.
- Scene assets: 0 KB. Terrain, clouds and temple are generated at load, so there are no meshes or textures to download and no Draco, Meshopt or KTX2 files are needed. Total for the scene: about 136 KB, inside the 400 KB budget.
- Poster frames (AVIF, all four): 49 KB at 2400 px wide, 31 KB at 1600, 29 KB mobile at 960, 13 KB mobile at 480.
- Frame rate: the 30 fps guard is in place. It has not yet been measured on a real mid-range Android phone; the headless numbers are software rendering and don't count.

**Non-negotiable guardrails (from the brief):**
- 3D and heavy animation never ship in the initial bundle.
- Every scene has a designed poster image. The poster shows on low-end devices, when WebGL2 is missing, with `prefers-reduced-motion`, and with Save-Data. 3D replaces it only on capable devices.
- Rendering stops when the scene is off-screen.
- All text, project data and contact details are ordinary HTML and never wait for a canvas or an animation.
- Every asset is compressed (Draco or Meshopt geometry, KTX2 textures) and its size is recorded in this file.
- Load time and frame timing are measured, not assumed (section 9).

Logo as a 3D object: not planned. If the design needs the logo large, trace `brand/LOGO_2.png` to SVG and show it to the owner before use.

---

## 6. React Bits components

Variant: **TypeScript + Tailwind** for all of them. Each is recoloured to the palette; no default colours are kept. Sizes are measured (gzipped; "total" includes shared dependencies that are paid once).

| Component | Where | Depends on | Own / total kB |
|---|---|---|---|
| Masked Heading | Stone Works headings, sandstone texture in the letters | gsap | 2.2 / 29.1 |
| Split Text | Main headings, line by line | gsap, ScrollTrigger, SplitText | 1.1 / 48.4 |
| Scroll Reveal | Family paragraph | gsap, ScrollTrigger | 0.7 / 44.7 |
| Count Up | Numbers band | motion | 0.7 / 10.0 |
| Line Waves | Behind CNC Works (needs an off-screen pause added) | ogl | 2.4 / 14.8 |
| Topography | Behind the mountain chapter | ogl | 3.1 / 15.4 |
| Light Rays | Inside the mountain and behind contact, in saffron | ogl | 2.9 / 15.3 |
| Scroll Stack | Mountain build sequence | lenis | 1.7 / 6.7 |
| Flowing Menu | The Temple Register rows | gsap | 1.0 / 27.9 |
| Staggered Menu | Navigation on phones | gsap | 2.6 / 29.4 |
| Gradual Blur | Edges of the pinned 3D chapters | none | 2.0 / 2.0 |
| Noise | Light grain on the night sections | none | 0.5 / 0.5 |
| Glare Hover | Sheen on project photos, desktop only | none | 0.5 / 0.5 |

Before installing: open every demo and preview all of them recoloured in a small local lab page.

---

## 7. Look

### Palette (all pairings measured, WCAG 2.x)

Light sections (most of the site):

| Token | Hex | Use | Contrast |
|---|---|---|---|
| sand | `#F4EFE6` | page ground | — |
| stone | `#E7DFD2` | panels | — |
| navy (logo) | `#262654` | text, headings | 12.33:1 on sand · 10.68:1 on stone |
| deep slate | `#52606B` | secondary text | 5.65:1 on sand · 4.90:1 on stone |
| saffron text | `#985A1F` | small accent text on sand | 4.80:1 on sand |
| saffron (logo) | `#CD8841` | ornament only on light | 2.55:1 on sand, never text |
| sky (logo) | `#AFD9EB` | decoration only on light | never text on light |

Night sections (mountain chapter, contact):

| Token | Hex | Use | Contrast |
|---|---|---|---|
| night | `#0E0E1F` | ground | — |
| navy (logo) | `#262654` | panels | — |
| sand | `#F4EFE6` | text | 16.65:1 on night · 12.33:1 on navy |
| sky (logo) | `#AFD9EB` | secondary text | 12.66:1 on night · 9.38:1 on navy |
| saffron (logo) | `#CD8841` | accent text, lamp light | 6.53:1 on night · 4.84:1 on navy |
| slate (logo) | `#798A96` | rules, contour lines | 5.35:1 on night |

Any new pairing is computed before use, never estimated.

### Type

- **Libre Caslon Display** for headlines, set large, like letters cut in stone.
- **Hanken Grotesk** for text.
- **IBM Plex Mono** for captions: stone type, place, dimensions, scope.

All three are self-hosted, subset, `font-display: swap`.

### Borrowed ideas (from the research)

- MERSI: letters cut into the page and filled with material.
- Salvatori: stone under raking light.
- Igloo Inc. and Getty/Gehry: a structure revealed inside a mountain; a building told in chapters.
- Makhno: three doorways as the three lines of work.
- ERA Residence: photographs opened through a temple-arch mask.
- Mosby's Files and Herzog & de Meuron: an archive that works without photographs.

---

## 8. Stack and hosting

- **Astro** with React islands: HTML with zero JS by default; islands hydrate when visible.
- **TypeScript + Tailwind.**
- **three.js** (plain, not React Three Fiber: 187 kB vs 265 kB measured), **GSAP + ScrollTrigger + SplitText**, **Lenis**. That's the combination the studied award winners use.
- Projects live in the repo as a content collection, so there's no database for content.
- **Vercel** hosts the static site. Its Root Directory still points at the old `frontend/` and must be updated before the first build.
- **Render:** not needed (no server).
- **Supabase:** only if contact enquiries should be stored. That's decided at deployment, where every table, bucket and environment variable to be dropped gets listed for a yes first.
- A project map is optional. If there is one, the India outline must be Survey of India–compliant (all of J&K and Ladakh, to about 37.1°N), checked before use.

---

## 9. Performance and quality bar

- **Initial load (before any 3D):** HTML + CSS + fonts + hero poster ≤ 300 KB transferred; no three.js, GSAP or React in the first request chain.
- **LCP** under 2.5 s on a mid-range Android over 4G. **CLS** under 0.1.
- **3D:** a steady 60 fps is the target on desktop, and at least a smooth 30 fps on a mid-range Android; if it can't hold that, the poster stays.
- **No horizontal scroll at 360 px.** **WCAG AA** throughout.
- **Measured with:** WebPageTest on a mid-range Android profile over 4G, and Chrome remote debugging on a real Android phone over USB for frame timing. Numbers get recorded here.

### Measurements

Lighthouse 13.5, mobile preset (Moto G Power emulation, simulated slow 4G, 4× CPU slowdown), production build via `astro preview`, median of 3 runs.

**Baseline before the logo loader** (build after phase 5, commit `2058e69`):

| Page | LCP | CLS | FCP | TBT | Performance | Accessibility |
|---|---|---|---|---|---|---|
| `/` | 3.33 s (3.03–3.79) | 0 | 1.67 s | 594 ms | 0.77 | 0.96 |
| `/projects` | 3.25 s (3.25–3.40) | 0.01 | 1.67 s | 0 ms | 0.92 | 1.00 |
| `/contact` | 2.88 s (2.86–2.88) | 0.034 | 1.89 s | 160 ms | 0.92 | 1.00 |

LCP is over the 2.5 s target on all three pages before the loader is added. Not tuned yet: waiting for the owner's decision.

**The logo loader (Phase 1).** Same pages and runs, measured right before and right after wiring it (commit before: `36dde29`). Two methods: Lighthouse's default *simulated* throttling (as above), and *devtools* throttling, which really slows the network and CPU. On localhost the whole page loads in ~60 ms, so the simulation replays every request, including JS deliberately deferred to after load, and it swung by ±0.4 s between identical builds; the devtools numbers are the more trustworthy ones here.

| Page | LCP simulated, before → after | LCP devtools, before → after | CLS after | LCP element after |
|---|---|---|---|---|
| `/` | 3.39 → 3.61 s | 1.53 → 1.66 s | 0 | hero poster |
| `/projects` | 3.31 → 4.21 s | 4.76 → 2.25 s | 0.01 | the loader's fill logo |
| `/contact` | 2.86 → 3.53 s | 1.48 → 2.24 s | 0.05 | the loader's fill logo |

Read with care: once the loader is in, its full-colour logo (`/logo-fill.webp`, 20 KB, shown at 100%) is the largest paint on `/projects` and `/contact`, so their LCP now measures the loader, not the page. The `/projects` h1 still waits for `cut.webp` (204 KB) underneath; that is a real problem the loader hides, not fixes. The loader adds ~7 KB gzipped of inline SVG to every page. Under devtools throttling all three pages are under 2.5 s; under simulation none are, before or after.

---

## 10. Photographs

- Source: `D:\projects\ALBUM-IMAGES\` (read-only, never committed). Use `OUR WORK PHOTO\`, not the duplicate `work_website_images\`.
- 1,352 unique images. Known problems: orange date stamps (all 82 NIKON frames, 101 in total), the "REDMI NOTE 11 | KASHYAP" mark bottom-left (118 images), and 183 images under 1 MP.
- Each chosen image is cropped or retouched to remove stamps and marks, checked for faces, and exported to `media/` as AVIF + WebP at 480, 960, 1600 and 2400 px widths.
- Key images: the Gulbarga mountain temple in evening light, the Gulbarga build sequence, the pencil mountain elevations, the painted mountain model (NIKON DSCN2429–2438), finished stone temples (NIKON DSCN2489–2500), CNC-cut panels, and the machine photos (DSCN2396–2398, 2402–2403, 2410–2413, turned upright).

---

## 11. Build phases (each one reviewed before the next)

1. **Foundations.** Astro project, tokens, fonts, page skeleton with all real text, the content collection seeded with the ~21 documented projects. No motion yet. Check: 360 px, AA, Lighthouse.
2. **Photographs.** Select, clean, export; posters for both 3D scenes.
3. **Motion.** The React Bits lab, then text animations, Scroll Stack, the register rows, the menu, Lenis. Reduced-motion paths.
4. **3D: carved relief + toolpath.** Depth map, scene, poster fallback, off-screen pause, measurements.
5. **3D: the mountain.** Modelling, compression, the scroll reveal, measurements.
6. **Deploy.** Vercel settings, the Supabase decision (listed for approval first), final performance run on a real phone.

---

## 12. Open items

- The list of the other ~30 completed projects (names and places are enough).
- Which folder holds the Vaishno Devi Ahmedabad project.
- Whether workers (not family) may appear in photos. Until answered, every identifiable face is excluded.
- Later, if possible: one wide photo of the machine hall showing all five CNC machines.
