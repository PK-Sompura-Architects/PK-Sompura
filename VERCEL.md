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

## 2. Environment variables — there is only one, and it stays empty

**Add nothing.** Measured, not assumed: `VITE_API_BASE_URL` is the only
`import.meta.env.VITE_*` reference in the whole front end (`src/apiBase.js`),
and it must be **empty or unset** on Vercel. `vercel.json` proxies `/api` and
`/admin` to Render, so a relative base keeps every call same-origin and skips
the CORS preflight. Setting it to the Render URL defeats the proxy and makes the
browser call Render cross-origin instead.

Do **not** copy `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` across if you
see them on Netlify. Nothing reads them: `@supabase/supabase-js` is not a
front-end dependency and "supabase" does not appear in `src/` at all. The
browser talks to FastAPI; FastAPI owns the database connection.

Anything named `VITE_*` is inlined into the bundle at build time and is readable
by anyone who opens the site, so nothing secret may ever carry that prefix.

### Node version

`netlify.toml` pinned `NODE_VERSION = "20"`. `vercel.json` has no equivalent
field, so `engines.node` in `frontend/package.json` carries the pin instead —
`>=20.19`, which is Vite 7's actual floor. Without it the platform default
silently decides, which is how a build passes on one host and fails on the
other.

## 3. Deploy and check the proxy

The rewrites are the part most likely to go wrong, because their order matters.
`/api` and `/admin` must be matched before the catch-all that serves the React
app, or `/admin` would render the SPA's 404 page instead of the FastAPI admin
panel. `vercel.json` already has them in that order.

After the first deploy, check all three:

- `https://<project>.vercel.app/` — the site loads.
- `https://<project>.vercel.app/api/projects/` — JSON, not HTML.
- `https://<project>.vercel.app/admin` — the FastAPI login page, not the SPA.

If `/api/projects/` returns the React app, the catch-all is winning. **Check the
trailing slash before you check the order** — that is what went wrong the first
time, and the order was fine.

`:path*` does not bind the empty final segment a trailing slash produces, so
`/api/projects/` missed `/api/:path*` altogether and fell through to the SPA
catch-all. `netlify.toml` used `/api/*`, a splat, which does match a trailing
slash; porting it to a named parameter silently lost that. Measured on the live
deployment: `/api/projects` returned JSON while `/api/projects/` returned
`<title>P. K. Sompura …</title>`, and `/admin/` served the SPA while
`/admin/login` reached the real panel.

It broke three of the four paths the front end actually calls — `/api/projects/`,
`/api/galleries/` and `/api/contact/` all end in a slash; only
`/api/projects/map` does not. Fixed by using `(.*)` with `$1`, the same regex
form the catch-all already uses, which matches with or without the slash.

**Test every path with its real trailing slash**, not a tidied-up version:

```
curl -s -o /dev/null -w "%{http_code} %{content_type}
"   https://<project>.vercel.app/api/projects/
```

`application/json` is a pass. `text/html` means the SPA answered.

**Expect `/admin` to end up on the Render URL, and do not treat that as a
broken deploy.** SQLAdmin builds absolute URLs from the request it sees, and a
rewrite reaches Render with Render's own Host header. Measured locally: the login
page emits `href="http://127.0.0.1:8000/admin/statics/css/main.css"` — a fully
qualified URL, not a relative path — and the `/admin/` redirect carries the same
host. Through the proxy those become `pk-sompura-api.onrender.com`, so the panel
and its assets load from Render rather than the proxy origin. This is exactly the
trap in CLAUDE.md §5, it already behaves this way on Netlify, and the move
changes nothing about it. The panel works; it just lives at the Render domain.

`vite.config.js` also proxies `/statics`, which neither host config forwards.
That is fine and not a gap: SQLAdmin serves its assets under `/admin/statics/`,
which the `/admin/:path*` rewrite already covers.

## 4. Point the backend at the new origin

In Render → the API service → Environment, set:

```
ALLOWED_ORIGINS=https://<project>.vercel.app,http://localhost:5173,http://127.0.0.1:5173
```

**This is a safety net, not a blocker.** Because `vercel.json` rewrites `/api`
server-side, the browser only ever sees the Vercel origin — the call to Render
happens Vercel-to-Render, so no CORS preflight occurs and the site works even if
this is never set. It matters the moment anything reaches the API directly:
hitting the Render URL to test, or a future deploy without a proxy in front.

Two things that are easy to get wrong, both read off `backend/main.py:71`:

- The value **replaces** the default rather than adding to it. The default is
  `http://localhost:5173,http://127.0.0.1:5173`, so naming only the Vercel
  origin silently ends local development against the deployed backend. Include
  both localhost forms, as above.
- It is comma-separated and each entry is stripped, so spaces after commas are
  fine. It must name real origins: the backend sets `allow_credentials=True`,
  and browsers reject `*` together with credentials.

Redeploy the backend afterwards. The same redeploy applies the additive column
migration in `ensure_schema()`, which the India map needs.

## 5. After it is confirmed working — DONE

- ~~Turn off or delete the Netlify site~~ — deleted.
- ~~Delete `frontend/netlify.toml`~~ — deleted. There is no fallback host any
  more, so the file described a deployment that no longer exists.
- ~~Update `DEPLOYMENT.md`~~ — rewritten for Vercel: Root Directory instead of
  Base directory, the "add no environment variables" rule with the reason, the
  `engines.node` pin, the `ALLOWED_ORIGINS` value including both localhost
  forms, and a verification curl that uses a real trailing slash.
- The comment in `src/apiBase.js` pointed at `netlify.toml`; it now points at
  `frontend/vercel.json`.

## Note on the badge

Vercel's free tier shows no badge on the deployment itself, which is the whole
reason for the move. A `*.vercel.app` URL is still obviously a platform
subdomain — if the goal later becomes looking independent rather than
unbranded, that needs the real domain.
