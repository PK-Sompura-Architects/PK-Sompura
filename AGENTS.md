# P.K. Sompura

**Read `CLAUDE.md` before changing anything.** It is the project bible: brand,
palette with measured contrast ratios, the motion timing scale, the performance
budget, the traps in this codebase, and the working agreement. Every number in
it was measured rather than estimated.

Quick orientation, all of it expanded in `CLAUDE.md`:

- **Vite 7 + React 19, plain JS/JSX.** No Tailwind, no TypeScript, no Next.js.
  Utility classes silently do nothing; the CSS custom properties in
  `frontend/src/global.css` are the styling system.
- **FastAPI + SQLAlchemy behind it**, Supabase Postgres, Render for the API.
  Collection routes register both `""` and `"/"` — see CLAUDE.md §5 for why.
- **English only**, and **no photographs of the family** — both deliberate
  decisions, not gaps. CLAUDE.md §1.1.
- `TODO.md` holds planned work and what is already done.
