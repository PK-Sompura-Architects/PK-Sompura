# Frontend — Vite + React 19, not Next.js

**Read `../CLAUDE.md` first.** It holds the palette with measured contrast
ratios, the one motion timing scale, the performance budget and the traps.

- No `next` dependency, no TypeScript sources, no `@/*` alias — import by
  relative path. Routing is `react-router-dom` in `src/App.jsx`, lazy per route.
- **No Tailwind.** Use the tokens in `src/global.css`.
- Durations come from `--dur-hover` / `--dur-move` / `--dur-enter`. Never a bare
  millisecond value, never `linear` or `ease-in-out`.
- `src/components/indiaOutline.js` is **generated** by
  `tools/make_india_svg.py`. Do not hand-edit it.
