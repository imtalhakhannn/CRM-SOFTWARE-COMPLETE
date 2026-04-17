# Docker Deployment Guide

Everything is now dockerized. You can:

- **Run locally:** `docker compose up --build`
- **Deploy on any free platform** that supports Docker containers

---

## Option A · Local dev with Docker (1 command)

Requires Docker Desktop running.

```bash
# First run — seed demo data
SEED_ON_STARTUP=true docker compose up --build

# Subsequent runs
docker compose up
```

Visit:
- Frontend → http://localhost:8080
- Backend  → http://localhost:8000/docs

Stop: `Ctrl+C` then `docker compose down` (add `-v` to wipe the MySQL volume).

---

## Option B · Deploy free on Koyeb (recommended — no credit card)

[Koyeb](https://www.koyeb.com) gives you **1 free Nano web service + 1 free managed Postgres**, truly free, no card required at signup. Uses your GitHub repo + a Dockerfile — perfect fit.

### B1 · Sign up
https://www.koyeb.com → Sign up with GitHub.

### B2 · Create free Postgres database
1. Dashboard → **Database services** → **Create Database Service**
2. Plan: **Free (ecotrial)** → name it `crm-db` → create
3. On the database page, click **Connection details** → copy the `External connection string`.
   It looks like:
   ```
   postgresql://koyeb-adm:xxx@ep-xxx-a.postgres.databases.koyeb.com/koyebdb
   ```
4. Change the scheme to `postgresql+psycopg2://` and keep it.

### B3 · Deploy the backend
1. Dashboard → **Overview** → **Create service** → **GitHub**
2. Authorise Koyeb to read your repo → select `CRM-SOFTWARE-COMPLETE` → branch `main`
3. **Builder:** Dockerfile
4. **Work directory:** `backend`
5. **Instance:** Free (Nano, 0.1 vCPU / 512 MB)
6. **Health check:** TCP or HTTP `/health` on port `8000`
7. **Environment variables** → add:
   | Name | Value |
   |---|---|
   | `DATABASE_URL` | `postgresql+psycopg2://…` from B2 |
   | `SECRET_KEY` | any long random string (or use `openssl rand -base64 48`) |
   | `BACKEND_CORS_ORIGINS` | `*` *(tighten later)* |
   | `SEED_ON_STARTUP` | `true` *(only first deploy)* |
   | `PORT` | `8000` |
8. **Exposed port** → `8000`, path `/`
9. **Deploy**. Watch the build logs; first build ≈ 3 min.

After the service is healthy, copy its URL (looks like `https://crm-backend-YOUR-ORG.koyeb.app`).

Then go back to **Environment** → flip `SEED_ON_STARTUP` to `false` → save.

### B4 · Deploy the frontend
Same flow, new service:

1. **Create service** → **GitHub** → same repo → branch `main`
2. **Builder:** Dockerfile
3. **Work directory:** `frontend`
4. **Build command:** *(empty — Dockerfile handles it)*
5. **Environment variables**:
   | Name | Value |
   |---|---|
   | `API_URL` | `https://crm-backend-YOUR-ORG.koyeb.app/api/v1` |
6. **Exposed port:** `80`
7. **Deploy**.

The frontend image reads `API_URL` at container startup and rewrites the bundled JS — so you don't need to rebuild to point at a different backend.

### B5 · Lock down CORS
Backend service → **Environment** → update `BACKEND_CORS_ORIGINS` to your frontend URL (e.g. `https://crm-frontend-YOUR-ORG.koyeb.app`). Save → auto-redeploys.

### B6 · Log in
Open the frontend URL and log in with `admin@crm.io / admin123`.

---

## Option C · Deploy on Fly.io

Requires credit card at signup (not charged on free tier). Has generous free allowance and supports Docker natively.

```bash
# install flyctl: https://fly.io/docs/hands-on/install-flyctl/
flyctl auth signup

# backend
cd backend
flyctl launch --no-deploy      # creates fly.toml — accept defaults, skip Postgres if using Neon
flyctl secrets set DATABASE_URL="postgresql+psycopg2://..." \
                   SECRET_KEY="$(openssl rand -base64 48)" \
                   BACKEND_CORS_ORIGINS="*" \
                   SEED_ON_STARTUP=true
flyctl deploy

# frontend
cd ../frontend
flyctl launch --no-deploy
flyctl secrets set API_URL="https://crm-backend.fly.dev/api/v1"
flyctl deploy
```

---

## Option D · Deploy on Render using Docker runtime

Render also supports Docker (free tier, cold starts ≤ 15 min):

1. https://render.com → New + → Web Service
2. Pick your repo → **Runtime:** Docker → **Root Directory:** `backend`
3. Add env vars (same as Koyeb step B3)
4. Deploy

Repeat for frontend with Root Directory `frontend` and port `80`.

---

## Option E · Self-host on any VPS

Any VPS with Docker installed:

```bash
git clone https://github.com/imtalhakhannn/CRM-SOFTWARE-COMPLETE.git
cd CRM-SOFTWARE-COMPLETE
SEED_ON_STARTUP=true docker compose up -d --build
```

Open port 8080 (frontend) and 8000 (backend) in your firewall. Add a reverse proxy (Caddy / Traefik / nginx) for HTTPS.

---

## Building and pushing images manually

If you want to push to GitHub Container Registry (ghcr.io) and deploy from there:

```bash
# Login (one time)
echo "YOUR_GITHUB_PAT" | docker login ghcr.io -u imtalhakhannn --password-stdin

# Backend
docker build -t ghcr.io/imtalhakhannn/crm-backend:latest ./backend
docker push ghcr.io/imtalhakhannn/crm-backend:latest

# Frontend — bake in your deployed API URL at build time
docker build \
  --build-arg VITE_API_URL=https://YOUR-BACKEND/api/v1 \
  -t ghcr.io/imtalhakhannn/crm-frontend:latest ./frontend
docker push ghcr.io/imtalhakhannn/crm-frontend:latest
```

Then on any platform that accepts a pre-built Docker image (Koyeb → Docker image source, Fly → `fly deploy --image`, etc.), point at these tags.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `docker compose up` → backend keeps restarting | Wait ~30 s for MySQL healthcheck to pass. First boot is slowest. |
| Frontend shows network error | `BACKEND_CORS_ORIGINS` on backend must include the frontend URL. |
| Backend log: `could not translate host name "db"` | Running backend outside compose. Use a real `DATABASE_URL` pointing at an external DB. |
| Koyeb build fails on `mysqlclient` | Dockerfile uses `pymysql`, no compile step needed. If still failing, check that `requirements.txt` is intact. |
| Cold-start 30+ s on Koyeb/Render | Normal on free tiers. Paid plans keep containers warm. |

---

## Cheap cheatsheet

```bash
# Everything local
docker compose up --build

# Wipe DB and start fresh
docker compose down -v && SEED_ON_STARTUP=true docker compose up --build

# Tail backend logs only
docker compose logs -f backend

# One-off shell in the backend container
docker compose exec backend bash

# Re-seed without restart
docker compose exec backend python seed.py --fresh
```
