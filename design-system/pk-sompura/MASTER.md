# PK Sompura — Design System (Master)

Source of truth for the redesign. Tokens live in `frontend/src/global.css`.
Read this file before starting any redesign phase instead of re-deriving decisions.

## Direction

Bright architectural heritage. **Marigold & Peacock** on ivory — festival-bright
and unmistakably Indian, with peacock teal supplying the contrast the previous
all-gold scheme lacked. Type references carved temple inscription.

Stack: Vite + React 19, GSAP 3.14 (Flip/ScrollTrigger/SplitText all bundled),
Lenis, three.js 0.183 + @react-three/fiber 9 + drei 10, ogl.

## Palette

| Role | Token | Hex | Rule |
|---|---|---|---|
| Background | `--color-bg` | `#FFFBF3` | Page ivory |
| Surface | `--color-surface` | `#FDF4E3` | Sunken panels |
| Elevated | `--color-bg-elevated` | `#FFFFFF` | Cards |
| Fill | `--color-fill` / `--c-marigold-500` | `#F59E0B` | **Decorative fill only** |
| Accent text | `--color-gold` / `--c-marigold-700` | `#B45309` | Text-safe marigold |
| Interactive | `--color-accent` / `--c-peacock-700` | `#0F766E` | Links, buttons |
| Text | `--color-text` | `#1C1917` | Body/headings |
| Muted | `--color-text-muted` | `#57534E` | Paragraphs |

### Contrast rules (validated, WCAG AA)

These are measured, not estimated. Do not violate them:

- `#F59E0B` marigold-500 on ivory = **2.08:1** → never use for text. Fill only.
- `#D97706` marigold-600 on ivory = **3.09:1** → large text (24px+) only.
- `#B45309` marigold-700 on ivory = **4.87:1** → text-safe. This is why
  `--color-gold` maps here and not to marigold-500.
- `#0F766E` peacock-700 on ivory = **5.30:1** → text-safe.
- `#0D9488` peacock-600 on ivory = **3.63:1** → large text / non-text only.
- On a marigold-500 fill, use **stone `#1C1917`** text (8.14:1). White fails (2.15:1).

Re-run the validator after any palette change before shipping.

## Typography

- Headings — **Cinzel** (`--font-heading`), weight 500–600, tracking `-0.015em`
- Display — **Cinzel Decorative** 700, hero wordmark only
- Body — **Outfit** (`--font-body`), weight 300, line-height 1.65
- Indic — **Noto Serif Gujarati / Devanagari** must stay in both stacks;
  the site has a `LanguageContext` and drops to these for gu/hi text

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
