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
