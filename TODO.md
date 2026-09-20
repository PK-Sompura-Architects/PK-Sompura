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
