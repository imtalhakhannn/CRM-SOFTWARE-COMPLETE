from datetime import date, datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.application import Application, ApplicationStatus
from app.models.contact import Contact, ContactType
from app.models.invoice import Invoice
from app.models.task import Task, TaskStatus
from app.models.user import User

router = APIRouter()


def _date_bounds(start: Optional[date], end: Optional[date]):
    start_dt = datetime.combine(start or date.today() - timedelta(days=30), datetime.min.time())
    end_dt = datetime.combine(end or date.today() + timedelta(days=1), datetime.min.time())
    return start_dt, end_dt


@router.get("/summary")
def summary(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
    start: Optional[date] = Query(None),
    end: Optional[date] = Query(None),
):
    s, e = _date_bounds(start, end)

    new_contacts = db.query(Contact).filter(Contact.created_at >= s, Contact.created_at < e).count()
    new_leads = db.query(Contact).filter(Contact.type == ContactType.LEAD, Contact.created_at >= s, Contact.created_at < e).count()
    new_clients = db.query(Contact).filter(Contact.type == ContactType.CLIENT, Contact.created_at >= s, Contact.created_at < e).count()

    apps_total = db.query(Application).filter(Application.created_at >= s, Application.created_at < e).count()
    apps_completed = (
        db.query(Application)
        .filter(Application.status == ApplicationStatus.COMPLETED, Application.created_at >= s, Application.created_at < e)
        .count()
    )

    revenue = (
        db.query(func.coalesce(func.sum(Invoice.amount_paid), 0))
        .filter(Invoice.issue_date >= (start or date.today() - timedelta(days=30)))
        .scalar()
    ) or 0

    tasks_completed = (
        db.query(Task)
        .filter(Task.status == TaskStatus.COMPLETED, Task.updated_at >= s, Task.updated_at < e)
        .count()
    )

    return {
        "range": {"start": (start or date.today() - timedelta(days=30)).isoformat(), "end": (end or date.today()).isoformat()},
        "new_contacts": new_contacts,
        "new_leads": new_leads,
        "new_clients": new_clients,
        "applications_total": apps_total,
        "applications_completed": apps_completed,
        "revenue": float(revenue),
        "tasks_completed": tasks_completed,
    }


@router.get("/applications-by-status")
def apps_by_status(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    rows = db.query(Application.status, func.count(Application.id)).group_by(Application.status).all()
    return [{"status": s.value if s else "unknown", "count": c} for s, c in rows]


@router.get("/contacts-by-type")
def contacts_by_type(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    rows = db.query(Contact.type, func.count(Contact.id)).group_by(Contact.type).all()
    return [{"type": t.value if t else "unknown", "count": c} for t, c in rows]


@router.get("/revenue-monthly")
def revenue_monthly(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    """DB-agnostic monthly aggregation (works on SQLite, MySQL and Postgres)."""
    from collections import defaultdict

    rows = db.query(Invoice.issue_date, Invoice.amount_paid, Invoice.total).all()
    agg = defaultdict(lambda: {"paid": 0.0, "invoiced": 0.0})
    for issue_date, paid, total in rows:
        month = issue_date.strftime("%Y-%m") if issue_date else "unknown"
        agg[month]["paid"] += float(paid or 0)
        agg[month]["invoiced"] += float(total or 0)
    return [{"month": m, **v} for m, v in sorted(agg.items())]
