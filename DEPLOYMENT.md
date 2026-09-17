# Deployment

Three pieces: a static front end, a FastAPI back end, and Supabase (Postgres
plus image storage). All three have free tiers, and both app pieces redeploy
on push to `main`.

| Piece | Host | Free tier | Auto-deploy |
|---|---|---|---|
| Front end | **Netlify** | 100 GB bandwidth/mo, always on | on push to `main` |
| Back end | **Render** | 750 instance-hours/mo, sleeps after 15 min idle | on push to `main` |
| Database + images | **Supabase** | 500 MB DB, 1 GB storage, pauses after ~7 days idle | n/a |

Netlify and Vercel are interchangeable for the front end; `vercel.json` is kept
so either works. Netlify is assumed below because `netlify.toml` also proxies
the API, which avoids CORS entirely.

---

## 1. Back end — Render

1. dashboard.render.com → **New** → **Blueprint** → pick this repository.
   Render reads `render.yaml` and creates the service.
2. Set every variable marked `sync: false` under **Environment**:

   | Variable | Where it comes from |
   |---|---|
   | `DATABASE_URL` | Supabase → Connect → **Session pooler** URI. Must begin `postgresql://`, and any special character in the password must be percent-encoded (`@` → `%40`). |
   | `ADMIN_USERNAME` | your choice |
   | `ADMIN_PASSWORD_HASH` | `python -m backend.security` — store the printed password in a password manager, put only the hash here |
   | `SESSION_SECRET` | `python -c "import secrets; print(secrets.token_urlsafe(32))"` |
   | `ALLOWED_ORIGINS` | your Netlify URL, e.g. `https://pk-sompura.netlify.app` |
   | `SUPABASE_URL`, `SUPABASE_KEY` | Supabase → Project Settings → API |
   | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | BotFather, if you want inquiry notifications |

   `SESSION_SECRET` must be set explicitly. Left unset the app generates a
   random one per process, so admin sessions drop on every restart.

3. Note the service URL, e.g. `https://pk-sompura-api.onrender.com`.

## 2. Front end — Netlify

1. app.netlify.com → **Add new site** → **Import an existing project** → this repo.
2. **Base directory** `frontend`. Build command and publish directory come from
   `netlify.toml`.
3. Edit `frontend/netlify.toml` and replace the three
   `https://pk-sompura-api.onrender.com` hosts with your real Render URL, then
   push. Those rules proxy `/api/*` and `/admin/*` to the back end through this
   origin, so the browser makes no cross-origin request.
4. Leave `VITE_API_BASE_URL` unset. Empty means same-origin, which is what the
   proxy provides.

## 3. GitHub secrets

Repository → Settings → Secrets and variables → Actions:

- `DATABASE_URL` — same value as on Render. Used by the keep-alive workflow.

---

## Keeping things awake

**Supabase** pauses a free project after roughly 7 days without activity, and
the site goes down until someone restores it by hand.
`.github/workflows/keepalive.yml` runs a real `SELECT` every 3 days, which is
what actually resets that timer — merely requesting the REST endpoint is not
reliable. Check it under the Actions tab after the first run.

**Render** free services sleep after 15 minutes idle and take roughly 50
seconds to wake, so the first visitor after a quiet spell waits. Options:

- Accept it. Simplest, and fine for a low-traffic brochure site.
- Ping `/` every 10 minutes from a free external monitor such as
  UptimeRobot or cron-job.org. Do **not** do this from GitHub Actions: at that
  frequency it burns Actions minutes for no reason, and scheduled runs are
  throttled under load anyway. 750 instance-hours/month is enough to keep one
  service up continuously.
- Upgrade to Render's paid tier.

---

## Before going live

- [ ] `ADMIN_PASSWORD_HASH` set on Render, and the password saved somewhere safe
- [ ] `SESSION_SECRET` set explicitly, not left to the random fallback
- [ ] `SESSION_HTTPS_ONLY=true` (already in `render.yaml`)
- [ ] `ALLOWED_ORIGINS` lists only your real front-end origin, never `*`
- [ ] `netlify.toml` points at the real Render URL
- [ ] Row Level Security on for every Supabase table — it is currently enabled
      with no policies, which denies anon-key access while the back end, which
      connects directly to Postgres, is unaffected
- [ ] No secret in any `VITE_*` variable. Vite inlines those into the bundle in
      plain text; CI fails the build if it spots one.
