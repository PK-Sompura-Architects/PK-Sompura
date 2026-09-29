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
6. **Fero Works: the mountain.** The page turns to night. The 3D mountain opens as you scroll to show the white-stone temple inside, lit in saffron (Light Rays), with Topography contour lines behind. Then the real build sequence as stacked plates (Scroll Stack): sketch → model → foundation → rock shell → finished Gulbarga temple.
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
| **Mountain that opens** | Fero Works chapter | Modelled by us (there is no client 3D file) from the pencil elevations in the `FERO` folder and the Gulbarga photographs: two rock halves that part, and a white-stone shikhara inside. | ≤ 400 KB total, Draco + KTX2 |

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
