# This is a Vite + React app, not Next.js

The folder was scaffolded with `create-next-app` and then rebuilt on Vite.
Next.js is not installed and there is no `next` dependency; `next.config.ts`,
`next-env.d.ts`, `tsconfig.json` and the Next flavour of the ESLint config have
been deleted. An earlier version of this file told agents to read
`node_modules/next/dist/docs/`, which does not exist.

- **Vite 7 + React 19**, plain JavaScript and JSX. There are no `.ts`/`.tsx`
  sources, and no `@/*` path alias -- import by relative path.
- Routing is **react-router-dom** in `src/App.jsx`, with `React.lazy` per route.
- `npm run dev` / `npm run build` / `npm run lint` -- Vite and flat ESLint.
- Design tokens live in `src/global.css`. Read
  `design-system/pk-sompura/MASTER.md` before any visual change; it records the
  palette, the measured contrast ratios, and the landmines.
