#!/usr/bin/env bash
# Production startup: run pending migrations, optionally seed, then launch uvicorn.
set -e

# Auto-seed on first boot when using the default SQLite file — if the DB file
# doesn't exist yet, we seed demo data so the app is usable immediately.
if [[ "${DATABASE_URL:-}" == sqlite:////data/crm.db ]] && [ ! -f /data/crm.db ]; then
  export SEED_ON_STARTUP="${SEED_ON_STARTUP:-true}"
  echo "[start] first boot with SQLite — enabling SEED_ON_STARTUP"
fi

echo "[start] applying migrations..."
alembic upgrade head

# Optional seeding: set SEED_ON_STARTUP=true in the env, deploy, then remove
# the env var so subsequent restarts don't reseed.
if [ "${SEED_ON_STARTUP,,}" = "true" ]; then
  echo "[start] SEED_ON_STARTUP=true detected — running seed script"
  python seed.py --fresh || echo "[start] seed failed (ok if already seeded)"
fi

echo "[start] launching uvicorn on port ${PORT:-8000}..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
