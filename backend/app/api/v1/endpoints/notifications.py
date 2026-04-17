from datetime import date, datetime, timedelta, timezone
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.application import Application, ApplicationStatus
from app.models.invoice import Invoice, InvoiceStatus
from app.models.task import Appointment, Task, TaskStatus
from app.models.user import User

router = APIRouter()


@router.get("/")
def list_notifications(db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    """Aggregate notifications relevant to the current user.

    Returns a list of {id, type, title, subtitle, severity, link, created_at}.
    Read-state is tracked client-side via localStorage (last_seen timestamp).
    """
    now = datetime.now(timezone.utc)
    today_start = datetime.combine(date.today(), datetime.min.time()).replace(tzinfo=timezone.utc)
    today_end = today_start + timedelta(days=1)
    week_ahead = today_start + timedelta(days=7)

    items: List[dict] = []

    # Overdue tasks (assigned to me)
    overdue_tasks = (
        db.query(Task)
        .filter(
            Task.due_date < now,
            Task.status != TaskStatus.COMPLETED,
            Task.status != TaskStatus.CANCELLED,
            Task.assignee_id == current.id,
        )
        .all()
    )
    for t in overdue_tasks:
        items.append({
            "id": f"task-overdue-{t.id}",
            "type": "task_overdue",
            "title": f"Overdue: {t.title}",
            "subtitle": f"Due {t.due_date.strftime('%b %d, %H:%M')}" if t.due_date else "Overdue",
            "severity": "danger",
            "link": "/tasks",
            "created_at": t.due_date.isoformat() if t.due_date else now.isoformat(),
        })

    # Tasks due today (not overdue, not completed)
    tasks_today = (
        db.query(Task)
        .filter(
            Task.due_date >= now,
            Task.due_date < today_end,
            Task.status != TaskStatus.COMPLETED,
            Task.assignee_id == current.id,
        )
        .all()
    )
    for t in tasks_today:
        items.append({
            "id": f"task-today-{t.id}",
            "type": "task_due_today",
            "title": t.title,
            "subtitle": f"Due today at {t.due_date.strftime('%H:%M')}" if t.due_date else "Due today",
            "severity": "warning",
            "link": "/tasks",
            "created_at": t.due_date.isoformat() if t.due_date else now.isoformat(),
        })

    # Today's appointments
    appointments = (
        db.query(Appointment)
        .filter(Appointment.start_at >= today_start, Appointment.start_at < today_end)
        .all()
    )
    for a in appointments:
        items.append({
            "id": f"appt-{a.id}",
            "type": "appointment_today",
            "title": a.title,
            "subtitle": f"{a.start_at.strftime('%H:%M')}{' · ' + a.location if a.location else ''}",
            "severity": "info",
            "link": "/dashboard",
            "created_at": a.start_at.isoformat(),
        })

    # Upcoming appointments next 7 days (not today)
    upcoming_appts = (
        db.query(Appointment)
        .filter(Appointment.start_at >= today_end, Appointment.start_at < week_ahead)
        .all()
    )
    for a in upcoming_appts:
        items.append({
            "id": f"appt-upc-{a.id}",
            "type": "appointment_upcoming",
            "title": f"Upcoming: {a.title}",
            "subtitle": a.start_at.strftime("%a %b %d, %H:%M"),
            "severity": "info",
            "link": "/dashboard",
            "created_at": a.start_at.isoformat(),
        })

    # Overdue invoices
    overdue_invoices = (
        db.query(Invoice)
        .filter(
            Invoice.due_date < date.today(),
            Invoice.status.in_([InvoiceStatus.SENT, InvoiceStatus.PARTIALLY_PAID]),
        )
        .all()
    )
    for inv in overdue_invoices:
        items.append({
            "id": f"invoice-overdue-{inv.id}",
            "type": "invoice_overdue",
            "title": f"Overdue invoice {inv.reference}",
            "subtitle": f"{inv.currency} {inv.total - inv.amount_paid:.2f} outstanding",
            "severity": "danger",
            "link": "/accounts",
            "created_at": datetime.combine(inv.due_date, datetime.min.time()).isoformat() if inv.due_date else now.isoformat(),
        })

    # Applications stuck in NEW for > 7 days (anyone's)
    week_ago = now - timedelta(days=7)
    stalled = (
        db.query(Application)
        .filter(Application.status == ApplicationStatus.NEW, Application.created_at < week_ago)
        .limit(5)
        .all()
    )
    for a in stalled:
        items.append({
            "id": f"app-stalled-{a.id}",
            "type": "application_stalled",
            "title": f"Stalled: {a.title}",
            "subtitle": f"{a.reference} — no activity in 7+ days",
            "severity": "warning",
            "link": "/applications",
            "created_at": a.created_at.isoformat(),
        })

    items.sort(key=lambda x: x["created_at"], reverse=True)
    return {"items": items, "total": len(items)}
