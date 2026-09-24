# Moving the front end from Netlify to Vercel

The point of the move is to lose the Netlify badge in the bottom-right corner
without buying a domain. `frontend/vercel.json` is already written and is a
direct port of `frontend/netlify.toml`; nothing below needs a code change.

`netlify.toml` is deliberately left in place until the Vercel site is confirmed
working, so there is something to fall back to.

## 1. Create the project

1. Go to vercel.com, sign in with the GitHub account that owns this repository,
   and import it.
2. Set **Root Directory** to `frontend`. This is the one setting that breaks
   everything if it is wrong — Vercel would otherwise look for a build at the
   repository root and find none.
3. Framework preset should detect as **Vite**. Build command and output
   directory come from `vercel.json`, so leave them alone.

## 2. Environment variables

Before the first build, add every `VITE_*` variable the site uses. They are
inlined into the published bundle at build time, so a missing one does not
error — it silently becomes `undefined` in the shipped JavaScript.

Copy the names and values from Netlify's **Site settings → Environment
variables**. Nothing secret belongs here: anything named `VITE_*` is readable by
anyone who opens the site.

## 3. Deploy and check the proxy

The rewrites are the part most likely to go wrong, because their order matters.
`/api` and `/admin` must be matched before the catch-all that serves the React
app, or `/admin` would render the SPA's 404 page instead of the FastAPI admin
panel. `vercel.json` already has them in that order.

After the first deploy, check all three:

- `https://<project>.vercel.app/` — the site loads.
- `https://<project>.vercel.app/api/projects/` — JSON, not HTML.
- `https://<project>.vercel.app/admin` — the FastAPI login page, not the SPA.

If `/api/projects/` returns the React app, the catch-all is winning and the
rewrite order in `vercel.json` has been changed.

## 4. Point the backend at the new origin

In Render → the API service → Environment, set:

```
ALLOWED_ORIGINS=https://<project>.vercel.app
```

Keep `http://localhost:5173` in the list, comma-separated, for local work. The
backend sends credentials, and browsers reject `*` together with credentials,
so this must name the real origin.

Redeploy the backend afterwards. The same redeploy applies the additive column
migration in `ensure_schema()`, which the India map needs.

## 5. After it is confirmed working

- Turn off the Netlify site, or delete it, so there are not two live copies
  serving different builds.
- Delete `frontend/netlify.toml`.
- Update `DEPLOYMENT.md`, which still describes Netlify.

## Note on the badge

Vercel's free tier shows no badge on the deployment itself, which is the whole
reason for the move. A `*.vercel.app` URL is still obviously a platform
subdomain — if the goal later becomes looking independent rather than
unbranded, that needs the real domain.
