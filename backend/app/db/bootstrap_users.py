"""Last-line-of-defense user bootstrap.

Runs on every FastAPI startup. If the users table is missing the seeded
demo accounts (admin@crm.io, abrar@gmail.com, etc.), recreate them here so
login always works — even if seed.py crashed during container start.

Idempotent: each user is upserted by email, so safe to call on every boot.
"""
import logging

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.user import User, UserRole

log = logging.getLogger(__name__)


# (email, password, full_name, role)
_DEFAULT_USERS = [
    ("admin@crm.io",      "admin123",      "Admin User",     UserRole.SUPER_ADMIN),
    ("abrar@gmail.com",   "abrar123",      "Abrar",          UserRole.SUPER_ADMIN),
    ("manager@crm.io",    "manager123",    "Sarah Mitchell", UserRole.MANAGER),
    ("consultant@crm.io", "consultant123", "Sajjad Ali Syed", UserRole.CONSULTANT),
    ("priya@crm.io",      "demo123",       "Priya Sharma",   UserRole.CONSULTANT),
    ("james@crm.io",      "demo123",       "James Park",     UserRole.AGENT),
    ("fatima@crm.io",     "demo123",       "Fatima Khan",    UserRole.AGENT),
    ("liam@crm.io",       "demo123",       "Liam O'Brien",   UserRole.AGENT),
]


def ensure_default_users() -> None:
    """Create any missing demo users. Never raises — login must not block startup."""
    db: Session = SessionLocal()
    try:
        existing = {e for (e,) in db.query(User.email).all()}
        created = 0
        for email, password, full_name, role in _DEFAULT_USERS:
            if email in existing:
                continue
            try:
                db.add(User(
                    email=email,
                    full_name=full_name,
                    role=role,
                    hashed_password=hash_password(password),
                    is_active=True,
                ))
                db.commit()
                created += 1
            except SQLAlchemyError as e:
                db.rollback()
                log.warning("ensure_default_users: failed to create %s (%s)", email, e)
        if created:
            log.info("ensure_default_users: created %d missing demo user(s)", created)
    except SQLAlchemyError as e:
        log.error("ensure_default_users: query failed (%s) — skipping bootstrap", e)
    finally:
        db.close()
