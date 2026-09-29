# Handoff: P.K. Sompura website ("Carved in Sandstone")

## How to use this package with Claude Code
1. Unzip this folder into an empty project directory and open Claude Code there.
2. Paste the prompt from `PROMPT.md` as your first message.
3. Claude Code should read, in this order: `plan.md` (the source of truth for facts, stack and rules) → this README → `design/Handoff.dc.html` (tokens, components, config) → the screen boards.
4. To see the designs, open `design/Overview.dc.html` in a browser. Keep `support.js` and `assets/` next to the files, because the boards need them to render.
5. Build in the phases below and review after each one.

## Overview
A marketing and archive site for P.K. Sompura, temple architects and contractors in Palitana, Gujarat. The site has a homepage of 8 sections, the Temple Register (/projects), project pages (/projects/[slug]), /contact and a 404 page. Stack (from plan.md): **Astro + React islands + Tailwind**, React Bits components, three.js for two 3D scenes, and GSAP/Lenis for scroll.

## About the design files
The files in `design/` are **design references built in HTML**. They show the intended look and behaviour; they are not production code to copy. The job is to rebuild them as Astro pages and components with Tailwind utilities and React islands, following plan.md. Don't port the inline styles, the `.dc.html` format or `support.js`.

## Fidelity
**High fidelity.** The colours, type, spacing, layout, copy and motion specs are final. There are two exceptions:
- Photo placeholders (striped boxes) are labelled with the intended image from plan.md §10. Swap in the real photos when they're ready, and never use stock photos.
- The 3D poster art (`Relief Poster`, `Flythrough Poster`) are stand-ins for art direction: framing, light direction and colour grade. The final posters are rendered from the real three.js scenes with the same camera.

## Hard rules (from plan.md, and they must hold)
- Use only the facts in plan.md §2. Never show: "more than 40 years", a second phone number, the grandfather's name, any dates or years (the footer © has no year), awards, testimonials, or invented numbers.
- English only. No photos of people or faces.
- Use colours only from the tokens. Saffron `#CD8841` and sky `#AFD9EB` are **never text on light grounds**.
- Fonts: Libre Caslon Display (headings, weight 400 only), Hanken Grotesk (body), IBM Plex Mono (captions and metadata).
- Motion is an extra layer. Every section must read correctly with JS off and with `prefers-reduced-motion`.
- At 360 px there must be no horizontal scroll.

## Screens (see the boards for exact pixels)
| Board | File | Contents |
|---|---|---|
| 01 | `design/Home.dc.html` | 8 sections in order: Hero · The family · Numbers · Stone Works · CNC Works · Fero Works (night) · Selected projects · Contact + footer (night). Each has a spec and motion note on the left. |
| 02 | `design/Register.dc.html` | /projects: working filters (place select + scope chips), sort, row states (default, hover band with and without photo, focus), mobile tap-expand (with photo / TypeCard), empty state, mobile filter sheet |
| 03 | `design/Project.dc.html` | /projects/[slug] with photos, and without photos (TypeCard "page") |
| 04 | `design/Contact Nav 404.dc.html` | /contact (night), mobile Staggered Menu (closed / opening / open), 404 |
| 05 | `design/Posters.dc.html` | Hero poster, toolpath poster, and the Fero Works fly-through (P3): five shots S1–S5 at 1440 and 360, camera moves between shots, camera nodes, fallbacks, and a labelled temple elevation |
| 06 | `design/Handoff.dc.html` | **Tokens, type scale, spacing, radii, shadows, textures, grid, component inventory, per-section table, tailwind.config** |

## Design tokens (summary; the full table is in Handoff §1–7 and §10)
Colours go in `theme.colors` (replacing Tailwind's defaults, not in `extend`):
`sand #F4EFE6` · `stone #E7DFD2` · `navy #262654` · `night #0E0E1F` · `slate #798A96` · `slate-deep #52606B` · `saffron #CD8841` · `saffron-text #985A1F` · `sky #AFD9EB`.

Key pairings: navy/sand 12.33 · slate-deep/sand 5.65 · slate-deep/stone 4.90 · saffron-text/sand 4.80 (it fails on stone at 4.16) · sand/night 16.65 · sky/night 12.66 · saffron/night 6.53. Slate is used for rules and UI outlines only, never text on light. Keep Light Rays at ≤ 25% saffron behind text, and no saffron text inside the rays.

Grid: base <768 has 4 cols, margin 20, gutter 16 · md 768 has 8 cols, margin 40, gutter 20 · lg 1024 has 12 cols, margin 48, gutter 24 · xl 1280 has 12 cols, margin 80, gutter 24, max content 1280. Section padding is 96 / 128 / 176. The Staggered Menu is used below lg; text nav from lg up.

Radius: 0 everywhere. The only exception is the temple-arch mask `rounded-t-full` on photos and the logo plate.

Textures (`public/tex/`): `sand.png`, `stone.png` (grounds), `cut.png` (clipped into heading text ≥ 40 px, navy fallback), `grain-night.png` (Noise at 5%). Convert them to WebP.

## Components to build
SiteNav (light/night) · MobileMenu (Staggered Menu) · SectionHeading (cut / plain / night, optional eyebrow and chapter marker) · NumberStat · RegisterRow (Flowing Menu band) · TypeCard (row / page) · PhotoFrame (arch / rect, light / night, Glare Hover) · ScopeTag · FilterChip · Button (primary / secondary / link × light / night) · StackPlate · ContactRow · Footer · Scene3D/PosterFrame. Variants and states are drawn in Handoff §8.

## Interactions and motion
Every motion note names the React Bits component, what triggers it, its duration and easing, and its reduced-motion state. The notes are on the boards next to each element, and Handoff §9 collects them in one table. Rules:
- The hero h1 and page h1s are static, because they are the LCP. Split Text is only used on section headings below the fold.
- 3D islands load only if WebGL2 is available, reduced motion is off, Save-Data is off, deviceMemory ≥ 4, and the section is near the viewport. Otherwise the `<img>` poster stays. The canvas stops rendering when off-screen.
- Count Up: the final values are in the HTML (3 · 51+ · 5).
- The Scroll Stack plates are a plain list in the HTML.
- **Fero Works fly-through** (Posters P3). This replaces the parting mountain from the first plan.
  - The section is pinned for 500vh on desktop and 400vh on mobile. One camera follows a CatmullRom spline through five nodes, and scroll progress drives it (scrub 0.6).
  - The HTML title has three states: full, docked, and docked + line. Each shot shows which one. The text is never baked into a poster.
  - Posters `fw-s1…s5` are exported at 2400×1350 and 1080×1920. S4 is the first paint.
  - Reduced motion: no pin. The five posters stack as 100svh frames.
  - Low-end devices: pinned, with the posters crossfading. No 3D.

## State
- Register: `place` (single) and `scope[]` (OR within scope, AND with place), `sort` (place | type, never date). Mirror them in the URL (`?place=&scope=&sort=`).
- Mobile: expanded rows, filter sheet open/closed (focus-trapped, Esc closes).
- Menu: open/closed (focus trap, scroll lock, Esc).

## Data
Put the projects in an Astro content collection: `name, slug, place, state, type, scope[], photos[], note?, featured`. The entries in the Register board are **sample data** (archive folder names). Type, scope, place and the photo split are illustrative until the client's list arrives.

## Open items (see the Overview board, A1–A16)
- A2: the real relief panel for 3D.
- A3: the workshop street address.
- A4: the confirmed register data.
- A14: the copy for the note field.
- Confirm the rest, or leave them as I read them.

## Suggested build phases
1. Astro scaffold, the Tailwind config (copy from Handoff §10), fonts, textures, layout and the static nav/footer.
2. All pages as static HTML with the posters. Check them against the boards at 360 and 1440.
3. The Register filtering island and the content collection.
4. React Bits motion, with reduced-motion checks.
5. The three.js scenes, loaded behind the poster gating.
6. Lighthouse/a11y pass: LCP < 2.5 s, AA contrast, 44 px targets, no CLS.

## Files
- `plan.md`: the approved plan, source of truth.
- `design/*.dc.html` + `support.js` + `assets/`: design boards (open `Overview.dc.html`).
- `public/logo.png`, `public/tex/*`: production assets to use.
