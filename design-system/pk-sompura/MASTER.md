# PK Sompura — Design System (Master)

Source of truth for the redesign. Tokens live in `frontend/src/global.css`.
Read this file before starting any redesign phase instead of re-deriving decisions.

## Direction

Drawn from the company mark: its indigo figure, its sky-blue ground, and the
carved stone of the temples themselves. Cool, quiet and architectural rather
than festival-bright. Type references carved temple inscription.

Stack: Vite + React 19, GSAP 3.14 (Flip/ScrollTrigger/SplitText all bundled),
Lenis. No Tailwind — the tokens below are the styling system, and utility
classes silently do nothing.

three.js, @react-three/fiber, drei and ogl are in `package.json` but nothing in
`src/` imports any of them, so treat them as absent; they are queued for removal
in `TODO.md`. Do not design around a WebGL renderer this project does not use.

## Palette

| Role | Token | Hex | Rule |
|---|---|---|---|
| Background | `--color-bg` / `--c-paper` | `#F7FAFC` | Page |
| Surface | `--color-surface` / `--c-sky-50` | `#E9F0F5` | Sunken panels |
| Elevated | `--color-bg-elevated` | `#FFFFFF` | Cards |
| Dark surface | `--c-navy-800` | `#1E2D40` | Dark cards, dock, footer |
| Fill | `--color-fill` / `--c-sky-300` | `#90C8D8` | **Decorative fill only** |
| Headline accent | `--color-primary` / `--c-navy-700` | `#283848` | Titles, eyebrows |
| Interactive | `--color-accent` / `--c-slate-600` | `#4A637A` | Links, buttons |
| Text | `--color-text` / `--c-navy-900` | `#16202E` | Body/headings |
| Muted | `--color-text-muted` / `--c-slate-600` | `#4A637A` | Paragraphs |
| On dark | `--color-primary-on-dark` / `--c-sky-200` | `#B4D8E4` | Accents on navy |
| Error | `--color-error` | `#C53030` | Form errors, required marks |

### Contrast rules (validated, WCAG AA)

Measured against the page background `#F7FAFC`, not estimated. Do not violate:

- `#16202E` navy-900 = **15.65:1** → body text.
- `#283848` navy-700 = **11.45:1** → headings, the primary accent.
- `#4A637A` slate-600 = **5.97:1** → text-safe. Links and muted copy.
- `#647484` slate-500 = **4.58:1** → text-safe, the lightest that is.
- `#8AA0B5` slate-400 = **2.58:1** → never for text. Borders and icons only.
- `#8A6E4D` sand-700 = **4.53:1** → text-safe warm accent.
- `#C8A070` sand-500 = **2.30:1** → fill only.
- `#90C8D8` sky-300 = fill only; on it, use navy-900 text (**8.94:1**).
- `#C53030` error red = **5.47:1** on white. Replaced `#E53E3E`, which was
  4.13:1 and failed AA for the required-field markers on the inquiry form.

On the dark navy surfaces (`#1E2D40`): white is **13.96:1**, sky-200 is
**9.23:1**, sand-300 is **8.70:1**. navy-700 disappears there, which is what
`--color-primary-on-dark` exists to prevent.

Re-run the validator after any palette change before shipping.

### Naming

The tokens were once `--color-gold*`, from a marigold palette. When the palette
moved to indigo those names actively lied about their values, so they are now
`--color-primary*`, named for the job rather than the colour. If the palette
shifts again, the names still hold.

## Typography

- Headings — **Cinzel** (`--font-heading`), weight 500–600, tracking `-0.015em`
- Display — **Cinzel Decorative** 700, hero wordmark only
- Body — **Outfit** (`--font-body`), weight 300, line-height 1.65
- **English only.** The language toggle was removed, so the Noto Serif
  Gujarati and Devanagari webfonts went with it -- they were downloaded on
  every visit to render text no page asked for. The `name_gu`/`name_hi`
  columns and the API's `?lang=` parameter were kept: dropping columns is
  irreversible, and they are the way back if the decision changes.

Loaded via `<link>` in `index.html`, **not** a CSS `@import` (an `@import`
serializes the font request behind the stylesheet and delays first paint).

Headings default to stone, **not** marigold. The old
`h1–h6 { color: gold !important }` rule was removed — it flattened hierarchy by
painting every heading the same colour. Marigold now lives on `.eyebrow` kickers
and accents.

## Depth & motion tokens

`--perspective: 1200px`, `--tilt-max: 10deg`, `--lift-hover: -6px`.
Elevation `--shadow-sm|md|lg|glow` are warm-tinted (brown, not grey) so shadows
sit correctly on ivory. Motion: `--dur-fast|base|slow` with
`--ease-smooth|dramatic|out-expo`. `.depth-card` is the opt-in 3D lift helper.

## Legacy token aliases

51 components reference `--color-gold`. Rather than rename across the codebase,
the legacy names are remapped onto the new palette in `global.css`, so the whole
site re-skins at once. Keep these aliases until components are migrated.

## Known constraints and landmines

- **Tailwind is not installed**, but several components (`LineageSection`,
  `Dashboard`) use Tailwind class names (`py-20`, `text-gray-300`, `max-w-7xl`).
  Those classes are inert. Use tokens and real CSS, not Tailwind utilities.
- **Dark surfaces that are intentional**: image scrims in `MagicBento`,
  `WorkingSitesSection`, `ProjectsCards`, `Projects`, and the `GalleryModal`
  lightbox overlay. These sit over photos — leave them dark.
- **Dark surfaces retinted to peacock-900** (`#134E4A`) as contrast anchors:
  `ProfileCard`, `MagicBento` base, working-site tiles, ChromaGrid lineage cards.
  They keep white text, so do not convert them to light.
- `AdminPage.css` is still on the old dark navy theme and has not been migrated.
- **The dashboard hero does not use a 3D temple model.** A WebGL hero was built
  and then removed by request in favour of a modern dock/card navigation.
  Dropping it cut the bundle from 1,467 kB to 495 kB (gzip 427 → 163 kB),
  because three.js/R3F/drei left the main path entirely. Do not reintroduce a
  WebGL hero without weighing that cost.
- Depth now comes from CSS 3D transforms (`HeroNav` pointer-tracked tilt,
  `.depth-card`), not WebGL. `--perspective` and `--tilt-max` drive it.
- `public/indian-temple/source/new_lns_glb-hex.glb` (9.7MB) is unused but kept
  as a source asset. Anything using it must be Draco-compressed first — doing so
  took it to 582 KB with geometry intact.
- **Locking the page behind an overlay takes two things, not one.** Lenis
  handles the wheel itself and scrolls the document programmatically, and
  `overflow: hidden` does not stop a programmatic scroll -- so the overlay
  also needs `data-lenis-prevent`, Lenis's own opt-out. Put the overflow lock
  on `<html>`, never on `<body>`: body's `overflow-x: clip` computes to
  `hidden` the moment the other axis is set, which is what made the whole page
  unscrollable once before. `html` carries `scrollbar-gutter: stable` so the
  page does not jump when the bar goes. See `GalleryModal.jsx`.
- **The dock claims `z-index: 99999`.** Anything meant to cover the page has to
  beat it; the gallery lightbox sat at 1000 and the dock floated over the open
  photos with its buttons still tappable. `GalleryModal.css` now uses 100000.
- `.dashboard-bg` must stay `position: absolute`. As a static grid item it
  consumes a column and displaces the hero nav onto a second row.
- The hero backdrop is a **CSS aurora**, not WebGL. `Prism` (an OGL shader) was
  removed: behind a mask at ~30% opacity it was indistinguishable from a
  gradient while holding a live GL context and a frame loop.
- **`motion` was removed.** It weighed 129 kB (43 kB gzip) and existed only for
  the Dock's magnify effect, which is now one rAF writing widths plus a CSS
  transition. Do not reintroduce it for a single animation.
- `ModelViewer.jsx` was deleted — 507 lines importing three.js, imported nowhere.
- Routes are `React.lazy` split. Initial payload went 427 kB gzip → ~114 kB.

### Supabase is stripped from production builds

`AdminPage` guards on `import.meta.env.VITE_SUPABASE_URL`. Vite inlines that at
**build time**, so with the variable unset the guard folds to `false`, and
Rollup eliminates `createClient` entirely — verified: zero Supabase bytes in any
built chunk. Uploads cannot work until those vars exist at build time.

Note the corollary: because `VITE_*` values are inlined into the client bundle,
setting them publishes the anon key and `VITE_ADMIN_PASSWORD` to anyone who
reads the JS. The admin password must move server-side, and the Supabase tables
and buckets need Row Level Security before that key is exposed.
- All page content is revealed by GSAP. A 4s failsafe in `App.jsx` now forces the
  site visible if the intro timeline stalls — do not remove it.

## Avoid

2D-only flat layouts · low-quality imagery · AI purple/pink gradients ·
emoji as icons (use Lucide, already installed) · marigold text on ivory.
