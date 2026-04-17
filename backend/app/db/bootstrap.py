"""Ensure the target database exists before SQLAlchemy connects to it.

For local MySQL/Postgres we try to `CREATE DATABASE IF NOT EXISTS`. For
managed cloud providers (Neon, Supabase, PlanetScale, RDS) the database is
pre-created and the user rarely has CREATEDB permission — so errors here
are logged and swallowed.
"""
import logging
import os
from urllib.parse import urlparse, urlunparse

from sqlalchemy import create_engine, text

from app.core.config import settings

log = logging.getLogger(__name__)


def _is_managed_host(host: str) -> bool:
    """Heuristic: cloud-managed Postgres/MySQL hosts. Skip auto-create there."""
    if not host:
        return False
    suspects = (
        "neon.tech", "supabase.co", "planetscale", "amazonaws.com",
        "azure.com", "digitalocean.com", "render.com", "railway.app",
        "aivencloud.com", "googlecloud", "cloudsql",
    )
    return any(s in host for s in suspects)


def ensure_database() -> None:
    url = settings.DATABASE_URL
    if url.startswith("sqlite"):
        return

    # Explicit opt-out for production
    if os.environ.get("SKIP_DB_BOOTSTRAP", "").lower() in ("1", "true", "yes"):
        return

    parsed = urlparse(url)
    db_name = parsed.path.lstrip("/").split("?", 1)[0]
    if not db_name:
        return

    if _is_managed_host(parsed.hostname or ""):
        log.info("Managed DB host detected (%s) — skipping CREATE DATABASE", parsed.hostname)
        return

    server_url = urlunparse(parsed._replace(path="/"))

    try:
        if url.startswith("mysql"):
            engine = create_engine(server_url, isolation_level="AUTOCOMMIT")
            with engine.connect() as conn:
                conn.execute(
                    text(
                        f"CREATE DATABASE IF NOT EXISTS `{db_name}` "
                        "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
                    )
                )
            engine.dispose()
        elif url.startswith("postgresql"):
            engine = create_engine(server_url, isolation_level="AUTOCOMMIT")
            with engine.connect() as conn:
                exists = conn.execute(
                    text("SELECT 1 FROM pg_database WHERE datname = :n"), {"n": db_name}
                ).scalar()
                if not exists:
                    conn.execute(text(f'CREATE DATABASE "{db_name}"'))
            engine.dispose()
    except Exception as e:
        log.warning("ensure_database() failed (%s) — continuing; the DB likely already exists", e)
