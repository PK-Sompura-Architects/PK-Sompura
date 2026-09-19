# PK Sompura -- front end

Vite 7 + React 19. The folder still carries a few habits from the
`create-next-app` scaffold it started as, but Next.js is not installed.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # -> dist/
npm run lint
```

The dev server expects the API at `VITE_API_BASE_URL`, or `http://localhost:8000`
when that is unset and the build is a dev build. In production the variable is
left unset on purpose: `netlify.toml` proxies `/api/*` and `/admin/*` to Render,
so the site talks to its own origin and needs no CORS.

`VITE_*` values are inlined into the bundle at build time and are therefore
public. Nothing secret may be named `VITE_*`.

See `../DEPLOYMENT.md` for hosting and `../design-system/pk-sompura/MASTER.md`
for the palette, contrast rules and the list of known landmines.
