# Free Deployment Guide

Deploy your CRM **100% free, no credit card**, in ~15 minutes:

| Piece      | Host           | Cost | Cold starts |
|------------|----------------|------|-------------|
| Database   | **Neon**       | Free | None (serverless Postgres) |
| Backend    | **Render**     | Free | ~30 s after 15 min idle |
| Frontend   | **Vercel**     | Free | None (global CDN) |

> File uploads: Render's free tier has an **ephemeral filesystem** — files are wiped on redeploy/restart. Fine for a demo. For production use, swap `UPLOAD_DIR` to a mounted disk (paid) or switch to **Cloudinary** / **Supabase Storage** / **AWS S3**.

---

## 0 · Prerequisites

- A **GitHub** account, with this project pushed to a public or private repo.
- A free account on **Neon**, **Render**, and **Vercel**.

If you haven't pushed to GitHub yet:

```bash
cd CRM-SOFTWARE
git init
git add .
git commit -m "Initial CRM"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/crm-software.git
git push -u origin main
```

---

## 1 · Provision a free Postgres database on Neon

1. Go to **https://neon.tech** → sign up with GitHub/Google (no credit card).
2. Create a new **Project** → name it `crm`, pick any region close to you.
3. On the project dashboard, click **Connection string → Pooled connection**.
4. Copy the string. It looks like:
   ```
   postgresql://neondb_owner:abc123XYZ@ep-rough-sun-12345-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
5. **Important:** change the scheme to `postgresql+psycopg2://` so SQLAlchemy picks the right driver:
   ```
   postgresql+psycopg2://neondb_owner:abc123XYZ@ep-rough-sun-12345-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

Keep this string — you'll paste it into Render in step 2.

---

## 2 · Deploy the backend on Render

### 2.1 Create the service

1. Go to **https://render.com** → log in with GitHub.
2. Click **New +** → **Blueprint**.
3. Connect the GitHub repo containing this project.
4. Render detects `render.yaml` at the repo root and proposes a service named `crm-backend`. Click **Apply**.

### 2.2 Fill in the env vars

Render will open the service page. Click **Environment** in the left sidebar and set:

| Key                      | Value |
|--------------------------|-------|
| `DATABASE_URL`           | *paste the Neon connection string from step 1* |
| `BACKEND_CORS_ORIGINS`   | `http://localhost:5173` *(for now — update after step 3)* |
| `SEED_ON_STARTUP`        | `true` *(only for the first deploy)* |

The other vars (`SECRET_KEY`, `UPLOAD_DIR`, etc.) are already set by `render.yaml`.

### 2.3 Deploy

Click **Manual Deploy → Deploy latest commit**. Watch the logs:

```
[start] applying migrations...
INFO  [alembic.runtime.migration] Running upgrade  -> 21ab0d085827
INFO  [alembic.runtime.migration] Running upgrade 21ab0d085827 -> c65b685453cd
[start] SEED_ON_STARTUP=true detected — running seed script
[OK] Seed complete.
[start] launching uvicorn on port 10000...
INFO:     Uvicorn running on http://0.0.0.0:10000
```

### 2.4 Flip the seed flag back off

Once you see `[OK] Seed complete.`, go back to **Environment** and change `SEED_ON_STARTUP` to `false` (or delete it). This prevents data being wiped on every restart.

### 2.5 Grab your backend URL

At the top of the service page you'll see something like:
```
https://crm-backend-abcd.onrender.com
```
Test it:
```
https://crm-backend-abcd.onrender.com/health   →  {"status":"ok"}
https://crm-backend-abcd.onrender.com/docs     →  Swagger UI
```

---

## 3 · Deploy the frontend on Vercel

1. Go to **https://vercel.com** → log in with GitHub.
2. Click **Add New → Project** → import the same repo.
3. On the configure screen:
   - **Root Directory** → click Edit → select `frontend`
   - **Framework Preset** → Vite (auto-detected)
   - **Build Command** → `npm run build` (auto)
   - **Output Directory** → `dist` (auto)
4. Expand **Environment Variables** and add:
   | Key              | Value |
   |------------------|-------|
   | `VITE_API_URL`   | `https://crm-backend-abcd.onrender.com/api/v1` *(from step 2.5, with `/api/v1`)* |
5. Click **Deploy**. ~1 min later you get a URL like `https://crm-software-xyz.vercel.app`.

---

## 4 · Connect frontend ↔ backend (CORS)

Go back to Render → your backend service → **Environment**. Update:

```
BACKEND_CORS_ORIGINS = https://crm-software-xyz.vercel.app
```

(Use the actual URL from step 3. For multiple origins, comma-separate them: `https://a.vercel.app,https://b.vercel.app`.)

Render will automatically redeploy with the new env var.

---

## 5 · Log in 🎉

Open `https://crm-software-xyz.vercel.app` and sign in:

| Email | Password |
|---|---|
| `admin@crm.io` | `admin123` |
| `manager@crm.io` | `manager123` |
| `consultant@crm.io` | `consultant123` |

**First request takes ~30 s** while the Render free instance cold-starts. Subsequent requests are instant until another 15 min idle.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Vercel shows **"Failed to fetch"** or login stuck | `BACKEND_CORS_ORIGINS` on Render doesn't match the Vercel URL. Check exact spelling, no trailing slash. |
| Render log: `UndefinedTable` / `no such table` | Migrations didn't run. Re-deploy; `start.sh` runs `alembic upgrade head` every boot. |
| Render log: `could not connect to server` | `DATABASE_URL` wrong. It must start with `postgresql+psycopg2://` and include `?sslmode=require`. |
| Login: **401 Unauthorized** | `SEED_ON_STARTUP` was never flipped to `true`, so no users exist. Flip it once, redeploy, then flip back. |
| Uploaded documents disappear | Render free disk is ephemeral. Use Cloudinary/S3 for persistence. |
| First page load is slow | Render free tier cold-start. Upgrade to Starter ($7/mo) for always-on, or keep it free and accept ~30 s first hit. |

---

## Alternative providers

| Backend | Frontend | Database |
|---|---|---|
| Railway ($5 trial) | Netlify (`netlify.toml` included) | Supabase (Postgres) |
| Fly.io (free w/ CC) | Cloudflare Pages | Aiven MySQL (free tier) |
| Koyeb (1 free app) | GitHub Pages (not SPA-friendly) | Turso (libsql) |

If you use Netlify for the frontend, the included `netlify.toml` handles SPA rewrites automatically.

---

## Local production test

Before pushing, run a local mock of the production setup:

```bash
# backend — mimic Render
cd backend
.venv\Scripts\activate
export DATABASE_URL=postgresql+psycopg2://...   # your Neon string
export PORT=8000
bash start.sh

# frontend — build & preview
cd frontend
VITE_API_URL=http://localhost:8000/api/v1 npm run build
npm run preview    # serves dist/ on http://localhost:4173
```
