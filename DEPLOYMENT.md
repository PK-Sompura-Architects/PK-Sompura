# Deployment

Three pieces: a static front end, a FastAPI back end, and Supabase (Postgres
plus image storage). All have free tiers, and both app pieces redeploy on push
to `main`.

| Piece | Host | Free tier | Auto-deploy |
|---|---|---|---|
| Front end | **Netlify** | 100 GB bandwidth/mo, always on | on push to `main` |
| Back end | **Render** | 750 instance-hours/mo *pooled per workspace*, sleeps after 15 min idle | on push to `main` |
| Database + images | **Supabase** | 500 MB DB, 1 GB storage, pauses after ~7 days idle | n/a |

`netlify.toml` proxies `/api/*` and `/admin/*` to Render, so the browser only
ever talks to one origin. That avoids CORS entirely and keeps the admin
session cookie same-origin.

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
| `ALLOWED_ORIGINS` | the Netlify origin, once it exists. Never `*` |

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

## 2. Front end -- Netlify

**Add new site > Import an existing project** > GitHub > this repository.

| Setting | Value |
|---|---|
| Base directory | `frontend` |
| Build command | `npm run build` |
| Publish directory | `frontend/dist` |

The base directory matters: without it Netlify runs the build at the
repository root, where there is no `package.json`.

Leave `VITE_API_BASE_URL` **unset**. `VITE_*` values are inlined at build time
and the code falls back to a relative base in production, which is what the
proxy in `netlify.toml` expects. Setting it to the Render URL would work but
reintroduces cross-origin requests and breaks the admin cookie.

If the Render service is not named `pk-sompura-api`, update the three redirect
targets in `frontend/netlify.toml` to match.

Then go back to Render and set `ALLOWED_ORIGINS` to the Netlify origin.

---

## 3. Keeping the free tiers alive

Render stops a free web service after **15 minutes** without traffic, and the
next visitor waits while it restarts. That restart is not merely slow: Netlify
gives up on a proxied request at around 30 seconds, so a cold start slower than
that returns an error to the visitor rather than late data.

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
| URL | `https://pk-sompura-api.onrender.com/` |
| Timezone | Asia/Kolkata (so the hours below are IST, no UTC arithmetic) |
| Minutes | `0,10,20,30,40,50` |
| Hours | `10-19` |
| Days | every day |

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

`.github/workflows/keepalive.yml` runs a real `SELECT` against Postgres every
three days. Supabase pauses a project after about seven days of inactivity, and
a REST ping does not reliably count. Needs the `DATABASE_URL` repository
**secret**. Three days is far enough inside seven that GitHub's unreliable
scheduling still leaves room to miss a run or two.

---

## 4. Custom domain

Buy the domain only -- the hosting upsells are for a service Netlify already
provides free.

Add it in **Netlify > Domain management**, point the registrar's nameservers
or records at Netlify as instructed there, and let Netlify issue the
certificate. The domain points at Netlify alone; the API and admin panel
continue to arrive through the proxy on the same hostname.

---

## Deploying afterwards

Push to `main`. Netlify and Render both rebuild on their own. Environment
variables are not in the repository, so changing one means editing it in the
dashboard, which triggers its own redeploy.
