#!/usr/bin/env bash
# Production startup: run pending migrations, seed demo data when the DB is
# empty, then launch uvicorn. Idempotent — safe to run on every container
# boot, including ephemeral filesystems (Hugging Face Spaces, Render free
# tier, etc.) where the DB is recreated from scratch on each restart.
set -e

echo "[start] applying migrations..."
# Don't let alembic kill the container if a migration is broken on the
# current dialect — seed.py will call Base.metadata.create_all to fill any
# gaps. Surface the error so it's visible in logs.
alembic upgrade head || echo "[start] alembic upgrade failed — seed will create_all as fallback"

if [ "${FORCE_RESEED,,}" = "true" ]; then
  echo "[start] FORCE_RESEED=true — wiping and re-seeding"
  python seed.py --fresh
elif [ "${SEED_ON_STARTUP,,}" = "true" ]; then
  echo "[start] SEED_ON_STARTUP=true — wiping and re-seeding"
  python seed.py --fresh
else
  # Idempotent: only seeds if the users table is empty. Errors propagate.
  echo "[start] seeding demo data if DB is empty..."
  python seed.py --if-empty
fi

echo "[start] launching uvicorn on port ${PORT:-8000}..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
