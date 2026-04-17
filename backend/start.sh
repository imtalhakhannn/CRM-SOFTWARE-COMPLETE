#!/usr/bin/env bash
# Production startup: run pending migrations, optionally seed, then launch uvicorn.
set -e

echo "[start] applying migrations..."
alembic upgrade head

# Optional one-off seeding on first boot: set SEED_ON_STARTUP=true in the env,
# deploy, then remove the env var so subsequent restarts don't reseed.
if [ "${SEED_ON_STARTUP,,}" = "true" ]; then
  echo "[start] SEED_ON_STARTUP=true detected — running seed script"
  python seed.py --fresh || echo "[start] seed failed (ok if already seeded)"
fi

echo "[start] launching uvicorn on port ${PORT:-8000}..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
