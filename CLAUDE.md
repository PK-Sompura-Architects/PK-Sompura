# CLAUDE.md — P.K. Sompura | Project Bible

> **This file is the single source of truth.** Every page, component, colour and
> animation conforms to it. Deviating is allowed, but it is a decision to be
> raised, not a thing to do quietly.
>
> Numbers here are **measured, not estimated**. Contrast ratios were computed,
> bundle sizes read off a real build, frame times sampled while scrolling. If
> you change something this file records, re-measure and update the number in
> the same commit.

---

## 1. The company

| Field | Value |
| --- | --- |
| Name | **P.K. Sompura** |
| Line | Temple Architect & Contractor |
| Based | Palitana, Gujarat |
| Work | Temple design and construction across India, three generations |
| Tone | Quiet · Architectural · Devotional · Unhurried |

Two things the company does that nothing else in the market does, and which the
site currently under-sells: **artificially built mountains with a temple inside**
(Vaishno Devi Ahmedabad, Vaishno Devi Gulbarga) and **stone cut in-house on five
CNC machines** at their own working site.

### 1.1 Content rules

- **English only.** The language switcher was removed deliberately. The
  `name_gu` / `name_hi` / `description_gu` / `description_hi` columns still
  exist and are kept only as a path back; their presence is not an invitation to
  rebuild the feature.
- **No photographs of the family.** The lineage page was replaced by the map at
  the family's request. The `lineage` table, its API and its admin screen still
  exist and still work; nothing renders them. Do not reintroduce a page that
  shows their faces.
- **No per-temple year.** The year is genuinely forgotten for many of the older
  projects, so there is no completion year on a temple and no decade filter.
- **Some projects have no photographs and that is fine.** They exist to be
  counted, for credibility of scale. Any surface showing projects must render
  correctly with no images, and must not offer a gallery that would open empty.

---

## 2. Brand

### 2.1 Palette

Tokens live in `frontend/src/global.css`. **Use the token, never a raw hex.**
The names describe the job, not the colour: they were once `--color-gold*` from
a marigold palette, and when the palette moved to indigo those names actively
lied. If the palette shifts again, the names still hold.

| Role | Token | Hex |
| --- | --- | --- |
| Page background | `--color-bg` / `--c-paper` | `#F7FAFC` |
| Sunken surface | `--color-surface` / `--c-sky-50` | `#E9F0F5` |
| Card / elevated | `--color-bg-elevated` | `#FFFFFF` |
| Dark surface | `--c-navy-800` | `#1E2D40` |
| Headline accent | `--color-primary` / `--c-navy-700` | `#283848` |
| Interactive | `--color-accent` / `--c-slate-600` | `#4A637A` |
| Body text | `--color-text` / `--c-navy-900` | `#16202E` |
| Muted text | `--color-text-muted` | `#4A637A` |
| Decorative fill | `--color-fill` / `--c-sky-300` | `#90C8D8` |
| On dark surfaces | `--color-primary-on-dark` / `--c-sky-200` | `#B4D8E4` |
| Error | `--color-error` | `#C53030` |

### 2.2 Contrast — measured, WCAG AA

Against the page background `#F7FAFC`:

| Colour | Ratio | Use |
| --- | --- | --- |
| `#16202E` navy-900 | **15.65:1** | body text |
| `#283848` navy-700 | **11.45:1** | headings, primary accent |
| `#4A637A` slate-600 | **5.97:1** | links, muted copy |
| `#647484` slate-500 | **4.58:1** | the lightest that is still text-safe |
| `#8AA0B5` slate-400 | **2.58:1** | **never text.** Borders and icons only |
| `#8A6E4D` sand-700 | **4.53:1** | warm text accent |
| `#C8A070` sand-500 | **2.30:1** | **fill only** |
| `#90C8D8` sky-300 | fill only | on it, use navy-900 (**8.94:1**) |

On dark navy `#1E2D40`: white **13.96:1**, sky-200 **9.23:1**, sky-100
**9.1:1**, sand-300 **8.70:1**. navy-700 disappears there — that is what
`--color-primary-on-dark` exists to prevent.

**Never estimate a ratio.** Compute it. A previous "looks fine" shipped navy
text on a navy gradient at **1.16:1**, and an error red at 4.13:1 that failed AA
on the inquiry form's required-field markers.

### 2.3 Typography

Loaded in `frontend/index.html` from Google Fonts, three families only.

| Role | Family | Token |
| --- | --- | --- |
| Display (hero wordmark) | **Cinzel Decorative** 400/700 | — |
| Headings | **Cinzel** 400–900 | `--font-heading` |
| Body | **Outfit** 200–700 | `--font-body` |

Cinzel is a classical inscriptional serif and is the right face for temple
architecture. **Do not add a fourth family.** The Noto Serif Gujarati and
Devanagari webfonts were removed precisely because they downloaded on every
visit to render text no page asks for.

### 2.4 Scales

```
--space-2xs .5rem   --space-xs .75rem  --space-sm 1.25rem  --space-md 2rem
--space-lg  3rem    --space-xl 4.5rem  --space-2xl 6rem
--section-padding  clamp(72px, 12vh, 144px)
--content-padding  clamp(20px, 4vw, 64px)
--radius-sm 6px  --radius-md 12px  --radius-lg 20px  --radius-xl 32px
```

`--space-2xl` is the minimum rhythm between major sections. Concentric radii are
derived with `calc()`, never hardcoded.

---

## 3. Motion

### 3.1 The timing scale

**One scale for the whole site.** Two scales is how a codebase ends up fast in
one component and slow in the next — it has already happened here once.

```
--dur-hover  260ms   colour and border feedback
--dur-move   420ms   transforms on hover, small state changes
--dur-enter  900ms   reveals and entrances
--ease-smooth    cubic-bezier(0.25, 0.1, 0.25, 1)
--ease-dramatic  cubic-bezier(0.76, 0, 0.24, 1)
--ease-out-expo  cubic-bezier(0.16, 1, 0.3, 1)
```

Never `linear` or `ease-in-out`. Never a bare millisecond value — use a token.

### 3.2 Hard rules

These are not style preferences. Each one is a bug that has already shipped
here and been measured.

1. **Never animate `filter: blur()`.** Full repaint per frame, no GPU shortcut.
   Animating a 10px blur on the dashboard `<h1>` was a measured cause of the
   scroll jank.
2. **Never animate `top`, `left`, `width` or `height`.** Layout properties
   relayout every frame. `transform` and `opacity` only.
3. **`will-change` only while something is actually animating.** A permanent
   `will-change: transform` keeps a layer promoted for an animation that never
   runs.
4. **No infinitely-animating full-viewport layers.** A masked, gradient-painted,
   permanently-moving layer repaints for as long as the page is open, even once
   scrolled past. That was the single largest cause of the jank.
5. **`backdrop-filter` only on fixed or sticky elements** — never on scrolling
   content.
6. **Reveals are a fade and a 8–16px lift.** Not a slide, not a rotation, not a
   blur. `ScrollReveal` is the only reveal component; use it.
7. **Everything decorative respects `prefers-reduced-motion`**, and the
   un-animated state must be the good one.

### 3.3 Scrolling

**Lenis, `duration: 1.6`, `touchMultiplier: 1.5`**, in `App.jsx`. Do not replace
it — nine award-winning sites were fingerprinted and Lenis was on seven of them.
Framer Motion was measured at **+43.69 kB gzip (+66% of the main chunk)** and
does not smooth scrolling at all; it is a scroll-linked *animation* layer, which
is GSAP ScrollTrigger's slot, and GSAP is already in the build.

**Frame budget: median ≤ 10 ms, zero frames over 25 ms while scrolling**,
sampled at 360px width. Current measurement: median 8.3 ms, worst 8.4 ms.

---

## 4. The stack

**Vite 7 + React 19, plain JavaScript and JSX.** FastAPI + SQLAlchemy 2 +
SQLAdmin behind it, Supabase Postgres, Render for the API.

- **No Tailwind.** Utility classes silently do nothing. The tokens above are the
  styling system.
- **No TypeScript.** No `.ts`/`.tsx`, no `tsconfig.json`.
- **No Next.js.** No `next` dependency, no `@/*` alias — import by relative path.
- **No component library.** shadcn/Radix were considered and rejected: adopting
  them means a Tailwind install, a PostCSS pipeline, a TypeScript migration and
  rewriting 2,120 lines of working CSS to arrive at a design system we have.
- Routing is `react-router-dom` in `src/App.jsx`, lazy per route.
- GSAP is used by `MagicBento` only. Lenis wraps the whole app.

### 4.1 Performance budget

| Chunk | Budget |
| --- | --- |
| `index` (main) | **≤ 67 kB gzip.** Currently 66.10 kB |
| Any new feature | its own lazy chunk, never the main one |

Measure before and after with `npm run build`, and put both numbers in the
commit message.

---

## 5. Traps in this codebase

Every one of these cost real debugging time. Read before touching the area.

**Scroll locking.** The lock goes on `<html>`, never `<body>` — body's
`overflow-x: clip` computes to `hidden` once the other axis is set, which once
made the whole site unscrollable. `overflow: hidden` alone does not stop Lenis,
which scrolls programmatically: an overlay also needs a backdrop carrying
`data-lenis-prevent`. Measured without one, a real wheel event still moved the
page 521px → 1990px. **Test with a real wheel event — `window.scrollBy` bypasses
`overflow: hidden` and reports a false pass.**

**CSS scroll timelines do not work here.** `body` has `overflow-x: clip`, so the
viewport's overflow propagates from body and `scroll(root)` watches an `html`
with no scrollport. Measured: `currentTime` null at every scroll position.

**`position: fixed` and transformed ancestors.** `main.app-container` carries a
transform for its entrance, which makes it the containing block for fixed
descendants. `top: 50%` then resolves against the full page, not the viewport —
measured, a rule reading `top: 50%` computed to `1501px`. Fixed decorative
layers are portalled to `document.body`.

**z-index ladder.** Dock `99999` → map bottom sheet `100000` → GalleryModal
`100001`. Nothing else gets a five-digit z-index.

**FastAPI trailing slashes.** Every collection route registers both `@router.get("")`
and `@router.get("/")`. A missing slash yields a 307 whose `Location` carries the
*upstream Render host*, so through the proxy the browser follows it cross-origin.
That is what once left the lineage page empty while the admin panel worked.

**SQLAdmin `__str__`.** Templates render after the session closes, so any
`__str__` that traverses a relationship raises `DetachedInstanceError` and 500s
the list page. Read only columns already loaded on the row.

**`VITE_*` is public.** Inlined into the client bundle at build time. Nothing
secret may carry that prefix.

**Sizing inside SVG.** A hit area in SVG units shrinks with the map: a 28-unit
target rendered at **13.1px**, under the 24px minimum, with a −1px gap between
neighbours. Interactive markers are HTML positioned in percentages over the SVG.

---

## 6. Accessibility

- **WCAG AA, measured.** See §2.2.
- **Target size:** 24 CSS px minimum on the web, 8px minimum between adjacent
  targets. 44px is the comfortable default used for buttons and selects.
- **Never colour alone.** Status is colour *and* shape, and the legend names
  both in words.
- **Visible focus on every control**, modal and map markers included. Never
  `outline: none` without a replacement.
- **Keyboard:** everything interactive reachable by Tab, activated by Enter,
  dismissed by Escape.
- **No horizontal scroll at 360px.** Non-negotiable, and verified by measuring
  `document.documentElement.scrollWidth`.
- **Content behind an animation must have a no-JS fallback.** The map's
  project list is real indexed content and is never faded in.

---

## 7. Components

| Component | Owns |
| --- | --- |
| `Dock` | Site navigation, fixed, z-index 99999 |
| `ScrollReveal` | The only reveal. Fade + 14px lift |
| `IndiaMap` | The project map: SVG outline, clustered markers, panel, fallback list |
| `MapPreview` | Dashboard glance, non-interactive, links to `/about` |
| `MagicBento` | Projects grid |
| `GalleryModal` | The only lightbox. Never build a second |
| `Preloader`, `Footer`, `WorkingSitesSection`, `DashboardGalleries` | as named |
| `projectVocab.js` | Status and category labels, shared by page and map |
| `indiaOutline.js` | **Generated.** Do not hand-edit; see §8 |

Routes: `/` dashboard · `/projects` grid · `/about` the map · `/inquiry` ·
`*` NotFound. `/admin` is served by FastAPI and must never become a client route.

---

## 8. The India map

**The boundary must be the Survey of India depiction, including Jammu & Kashmir
and Ladakh.** `tools/make_india_svg.py` generates `indiaOutline.js` from
datameet's `india-composite.geojson` and **refuses to run on a boundary whose
northern extent falls short of 36°N** — the correct source reaches 37.10°N.
Never hand-edit the generated file, and never swap the source without that check
passing.

Static SVG, not Leaflet or Mapbox. Three Awwwards-winning map experiences were
fingerprinted and none used a tile library; drawing our own boundary is also the
only way to guarantee the depiction rather than re-auditing a tile provider on
every deploy.

**Known ceiling:** no pan or zoom, so temples closer than roughly 38px on screen
are clustered rather than separated. Separating them would mean displacing a
marker by over 100km. The text list is the reliable path into a dense cluster.

---

## 9. Working agreement

- **Measure, don't estimate.** Contrast computed, bundles read off a build,
  frames sampled, cold starts timed.
- **Verify in a foreground renderer.** A background Chrome tab freezes the
  renderer — transitions stall mid-flight and rAF never fires, which produces
  convincing false bug reports.
- **Fix at the shared function, not the call site.** One guard where all callers
  route through is a smaller diff than a guard in each.
- **Delete rather than add.** 45 MB of unused 3D libraries, a language feature
  with no switcher, and dead Next.js scaffolding were all removed; each had been
  actively misdirecting work.
- **Say what is not done.** A known ceiling written down beats a silent one.
