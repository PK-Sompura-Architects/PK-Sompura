# TODO — planned work, not started

Nothing here is built yet. Items get added over time and executed in phases.

---

## 1. Interactive India project map

Map of India on the Projects page showing every temple project (~40+), so a
visitor grasps three generations of geographic scale in a few seconds and can
click through to a project's photos.

### Placement
- New section on the Projects page, above the existing gallery grid.
- Compact, non-interactive preview on the Dashboard (static image or simple SVG
  with dot markers) that links through to the full map.
- Not on the landing page — it must not add to the initial bundle.

### Data model — extend `TempleProject`
- `latitude` — Float, nullable
- `longitude` — Float, nullable
- `city` — String, nullable (localised alongside name/description)
- `state` — String, nullable
- `year_completed` — Integer, nullable
- `status` — `completed` | `in_progress` | `planned`

Migration consistent with the current pattern (`ensure_schema()` addition or
Alembic-style). Backfill coordinates from a CSV seed file — not hardcoded in
application code.

### API — `GET /api/temples/map`
Lean payload, not the full project serialisation:
`[{ id, name, city, state, lat, lng, year_completed, status, cover_thumb }]`

- Honour `?lang=` and the server-side `_localised` helper.
- Cacheable; set cache headers.
- Projects without coordinates are excluded here but must still appear in the
  existing gallery list.

### Frontend
Pick one and state the reasoning:
- **react-leaflet + Leaflet + OpenStreetMap tiles** — no API key, no billing.
- **Static SVG India + absolutely-positioned markers** from an equirectangular
  projection — lighter, fully offline, no pan/zoom fidelity.

Either way:
- Load via `React.lazy` + `Suspense`, matching the existing route splitting. The
  map library must not land in the main chunk.
- Marker clustering when zoomed out — several projects cluster around Palitana
  and Saurashtra.
- Accurate India boundary including Jammu & Kashmir and Ladakh per Survey of
  India depiction. Verify the tile provider or SVG asset before shipping.
- Markers styled with the existing indigo/sky/stone tokens. Differentiate
  `status` by colour **and** shape or label, with a visible legend — never
  colour alone.

### Interaction
- Hover a marker → tooltip with project name and city.
- Click → side panel (desktop) or bottom sheet (mobile): name, location, year,
  short description, cover image, "View gallery" button.
- "View gallery" opens the existing `GalleryModal`. Reuse it; no second lightbox.
- Filters above the map: state, decade, status.
- Optional counter: "40+ temples across N states" — derived from the data, never
  hardcoded.

### Performance
- Must not regress the main bundle. Measure before and after; report both.
- Marker thumbnails use the `cover_thumb` variant and lazy loading, never
  full-size images.
- Cap the zoom range so tile requests stay bounded.

### Stack gotchas to respect
- Lenis smooth scroll: any overlay, side panel or bottom sheet needs
  `data-lenis-prevent` **and** an `html` overflow lock. `overflow: hidden` alone
  does not stop Lenis, because Lenis scrolls programmatically. Never put the
  lock on `<body>` — its `overflow-x: clip` computes to `hidden` once the other
  axis is set, which once made the whole site unscrollable.
- The Dock sits at `z-index: 99999`. Overlays need 100000+.
- No Tailwind installed. Use the CSS custom-property tokens; utility classes
  silently do nothing.
- Nothing secret in `VITE_*` — those are inlined into the published bundle.

### Accessibility
- Keyboard: markers reachable by Tab, activated by Enter, panel dismissed by
  Escape.
- Plain-text fallback list of every project location beneath the map, grouped by
  state. Serves screen readers, no-JS visitors, and SEO.
- WCAG AA contrast on all marker, legend and panel text — measured, not
  estimated.

### Acceptance criteria
1. All ~40+ projects with coordinates render on an accurate map of India.
2. Clicking a marker opens project detail and can reach the gallery modal.
3. State, decade and status filters update both the marker set and the counter.
4. Full functionality at 360px wide with no horizontal page scroll.
5. Main bundle unchanged within a small margin; map code loads only on
   `/projects`.
6. Text fallback list present and complete in the DOM.
7. Lighthouse accessibility score not regressed.

### Out of scope
Driving directions, user geolocation, live construction status feeds, satellite
imagery.

### Open questions (raise before building)
- The brief asks for map UI strings to go through `LanguageContext` /
  `useLanguage`. **That context was deleted** — the site is English-only by
  decision. Either the strings stay English, or the language feature comes back
  first. Assume English-only unless told otherwise.
- `TempleProject` already has `city`, `state` and `year`. Confirm whether
  `year_completed` is a rename of `year` or a second field before migrating.
- 21 projects exist in the database today, not 40+. The remaining ones need
  entering before the map has anything to show.
- `useLazyImage` was deleted as unused; native `loading="lazy"` covers it.

---

## 2. Map item — decisions made (amends item 1)

- **No language switcher.** Confirmed: all map UI strings stay English. Drop the
  `LanguageContext` / `useLanguage` requirement from the brief entirely.
- **`city` and `state` will be filled in** by hand in the admin panel.
- **No `year` / `year_completed` on the map.** The year is genuinely forgotten
  for many of the older projects, so a per-temple year is not worth adding.
  Consequence: **drop the decade filter** from item 1 — it cannot work without
  years. Filters become state and status only.
- **Some projects have no usable images.** They exist to be counted, for
  credibility of scale. So:
  - A marker must render fine with no photos.
  - The detail panel needs a no-images state — name, city, state, stone type,
    and no "View gallery" button rather than an empty modal.
  - The counter ("N temples across M states") includes them.

## 3. Split the Projects section in two

Two categories, surfaced on the Projects page and as a map marker distinction:

1. **Artificial mountain temples** — a mountain built artificially with the
   temple inside. Examples: Vaishno Devi Ahmedabad, Vaishno Devi Gulbarga
   (Karnataka).
2. **Regular stone temples.**

Needs a `category` column on `TempleProject`, an admin panel field, and a filter
on the Projects page. On the map this is the second axis alongside `status` —
decide whether category is marker *shape* and status is *colour*, so neither
relies on colour alone.

## 4. Stone type column

New column on `TempleProject`: the stone used to build that temple. String, or
an enum if the set turns out to be small and fixed — check what the real values
are before choosing. Shown in the project detail panel and the gallery modal
subtitle, and worth a filter if the values are few.

## 5. Dashboard rebuild

### Layout changes
- **Logo centred in the background**, company name in front of it.
- **Remove the page redirector** (the `HeroNav` three-card block).
- **Remove the lineage section** from the dashboard. It stays on `/about`.
- **Add the India projects map** to the dashboard as well — the compact preview
  from item 1, linking through to the full map on `/projects`.

### Scroll performance — must be fixed, not patched
The current scrolling is too laggy. Redefine the scroll approach wholesale and
eliminate the jank. Reference feel: https://www.igloo.inc/ — the *smoothness*
only, not the infinite scroll. Broader reference: https://www.awwwards.com/.

Measured causes of the lag are recorded in the report below; the chosen approach
gets appended to this file once picked.

## 6. Netlify → Vercel

Move the frontend off Netlify to Vercel, to lose the Netlify badge in the bottom
right without buying a domain.

- Port `netlify.toml` to `vercel.json`: the `/api/*` and `/admin/*` proxy
  rewrites to the Render backend **must come before** the SPA catch-all, exactly
  as they do now, or `/admin` will be swallowed by the React router.
- Keep the trailing-slash behaviour intact — the backend has bare-prefix routes
  registered specifically so a proxied request never 307s to the Render host.
- `VITE_*` env vars must be set in the Vercel project before the first build;
  they are inlined at build time. Nothing secret goes in them.
- Update `ALLOWED_ORIGINS` on Render to the new Vercel origin, and check
  `DEPLOYMENT.md` afterwards.

---

## 7. Design language for the rebuild (soft-skill, translated to this stack)

Agency-tier direction to apply when items 1, 3 and 5 are built. The source spec
assumes Tailwind and a different font/icon set, so it is translated here to what
this project actually has. **Read the conflicts first — four of its rules cannot
be followed literally.**

### Conflicts with this codebase
- **No Tailwind.** Every utility class in the spec (`rounded-[2rem]`,
  `backdrop-blur-2xl`, `ring-1`, `col-span-8`, `py-24`) silently does nothing
  here. Each pattern must be rewritten as real CSS against the existing custom
  properties.
- **Fonts.** The spec bans Inter/Roboto/Helvetica and suggests Geist, Clash
  Display, PP Editorial New. We ship **Cinzel** (headings) and **Outfit**
  (body), neither banned. Cinzel is a classical inscriptional serif and is
  arguably a better fit for temple architecture than anything on its list.
  Keep them — adding a webfont costs more than it buys, and the Indic fonts were
  just removed for exactly that reason.
- **Icons.** The spec bans "standard thick-stroked Lucide". We use
  `lucide-react` throughout. Do not swap the library; instead standardise on
  `strokeWidth={1.5}` or lighter, which `WorkingSitesSection` already does.
- **Dark OLED / glass vibe does not apply.** This is a light, paper-toned site
  (`--c-paper: #F7FAFC`). Of the three vibe archetypes, **Editorial Luxury** is
  the only coherent fit: warm paper, high-contrast serif headings, optional film
  grain. Do not introduce an OLED-black glass theme.

### What to adopt
- **Layout archetype: Editorial Split** for the dashboard hero — the wordmark
  and title as massive type, the logo mark centred behind it (item 5 already
  asks for exactly this). **Asymmetrical Bento** is already in use on Projects
  via `MagicBento`; keep it.
- **Double-bezel containers.** Outer shell with a hairline border and small
  padding, inner core with its own background and an inset highlight, and a
  mathematically smaller radius for concentric curves. We already have
  `--radius-sm/md/lg/xl`; derive the inner radius with `calc()` rather than
  hardcoding.
- **Button-in-button trailing icon.** An arrow never sits naked beside the
  label; it gets its own circular wrapper flush with the pill's inner padding.
  `HeroNav` already uses `ArrowUpRight` — reuse that pattern on the map's
  "View gallery" CTA.
- **Eyebrow tags** before major headings — tiny uppercase pill, wide letter
  spacing. The `.eyebrow` class already exists on the Projects header; promote
  it to a shared component.
- **Macro whitespace.** `--space-2xl` (6rem) as the section rhythm minimum.
- **Custom easing only.** Never `linear` or `ease-in-out`. We already have
  `--ease-smooth`, `--ease-dramatic` and `--ease-out-expo`; the spec's
  `cubic-bezier(0.32, 0.72, 0, 1)` is close enough to `--ease-out-expo` that no
  fourth curve is needed.
- **Staggered reveals** on entry, via `IntersectionObserver` or GSAP
  ScrollTrigger — never a `scroll` event listener.
- **Magnetic button physics** — `active: scale(0.98)`, inner icon translating
  diagonally on hover.

### Performance rules that override the aesthetics
The spec's own guardrails confirm the diagnosis from the scroll investigation,
so these are not optional:
- **Never animate `filter: blur()`**, and never blur a scrolling container. The
  dashboard currently animates `blur(10px)` on the `<h1>` and this is a measured
  cause of the jank. The spec allows `backdrop-blur` **only** on fixed or sticky
  elements — so the `Dock` may keep it, `ChromaGrid` cards may not.
- **Grain or noise overlays** must live on a single `position: fixed`,
  `pointer-events: none` layer — never attached to scrolling content.
- **Animate `transform` and `opacity` only.** Never `top`, `left`, `width`,
  `height`. Use `will-change` only while something is actually animating — the
  permanent `will-change: transform` on `.dashboard-bg` is part of the problem.
- **No arbitrary z-indexes.** The Dock owns 99999 and `GalleryModal` owns
  100000; anything new fits that scale deliberately.
- **`min-height: 100dvh`**, never `100vh`, so iOS Safari does not jump.
- Below 768px every asymmetric layout collapses to a single full-width column.
  Rotations and negative-margin overlaps are removed, not merely scaled down —
  they break touch targets. Must hold at 360px with no horizontal scroll.

---

## 8. Verified UX rules for the rebuild (ui-ux-pro-max searches)

Queried against the skill's local database, stack detected as React 19 + Vite
(not Next.js). Every rule below came back from a real search — none is invented.
These are constraints on items 1, 3, 5 and 7, and where they conflict with the
aesthetic direction in item 7, these win.

### Scroll reveals — GSAP ScrollTrigger, subtle tier
Returned snippet, to replace the hand-rolled `ScrollReveal`:

```js
gsap.from(el, {
  opacity: 0, y: 12, duration: 0.35, ease: 'power1.out',
  scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none reverse' }
});
```

- Keep the Y offset at **8–16px** so it reads as a fade, not a slide. The
  current `ScrollReveal` uses 24px plus a 5° rotation plus a 10px blur — all
  three are more than the guidance calls for, and the blur is a measured cause
  of the jank.
- `toggleActions: 'play none none reverse'` stops it re-firing on every scroll
  direction change.
- Register ScrollTrigger once, and gate everything behind
  `gsap.matchMedia('(prefers-reduced-motion: reduce)')`, rendering the final
  state immediately when motion is reduced.
- **Do not reveal below-the-fold content as invisible-by-default without a
  no-JS fallback** — it hides content from crawlers. This applies directly to
  the map's plain-text project list in item 1: it must be visible in the DOM
  without JavaScript, not animated in.

If a headline treatment is wanted later, SplitText ships with our GSAP version,
but only for headlines under ~8 words, and `split.revert()` must run on unmount
or assistive tech is left reading per-character spans.

### Touch targets — the map markers are the risk
- Web uses the WCAG target-size rule (**24 CSS px** minimum), while iOS wants
  44pt and Android 48dp. Do not treat one number as universal.
- **Minimum 8px between adjacent targets.** At 360px width, clustered Palitana
  and Saurashtra markers will violate this before anything else does — which is
  the real argument for the clustering requirement in item 1, beyond looks.

### Colour and legend
- **Never convey information by colour alone** — pair it with an icon or text.
  Item 1's `status` markers and item 3's `category` markers both need a shape or
  label difference, and the legend must name each one in words.
- 4.5:1 minimum for normal text, measured. The palette table in
  `design-system/pk-sompura/MASTER.md` already has validated ratios — use those
  tokens rather than picking new marker colours.

### Focus, for the map panel and the gallery modal
- Every interactive control needs a **visible** focus ring, modal controls
  included. Never `outline: none` without a replacement.
- `outline: 2px solid currentColor; outline-offset: 2px` satisfies the 2px
  perimeter and 3:1 state contrast the AAA focus-appearance criterion asks for.
  Worth having, but note it is **AAA**, not required for the AA target.
- Keep the focused element fully unobscured. The Dock is fixed at the bottom on
  mobile — check it does not cover a focused marker or a focused control in the
  bottom sheet.

### Note on `MASTER.md`
`design-system/pk-sompura/MASTER.md` already exists and holds validated contrast
ratios and palette naming history. **Do not regenerate it** — the skill's
`--persist --force` would discard those decisions. Its stack line has been
corrected in place: it previously advertised three.js, @react-three/fiber, drei
and ogl as part of the stack, none of which anything imports.

---

## 9. Rejected: Tailwind + shadcn/ui

Considered and declined, recorded so it does not get re-proposed each session.

Measured state of the frontend: **zero** Tailwind, shadcn, Radix, clsx or
class-variance-authority packages; no `tailwind.config.*`, `components.json`,
`postcss.config.*` or `tsconfig.json`; **14 CSS files, 2120 lines** of
token-based CSS; **19 `.jsx` files and 0 TypeScript files**.

Adopting that stack would mean a Tailwind install and config, a PostCSS
pipeline, re-expressing 2120 lines of working CSS as utilities, a TypeScript
migration for shadcn's type-first components, and Radix as a new dependency
tree — to arrive at the styling system we already have. `global.css` holds a
validated palette with measured contrast ratios, a spacing scale, four radius
steps and three easing curves. That is a design system; it is simply not a
utility-class one.

Two pieces of the idea are worth keeping without the stack:
- **Radix-style dialog semantics.** `GalleryModal` already has `role="dialog"`,
  `aria-modal`, Escape-to-close and a scroll lock. The map's side panel and
  bottom sheet (item 1) should reuse that component's pattern rather than import a
  primitives library.
- **Focus-visible discipline** on every control, which item 8 already records.

If a component library is ever genuinely wanted, the decision to make first is
TypeScript — shadcn assumes it, and `tsconfig.json` was deliberately deleted
when the dead Next.js scaffolding went.
