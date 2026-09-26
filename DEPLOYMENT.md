# Deployment

Three pieces: a static front end, a FastAPI back end, and Supabase (Postgres
plus image storage). All have free tiers, and both app pieces redeploy on push
to `main`.

| Piece | Host | Free tier | Auto-deploy |
|---|---|---|---|
| Front end | **Vercel** | 100 GB bandwidth/mo, always on, no platform badge | on push to `main` |
| Back end | **Render** | 750 instance-hours/mo *pooled per workspace*, sleeps after 15 min idle | on push to `main` |
| Database + images | **Supabase** | 500 MB DB, 1 GB storage, pauses after ~7 days idle | n/a |

`frontend/vercel.json` proxies `/api` and `/admin` to Render, so the browser
only ever talks to one origin. That avoids CORS entirely and keeps the admin
session cookie same-origin.

**The rewrite patterns must be `(.*)` with `$1`, not `:path*`.** A named
parameter does not bind the empty segment a trailing slash produces, so
`/api/projects/` misses the rule and falls through to the SPA catch-all —
which shipped once and broke three of the four paths the front end calls. See
`VERCEL.md`.

---

## 0. Before anything is public

Set the admin password. Until this is done the panel is reachable by anyone
who finds the URL, with full write access to every record.

```bash
python -m backend.security --own --set
```

Type the password; Ctrl+V does not paste at a hidden prompt on Windows. It
writes the hash to `backend/.env` and prints the line for Render. Save the
password in a password manager -- only the scrypt hash is stored, and it
cannot be reversed.

---

## 1. Back end -- Render

**New + > Blueprint** (not "Web Service"; `render.yaml` already declares the
runtime, build and start commands, health check and region). Connect the
repository and apply.

To deploy from an organisation the Render GitHub App has to be installed on
it: on the repository picker use **Configure account**, choose the org, and
grant access to this repository. An existing personal connection is unaffected.

### Environment variables

Every secret is marked `sync: false` in `render.yaml`, so none of them live in
the repository. Set them under **Environment**, without quotes:

| Key | Value |
|---|---|
| `DATABASE_URL` | Supabase session-pooler URI. Must start `postgresql://` and have any special characters in the password percent-encoded |
| `SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `SUPABASE_SERVICE_KEY` | the secret key, not the publishable one -- storage writes are rejected without it |
| `ADMIN_USERNAME` | admin login name |
| `ADMIN_PASSWORD_HASH` | from step 0, the part after `ADMIN_PASSWORD_HASH=` |
| `SESSION_SECRET` | `python -c "import secrets; print(secrets.token_urlsafe(32))"` |
| `SESSION_HTTPS_ONLY` | `true` (already set in `render.yaml`) |
| `ALLOWED_ORIGINS` | your origins, comma-separated. Never `*`. See §2 |

`SESSION_SECRET` is not optional. Unset, the app falls back to a random value
per process, so every restart invalidates every admin session.

### Verify before moving on

```
https://<service>.onrender.com/              -> {"message":"PK Sompura Backend API is running"}
https://<service>.onrender.com/api/projects/ -> the project list, NOT []
```

An empty list means `DATABASE_URL` is not reaching the app. The service now
refuses to start in that case rather than silently serving an empty site from
a fresh SQLite file, so check the deploy log for the `DATABASE_URL is not set`
error.

---

## 2. Front end -- Vercel

**Add New > Project** > GitHub > this repository.

| Setting | Value |
|---|---|
| Root Directory | `frontend` |
| Framework preset | Vite (auto-detected) |
| Build command / output | leave alone — `vercel.json` supplies them |

**Root Directory is the setting that breaks everything if it is wrong.**
Without it Vercel builds at the repository root, where there is no
`package.json`.

### Environment variables: add none

`VITE_API_BASE_URL` is the only `import.meta.env.VITE_*` reference in the whole
front end (`src/apiBase.js`), and it must stay **empty or unset**. The code
falls back to a relative base in production, which is what the proxy expects.
Setting it to the Render URL reintroduces cross-origin requests and breaks the
admin cookie.

Do not add `VITE_SUPABASE_*` variables. Nothing reads them:
`@supabase/supabase-js` is not a front-end dependency and "supabase" does not
appear in `src/`. The browser talks to FastAPI; FastAPI owns the database.

Anything named `VITE_*` is inlined into the bundle at build time and readable by
anyone who opens the site, so nothing secret may carry that prefix.

### Node version

`engines.node` in `frontend/package.json` pins `>=20.19`, Vite 7's actual floor.
`vercel.json` has no field for this, so without the pin the platform default
silently decides.

If the Render service is not named `pk-sompura-api`, update the three rewrite
destinations in `frontend/vercel.json` to match.

### Then set the origins on Render

```
ALLOWED_ORIGINS=https://<project>.vercel.app,http://localhost:5173,http://127.0.0.1:5173
```

The value **replaces** the default rather than adding to it
(`backend/main.py:71`), so naming only the deployed origin silently ends local
development against the deployed backend. Include both localhost forms.

This is a safety net, not a blocker: because the rewrite is server-side, the
browser never makes a cross-origin call and the site works without it. It
matters when something reaches the API directly.

---

## 3. Keeping the free tiers alive

Render stops a free web service after **15 minutes** without traffic, and the
next visitor waits while it restarts. That restart is not merely slow: the host
gives up on a proxied request well before a slow cold start finishes, so the
visitor gets an error rather than late data. Measured through the proxy, a cold
start cost **19.98 s** against 0.21 s warm — close enough to any gateway limit
that the pinger below is the fix, not a longer timeout.

### The pinger is cron-job.org, not GitHub Actions

`.github/workflows/keep-backend-awake.yml` was the first attempt and it does
not work. Measured on 19 Sep 2026: the workflow was pushed at 05:13 UTC, and by
12:58 UTC its `*/10` schedule should have fired about 46 times. It had run
**once**. GitHub treats scheduled workflows on free public repositories as
best effort and drops high-frequency crons under load, so the backend was still
cold at 18:28 IST -- inside the window -- and took 20 seconds to answer.

Use an external monitor instead. Settings that match the intended window:

| Field | Value |
|---|---|
| URL | `https://pk-sompura-api.onrender.com/health/db` |
| Timezone | Asia/Kolkata (so the hours below are IST, no UTC arithmetic) |
| Minutes | `0,10,20,30,40,50` |
| Hours | `10-19` |
| Days | every day |
| Treat as failure | any status other than 2xx |

**The URL is `/health/db`, not `/`.** These are two different timers and `/`
only resets one: it returns a hardcoded string and never opens a database
connection, so a monitor hitting it keeps the API warm while Supabase quietly
counts down to a pause that takes the whole site off the air. `/health/db` runs
a `SELECT 1`, so one scheduled request resets both. It answers **503** when the
database is unreachable, which is why the failure rule above is worth setting —
that turns the keepalive into outage alerting for free.

One job per Render service. A ping that times out still counts as traffic and
still wakes the service, so an occasional red mark in the monitor's history is
not a failure of the keepalive.

The 750 instance hours are pooled across the whole Render workspace, not per
service. Two services awake nine hours a day costs about 562 a month; awake
around the clock would need about 1,460 and both would be suspended partway
through the month. Keep every pinger on the same window, or the hours are spent
twice.

`$7/month` per service on Render's Starter plan removes the sleep entirely and
is worth weighing against a prospective client's first click hanging.

### Supabase

Covered by the same `/health/db` ping above, which is the point of that
endpoint. Supabase pauses a project after about seven days of inactivity and a
REST ping does not reliably count, but a real query does — and at six requests
an hour for nine hours a day the timer never gets near seven days.

`.github/workflows/keepalive.yml` runs the same `SELECT` every three days and is
**kept deliberately**, as a second, independent mechanism. That is not
redundancy for its own sake: a paused Supabase project takes the site down until
someone restores it by hand, it is the worst failure mode the project has, and
the primary defence is now a single external monitor nobody watches. Two
unrelated mechanisms for the one failure that cannot self-heal is a reasonable
trade.

It needs the `DATABASE_URL` repository **secret** (Settings > Secrets and
variables > Actions > Secrets). Without it the workflow exits with an error
rather than silently passing — but check that it is set, because an unreliable
backup that has never once run is not a backup. Note GitHub's scheduling is
best effort, so treat this as the backup and `/health/db` as the real one.

---

## 4. Custom domain

Buy the domain only -- the hosting upsells are for a service Vercel already
provides free.

Add it in **Vercel > the project > Settings > Domains**, point the registrar's
nameservers or records at Vercel as instructed there, and let Vercel issue the
certificate. The domain points at Vercel alone; the API and admin panel continue
to arrive through the proxy on the same hostname.

A `*.vercel.app` URL carries no platform badge, which was the reason for moving
off Netlify. A domain is only needed once the goal becomes looking independent
rather than unbranded.

---

## Deploying afterwards

Push to `main`. Vercel and Render both rebuild on their own. Environment
variables are not in the repository, so changing one means editing it in the
dashboard, which triggers its own redeploy.

**Verify a front-end deploy with the trailing slashes the code actually uses.**
`/api/projects` passing tells you nothing about `/api/projects/`:

```
curl.exe -s -o /dev/null -w "%{http_code} %{content_type}
"   https://<project>.vercel.app/api/projects/
```

> **On Windows, use `curl.exe`, not `curl`.** In PowerShell `curl` is an alias
> for `Invoke-WebRequest`, which rejects curl's flags — `-s` binds to
> `-SessionVariable` and the command dies with "Missing an argument". Windows
> ships genuine curl at `C:\Windows\system32\curl.exe`, and naming the
> executable bypasses the alias. `Invoke-WebRequest` also throws on any non-2xx
> status, so it cannot check for the expected 503 without try/catch.


`application/json` is a pass; `text/html` means the SPA answered and the proxy
missed.
